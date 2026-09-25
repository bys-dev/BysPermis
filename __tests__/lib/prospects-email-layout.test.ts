/**
 * @jest-environment node
 */

// `campaign.ts` tire Prisma, Resend et le journal d'emails : seules les
// fonctions pures sont testées ici.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/email", () => ({ resend: { batch: { send: jest.fn() } } }));
jest.mock("@/lib/email-log", () => ({ logEmail: jest.fn() }));

import {
  normaliserCorps,
  boutonsInscription,
  habillerEmail,
  htmlVersTexte,
  LIBELLE_BOUTON_INSCRIPTION,
} from "@/lib/prospects/email-layout";
import { analyserAdresses } from "@/lib/prospects/adresses";
import { buildProspectVariables, renderCampaignEmail, type TemplateProspect } from "@/lib/prospects/template";
import { buildAudienceWhere } from "@/lib/prospects/campaign";

const INSCRIPTION = "https://byspermis.fr/devenir-partenaire";

describe("normaliserCorps", () => {
  it("transforme du texte brut en paragraphes", () => {
    const html = normaliserCorps("Bonjour,\n\nPremière ligne\nseconde ligne\n\nCordialement");
    expect(html).toBe("<p>Bonjour,</p>\n<p>Première ligne<br/>seconde ligne</p>\n<p>Cordialement</p>");
  });

  it("ne retouche pas un contenu déjà structuré en paragraphes", () => {
    const source = "<p>Un\nparagraphe</p>\n\n<ul>\n  <li>point</li>\n</ul>";
    expect(normaliserCorps(source)).toBe("<p>Un\nparagraphe</p><ul>\n  <li>point</li>\n</ul>");
  });

  it("n'ajoute pas de <br/> après un <br/> existant", () => {
    expect(normaliserCorps("ligne<br/>\nsuite")).toBe("<p>ligne<br/>suite</p>");
  });

  it("transforme les URL nues en liens, sans toucher aux liens existants", () => {
    const html = normaliserCorps(`Voir ${INSCRIPTION}.\n\n<a href="${INSCRIPTION}">ici</a>`);
    expect(html).toContain(`<a href="${INSCRIPTION}">${INSCRIPTION}</a>.`);
    expect(html).toContain(`<a href="${INSCRIPTION}">ici</a>`);
    expect(html.match(/<a /g)).toHaveLength(2);
  });
});

describe("boutonsInscription", () => {
  it("transforme un lien d'inscription seul dans son paragraphe en bouton", () => {
    const html = boutonsInscription(`<p><a href="${INSCRIPTION}">${INSCRIPTION}</a></p>`, INSCRIPTION);
    expect(html).toContain("<table role=\"presentation\"");
    expect(html).toContain(LIBELLE_BOUTON_INSCRIPTION);
  });

  it("sépare l'introduction du lien placé après un <br/>", () => {
    const html = boutonsInscription(`<p>Déposez votre demande :<br/>\n<a href="${INSCRIPTION}">Je m'inscris</a></p>`, INSCRIPTION);
    expect(html).toMatch(/^<p>Déposez votre demande :<\/p><table/);
    expect(html).toContain(">Je m'inscris</a>");
  });

  it("laisse un lien pris dans une phrase tel quel", () => {
    const source = `<p>Rendez-vous <a href="${INSCRIPTION}">sur ce lien</a> pour vous inscrire.</p>`;
    expect(boutonsInscription(source, INSCRIPTION)).toBe(source);
  });
});

describe("habillerEmail", () => {
  const email = habillerEmail({
    sujet: "Objet",
    corpsHtml: "Bonjour,\n\nTexte",
    lienInscription: INSCRIPTION,
    desinscriptionUrl: "https://byspermis.fr/desabonnement/tok",
    fromName: "BYS Permis",
  });

  it("produit un document complet avec logo et largeur bornée", () => {
    expect(email.html).toMatch(/^<!DOCTYPE html>/);
    expect(email.html).toContain("/colored-logo.png");
    expect(email.html).toContain("max-width:600px");
    expect(email.html).toContain("/desabonnement/tok");
  });

  it("fournit une version texte avec le lien de désinscription", () => {
    expect(email.text).toContain("Bonjour,\n\nTexte");
    expect(email.text).toContain("Se désinscrire : https://byspermis.fr/desabonnement/tok");
    expect(email.text).not.toMatch(/<[a-z]/i);
  });

  it("n'utilise jamais le nom « BYS Formation »", () => {
    expect(email.html).not.toMatch(/BYS Formation/i);
  });
});

describe("htmlVersTexte", () => {
  it("écrit les liens avec leur adresse et décode les entités", () => {
    expect(htmlVersTexte('<p>Auto &amp; Co : <a href="https://x.fr">site</a></p>')).toBe("Auto & Co : site : https://x.fr");
  });
});

describe("adresses saisies à la main", () => {
  it("découpe, valide et déduplique", () => {
    const r = analyserAdresses("A@x.fr, b@y.fr; a@x.fr\nnope@ Jean <c@z.fr>", ["b@y.fr"]);
    expect(r.valides).toEqual(["a@x.fr", "c@z.fr"]);
    expect(r.doublons).toEqual(["b@y.fr", "a@x.fr"]);
    expect(r.invalides).toEqual(["nope@"]);
  });

  it("une fiche dont le nom est l'adresse est traitée comme un centre sans nom", () => {
    const fiche: TemplateProspect = { nom: "contact@x.fr", email: "contact@x.fr", unsubscribeToken: "t" };
    expect(buildProspectVariables(fiche).nom).toBe("");
    const rendu = renderCampaignEmail({ sujet: "{{nom}} — test", contenu: "<p>Au sujet de {{nom}}</p>", prospect: fiche });
    expect(rendu.subject).toBe("Votre centre — test");
    expect(rendu.html).toContain("Au sujet de votre centre");
  });

  it("ajoute les fiches manuelles au ciblage sans lever les exclusions", () => {
    const where = buildAudienceWhere({ mode: "SELECTION", prospectIds: ["p1"], ajoutsManuels: ["m1"] });
    expect(where.unsubscribedAt).toBeNull();
    expect(where.emailValide).toBe(true);
    expect(where.statut).toEqual({ notIn: ["DESABONNE", "INJOIGNABLE", "INSCRIT"] });
    expect(where.OR).toHaveLength(2);
    expect(where.OR?.[0]).toMatchObject({ id: { in: ["p1"] } });
    expect(where.OR?.[1]).toEqual({ id: { in: ["m1"] } });
  });
});
