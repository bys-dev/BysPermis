/**
 * @jest-environment node
 */

import { normaliser, scoreTexte, termes } from "@/lib/search/text";
import {
  classerFormations,
  coordsCentre,
  estTri,
  resoudreLieu,
  type FormationRecherche,
} from "@/lib/search/formations";

// ─── Helpers ──────────────────────────────────────────────────

const DEMAIN = new Date(Date.now() + 86_400_000);
const DANS_UN_MOIS = new Date(Date.now() + 30 * 86_400_000);

function formation(over: Partial<FormationRecherche> = {}): FormationRecherche {
  return {
    titre: "Stage de récupération de points",
    description: "Stage agréé préfecture sur 2 jours.",
    prix: 230,
    lieu: null,
    centre: { nom: "Centre Test", ville: "Cergy", codePostal: "95000", latitude: null, longitude: null },
    categorie: { nom: "Récupération de points" },
    sessions: [{ dateDebut: DANS_UN_MOIS }],
    ...over,
  };
}

// Paris est dans le référentiel : sert de point de référence stable.
const PARIS = { lat: 48.8566, lng: 2.3522 };

// ─── Normalisation ────────────────────────────────────────────

describe("normaliser", () => {
  it("supprime les accents et la casse", () => {
    expect(normaliser("Récupération")).toBe("recuperation");
    expect(normaliser("Saint-Étienne")).toBe("saint etienne");
    expect(normaliser("SAINT OUEN L'AUMÔNE")).toBe("saint ouen l aumone");
  });

  it("rend équivalentes les écritures d'une même commune", () => {
    expect(normaliser("Saint-Étienne")).toBe(normaliser("saint etienne"));
    expect(normaliser("CERGY")).toBe(normaliser("Cergy"));
  });
});

describe("termes", () => {
  it("écarte les mots vides et le mot « stage », qui ne discrimine rien", () => {
    expect(termes("stage de récupération de points")).toEqual(["recuperation", "points"]);
  });

  it("conserve la requête telle quelle si elle n'est faite que de mots vides", () => {
    expect(termes("stage")).toEqual(["stage"]);
  });
});

describe("scoreTexte", () => {
  const champs = [
    { valeur: "Cergy", poids: 6 },
    { valeur: "Centre Auto Formation", poids: 5 },
  ];

  it("classe le mot exact devant le préfixe, et le préfixe devant l'inclusion", () => {
    const exact = scoreTexte(champs, ["cergy"]);
    const prefixe = scoreTexte(champs, ["cerg"]);
    expect(exact).toBeGreaterThan(prefixe);
    expect(prefixe).toBeGreaterThan(0);
  });

  it("exige que tous les termes correspondent — c'est un ET", () => {
    expect(scoreTexte(champs, ["cergy", "introuvable"])).toBe(0);
  });

  it("ignore les accents des deux côtés", () => {
    expect(scoreTexte([{ valeur: "Récupération", poids: 4 }], ["recuperation"])).toBeGreaterThan(0);
  });
});

// ─── Géolocalisation ──────────────────────────────────────────

describe("coordsCentre", () => {
  it("préfère les coordonnées saisies", () => {
    const coords = coordsCentre({ nom: "X", ville: "Cergy", latitude: 49.03, longitude: 2.07 });
    expect(coords).toEqual({ lat: 49.03, lng: 2.07 });
  });

  it("retombe sur la commune du référentiel quand le centre n'a pas de GPS", () => {
    // Sans ce repli, un centre sans latitude était purement exclu de toute
    // recherche par proximité — donc invisible.
    const coords = coordsCentre({ nom: "X", ville: "PARIS", latitude: null, longitude: null });
    expect(coords).not.toBeNull();
    expect(coords!.lat).toBeCloseTo(48.85, 1);
  });

  it("renvoie null pour une commune hors référentiel et sans GPS", () => {
    expect(
      coordsCentre({ nom: "X", ville: "Trifouillis-les-Oies", latitude: null, longitude: null }),
    ).toBeNull();
  });
});

describe("resoudreLieu", () => {
  it("résout une ville du référentiel sans appel réseau", () => {
    const coords = resoudreLieu("paris");
    expect(coords?.lat).toBeCloseTo(48.85, 1);
  });

  it("tolère les accents et la casse", () => {
    expect(resoudreLieu("SAINT-ÉTIENNE")).not.toBeNull();
  });

  it("résout un code postal", () => {
    expect(resoudreLieu("75001")).not.toBeNull();
  });

  it("renvoie null sur une commune inconnue, laissant la main au géocodeur", () => {
    expect(resoudreLieu("Trifouillis-les-Oies")).toBeNull();
  });
});

// ─── Classement ───────────────────────────────────────────────

describe("classerFormations — recherche texte", () => {
  it("trouve « recuperation » sans accent (le filtre SQL n'y arrivait pas)", () => {
    const { resultats } = classerFormations([formation()], {
      termesRecherche: termes("recuperation de points"),
    });
    expect(resultats).toHaveLength(1);
  });

  it("écarte les formations qui ne correspondent pas à tous les termes", () => {
    const { resultats } = classerFormations([formation({ centre: { nom: "A", ville: "Lyon", latitude: null, longitude: null } })], {
      termesRecherche: termes("marseille"),
    });
    expect(resultats).toHaveLength(0);
  });

  it("remonte la ville avant la description", () => {
    const surPlace = formation({
      titre: "Stage A",
      description: "sans mention",
      centre: { nom: "Centre A", ville: "Cergy", latitude: null, longitude: null },
    });
    const simpleMention = formation({
      titre: "Stage B",
      description: "Accessible depuis Cergy en RER",
      centre: { nom: "Centre B", ville: "Lyon", latitude: null, longitude: null },
    });

    const { resultats } = classerFormations([simpleMention, surPlace], {
      termesRecherche: termes("cergy"),
    });
    expect(resultats[0].titre).toBe("Stage A");
  });
});

describe("classerFormations — tri", () => {
  const cher = formation({ titre: "Cher", prix: 300, sessions: [{ dateDebut: DEMAIN }] });
  const abordable = formation({ titre: "Abordable", prix: 180, sessions: [{ dateDebut: DANS_UN_MOIS }] });

  it("trie par prix croissant", () => {
    const { resultats } = classerFormations([cher, abordable], { tri: "prix_asc" });
    expect(resultats.map((r) => r.titre)).toEqual(["Abordable", "Cher"]);
  });

  it("trie par date de prochaine session — pas par date de création", () => {
    // Le tri « Date » s'appuyait sur `createdAt` : l'internaute qui cherchait
    // le stage le plus proche obtenait la fiche la plus récemment saisie.
    const { resultats } = classerFormations([abordable, cher], { tri: "date" });
    expect(resultats.map((r) => r.titre)).toEqual(["Cher", "Abordable"]);
  });

  it("relègue en fin de liste une formation sans session datée", () => {
    const sansDate = formation({ titre: "Sans date", sessions: [] });
    const { resultats } = classerFormations([sansDate, cher], { tri: "date" });
    expect(resultats[resultats.length - 1].titre).toBe("Sans date");
  });
});

describe("classerFormations — proximité", () => {
  const paris = formation({
    titre: "Paris",
    centre: { nom: "Centre Paris", ville: "Paris", latitude: 48.8566, longitude: 2.3522 },
  });
  const marseille = formation({
    titre: "Marseille",
    centre: { nom: "Centre Marseille", ville: "Marseille", latitude: 43.2965, longitude: 5.3698 },
  });

  it("calcule la distance et applique le rayon", () => {
    const { resultats, elargi } = classerFormations([marseille, paris], {
      origine: PARIS,
      rayonKm: 25,
    });
    expect(resultats.map((r) => r.titre)).toEqual(["Paris"]);
    expect(resultats[0].distance).toBeLessThan(5);
    expect(elargi).toBe(false);
  });

  it("inclut un centre sans GPS grâce au référentiel communal", () => {
    // Le cas exact du seul centre actif en production : aucune coordonnée
    // saisie. Il était auparavant absent de toute recherche géolocalisée.
    const sansGps = formation({
      titre: "Sans GPS",
      centre: { nom: "Centre", ville: "Paris", codePostal: "75001", latitude: null, longitude: null },
    });
    const { resultats } = classerFormations([sansGps], { origine: PARIS, rayonKm: 25 });
    expect(resultats).toHaveLength(1);
    expect(resultats[0].distance).not.toBeNull();
  });

  it("élargit le rayon plutôt que de renvoyer une page vide", () => {
    const { resultats, elargi } = classerFormations([marseille], { origine: PARIS, rayonKm: 25 });
    expect(elargi).toBe(true);
    expect(resultats).toHaveLength(1);
    expect(resultats[0].titre).toBe("Marseille");
  });

  it("n'élargit pas quand il n'y a réellement rien à proposer", () => {
    const { resultats, elargi } = classerFormations([], { origine: PARIS, rayonKm: 25 });
    expect(elargi).toBe(false);
    expect(resultats).toHaveLength(0);
  });
});

describe("classerFormations — commune hors référentiel", () => {
  it("reste un filtre textuel faute de coordonnées, au lieu de tout renvoyer", () => {
    const osny = formation({
      titre: "Osny",
      centre: { nom: "Centre", ville: "Osny", latitude: null, longitude: null },
    });
    const lyon = formation({
      titre: "Lyon",
      centre: { nom: "Centre", ville: "Lyon", latitude: null, longitude: null },
    });

    const { resultats } = classerFormations([osny, lyon], { villeRecherchee: "osny" });
    expect(resultats.map((r) => r.titre)).toEqual(["Osny"]);
  });
});

describe("classerFormations — priorité BYS", () => {
  const bys = formation({ titre: "BYS", prix: 300, centre: { nom: "BYS Permis Osny", ville: "Osny", latitude: null, longitude: null } });
  const autre = formation({ titre: "Autre", prix: 180, centre: { nom: "Autre centre", ville: "Osny", latitude: null, longitude: null } });

  it("passe devant à pertinence égale", () => {
    const { resultats } = classerFormations([autre, bys], { tri: "pertinence" });
    expect(resultats[0].titre).toBe("BYS");
  });

  it("ne fausse jamais un tri par prix", () => {
    // Le classement BYS était appliqué côté client, après pagination : l'ordre
    // changeait d'une page à l'autre et pouvait contredire le tri demandé.
    const { resultats } = classerFormations([bys, autre], { tri: "prix_asc" });
    expect(resultats.map((r) => r.titre)).toEqual(["Autre", "BYS"]);
  });
});

describe("estTri", () => {
  it("ne retient que les tris connus", () => {
    expect(estTri("prix_asc")).toBe(true);
    expect(estTri("createdAt")).toBe(false);
    expect(estTri(null)).toBe(false);
  });
});
