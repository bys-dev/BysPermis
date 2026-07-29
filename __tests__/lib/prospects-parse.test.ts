import {
  autoMapColumns,
  normalizeHeader,
  FIELD_LABELS,
  PROSPECT_FIELDS,
} from "@/lib/prospects/fields";
import {
  parseProspectFile,
  normalizeRows,
  normalizeRow,
  detectFormat,
  cleanEmail,
  cleanPhone,
  cleanSiret,
  cleanWebsite,
  departementFromCodePostal,
} from "@/lib/prospects/parse";
import { computeDedupeKey } from "@/lib/prospects/import";

describe("normalizeHeader", () => {
  it("retire les accents, la casse et la ponctuation", () => {
    expect(normalizeHeader("N° d'Agrément")).toBe("n d agrement");
    expect(normalizeHeader("  Code_Postal  ")).toBe("code postal");
    expect(normalizeHeader("E-MAIL")).toBe("e mail");
  });
});

describe("autoMapColumns", () => {
  it("reconnaît les en-têtes usuels d'une liste préfectorale", () => {
    const mapping = autoMapColumns([
      "Nom du centre",
      "Raison sociale",
      "N° d'agrément",
      "Adresse",
      "Code postal",
      "Commune",
      "Téléphone",
      "Courriel",
    ]);

    expect(mapping["Nom du centre"]).toBe("nom");
    expect(mapping["Raison sociale"]).toBe("raisonSociale");
    expect(mapping["N° d'agrément"]).toBe("agrementNumber");
    expect(mapping["Code postal"]).toBe("codePostal");
    expect(mapping["Commune"]).toBe("ville");
    expect(mapping["Téléphone"]).toBe("telephone");
    expect(mapping["Courriel"]).toBe("email");
  });

  it("n'attribue jamais deux fois le même champ — la première colonne gagne", () => {
    const mapping = autoMapColumns(["Email", "Email 2"]);
    expect(mapping["Email"]).toBe("email");
    expect(mapping["Email 2"]).not.toBe("email");
  });

  it("laisse à null les colonnes non reconnues", () => {
    const mapping = autoMapColumns(["Colonne exotique XYZ"]);
    expect(mapping["Colonne exotique XYZ"]).toBeNull();
  });

  it("distingue le département d'agrément du département du centre", () => {
    const mapping = autoMapColumns(["Département agrément", "Département"]);
    expect(mapping["Département agrément"]).toBe("agrementDepartement");
    expect(mapping["Département"]).toBe("departement");
  });

  it("expose un libellé pour chaque champ importable", () => {
    for (const field of PROSPECT_FIELDS) {
      expect(FIELD_LABELS[field]).toBeTruthy();
    }
  });
});

describe("detectFormat", () => {
  it("déduit le format de l'extension", () => {
    expect(detectFormat("liste.xlsx")).toBe("XLSX");
    expect(detectFormat("liste.csv")).toBe("CSV");
    expect(detectFormat("liste.json")).toBe("JSON");
  });

  it("refuse le .xls binaire, non lisible", () => {
    expect(detectFormat("ancien.xls")).toBeNull();
  });

  it("se rabat sur le type MIME sans extension utile", () => {
    expect(detectFormat("export", "text/csv")).toBe("CSV");
    expect(detectFormat("export", "application/json")).toBe("JSON");
  });
});

describe("nettoyage des valeurs", () => {
  it("valide et normalise les emails", () => {
    expect(cleanEmail("  CONTACT@Exemple.FR ").email).toBe("contact@exemple.fr");
    expect(cleanEmail("pas-un-email").email).toBeNull();
    expect(cleanEmail("pas-un-email").warning).toContain("illisible");
  });

  it("ne garde que la première adresse quand la cellule en contient plusieurs", () => {
    expect(cleanEmail("a@x.fr; b@y.fr").email).toBe("a@x.fr");
  });

  it("écarte les numéros de téléphone trop courts", () => {
    expect(cleanPhone("01 23 45 67 89")).toBe("0123456789");
    expect(cleanPhone("12")).toBeNull();
  });

  it("ne garde que les chiffres du SIRET", () => {
    expect(cleanSiret("908 058 092 00028")).toBe("90805809200028");
    expect(cleanSiret("")).toBeNull();
  });

  it("préfixe les sites web sans schéma", () => {
    expect(cleanWebsite("exemple.fr")).toBe("https://exemple.fr");
    expect(cleanWebsite("https://exemple.fr")).toBe("https://exemple.fr");
    expect(cleanWebsite("nimportequoi")).toBeNull();
  });

  it("déduit le département du code postal", () => {
    expect(departementFromCodePostal("95000")).toBe("95");
    expect(departementFromCodePostal("75015")).toBe("75");
    // DOM : le département tient sur trois chiffres.
    expect(departementFromCodePostal("97200")).toBe("972");
    expect(departementFromCodePostal("1234")).toBeNull();
  });
});

describe("normalizeRow", () => {
  const mapping = {
    Centre: "nom" as const,
    Mail: "email" as const,
    CP: "codePostal" as const,
    Commune: "ville" as const,
  };

  it("rejette une ligne sans nom", () => {
    const result = normalizeRow({
      row: { Centre: "", Mail: "a@b.fr", CP: "95000", Commune: "Cergy" },
      mapping,
      ligne: 4,
    });
    expect(result.input).toBeUndefined();
    expect(result.motif).toBe("Nom du centre absent");
    expect(result.ligne).toBe(4);
  });

  it("importe la ligne et dérive le département", () => {
    const result = normalizeRow({
      row: { Centre: "Centre Test", Mail: "a@b.fr", CP: "95000", Commune: "Cergy" },
      mapping,
      ligne: 2,
      defaultSource: "liste-2026",
    });
    expect(result.input?.nom).toBe("Centre Test");
    expect(result.input?.email).toBe("a@b.fr");
    expect(result.input?.departement).toBe("95");
    expect(result.input?.source).toBe("liste-2026");
    expect(result.motif).toBeUndefined();
  });

  it("conserve la ligne malgré un email illisible, avec un avertissement", () => {
    const result = normalizeRow({
      row: { Centre: "Centre Test", Mail: "n/a", CP: "95000", Commune: "Cergy" },
      mapping,
      ligne: 3,
    });
    expect(result.input).toBeDefined();
    expect(result.input?.email).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("signale un code postal invalide sans rejeter la ligne", () => {
    const result = normalizeRow({
      row: { Centre: "Centre Test", Mail: "", CP: "9500", Commune: "Cergy" },
      mapping,
      ligne: 5,
    });
    expect(result.input).toBeDefined();
    expect(result.warnings.some((w) => w.includes("Code postal"))).toBe(true);
  });
});

describe("parseProspectFile — CSV", () => {
  it("lit un CSV séparé par des points-virgules (export Excel FR)", async () => {
    const csv = "Nom du centre;Courriel;Ville;Code postal\nCentre A;a@x.fr;Cergy;95000\nCentre B;b@y.fr;Osny;95520\n";
    const parsed = await parseProspectFile({ buffer: Buffer.from(csv, "utf8"), filename: "liste.csv" });

    expect(parsed.format).toBe("CSV");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]["Nom du centre"]).toBe("Centre A");
    expect(parsed.mapping["Courriel"]).toBe("email");
  });

  it("gère les virgules comme séparateur et les champs entre guillemets", async () => {
    const csv = 'Nom,Ville\n"Centre, avec virgule",Cergy\n';
    const parsed = await parseProspectFile({ buffer: Buffer.from(csv, "utf8"), filename: "liste.csv" });
    expect(parsed.rows[0]["Nom"]).toBe("Centre, avec virgule");
  });

  it("retire le BOM UTF-8 du premier en-tête", async () => {
    const csv = "﻿Nom;Ville\nCentre A;Cergy\n";
    const parsed = await parseProspectFile({ buffer: Buffer.from(csv, "utf8"), filename: "liste.csv" });
    expect(parsed.headers[0]).toBe("Nom");
  });

  it("rejette un CSV sans ligne de données", async () => {
    await expect(
      parseProspectFile({ buffer: Buffer.from("Nom;Ville\n", "utf8"), filename: "vide.csv" }),
    ).rejects.toThrow(/en-t/i);
  });
});

describe("parseProspectFile — JSON", () => {
  it("lit un tableau d'objets", async () => {
    const json = JSON.stringify([
      { nom: "Centre A", email: "a@x.fr", ville: "Cergy" },
      { nom: "Centre B", email: "b@y.fr", ville: "Osny" },
    ]);
    const parsed = await parseProspectFile({ buffer: Buffer.from(json), filename: "liste.json" });
    expect(parsed.format).toBe("JSON");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.mapping["nom"]).toBe("nom");
  });

  it("accepte un objet enveloppe { prospects: [...] }", async () => {
    const json = JSON.stringify({ prospects: [{ nom: "Centre A", ville: "Cergy" }] });
    const parsed = await parseProspectFile({ buffer: Buffer.from(json), filename: "liste.json" });
    expect(parsed.rows).toHaveLength(1);
  });

  it("rejette un JSON invalide", async () => {
    await expect(
      parseProspectFile({ buffer: Buffer.from("{pas du json"), filename: "liste.json" }),
    ).rejects.toThrow(/JSON invalide/);
  });

  it("rejette un format non supporté", async () => {
    await expect(
      parseProspectFile({ buffer: Buffer.from("x"), filename: "liste.pdf" }),
    ).rejects.toThrow(/Format non support/);
  });
});

describe("normalizeRows", () => {
  it("numérote les lignes en tenant compte de l'en-tête", () => {
    const results = normalizeRows({
      rows: [{ Nom: "A" }, { Nom: "" }],
      mapping: { Nom: "nom" },
    });
    expect(results[0].ligne).toBe(2);
    expect(results[1].ligne).toBe(3);
    expect(results[1].motif).toBeTruthy();
  });
});

describe("computeDedupeKey", () => {
  it("privilégie l'email", () => {
    const key = computeDedupeKey({ email: "A@X.FR", siret: "123", nom: "Centre", codePostal: "95000" });
    expect(key).toBe("email:a@x.fr");
  });

  it("se rabat sur le SIRET sans email", () => {
    const key = computeDedupeKey({ email: null, siret: "908 058 092", nom: "Centre", codePostal: "95000" });
    expect(key).toBe("siret:908058092");
  });

  it("se rabat sur nom + code postal en dernier recours", () => {
    // Accents dépliés puis retirés (É → E) et ponctuation supprimée.
    const key = computeDedupeKey({ email: null, siret: null, nom: "Centre Éval'Test", codePostal: "95000" });
    expect(key).toBe("nom:centreevaltest|cp:95000");
  });

  it("donne la même clé pour deux écritures différentes du même nom", () => {
    const a = computeDedupeKey({ email: null, siret: null, nom: "Centre  De   Cergy", codePostal: "95000" });
    const b = computeDedupeKey({ email: null, siret: null, nom: "centre de cergy", codePostal: "95000" });
    expect(a).toBe(b);
  });

  it("distingue deux centres homonymes de codes postaux différents", () => {
    const a = computeDedupeKey({ email: null, siret: null, nom: "Centre", codePostal: "95000" });
    const b = computeDedupeKey({ email: null, siret: null, nom: "Centre", codePostal: "75015" });
    expect(a).not.toBe(b);
  });
});
