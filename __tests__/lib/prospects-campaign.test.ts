/**
 * @jest-environment node
 */

// ─── Mocks ────────────────────────────────────────────────────
// `campaign.ts` tire Prisma, Resend et le journal d'emails ; seules les
// fonctions pures (ciblage, construction des messages) sont testées ici.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/email", () => ({ resend: { batch: { send: jest.fn() } } }));
jest.mock("@/lib/email-log", () => ({ logEmail: jest.fn() }));

import { buildAudienceWhere, buildCampaignMessage } from "@/lib/prospects/campaign";
import type { TemplateProspect } from "@/lib/prospects/template";

const prospect = (over: Partial<TemplateProspect> = {}): TemplateProspect => ({
  nom: "Centre Auto Formation",
  raisonSociale: "AUTO FORMATION SARL",
  ville: "Cergy",
  codePostal: "95000",
  departement: "95",
  email: "contact@exemple.fr",
  telephone: "0123456789",
  siteWeb: null,
  agrementNumber: "R 21 095 0001 0",
  contactNom: "Dupont",
  contactPrenom: "Marc",
  contactFonction: "Gérant",
  unsubscribeToken: "tok_abc123",
  ...over,
});

const campaign = {
  sujet: "{{nom}} — remplissez vos stages",
  contenu: "<p>{{salutation}}</p><p>Bonjour {{ville|chez vous}}.</p>",
  fromName: "BYS Permis",
  replyTo: "contact@byspermis.fr",
};

// ─── Ciblage ──────────────────────────────────────────────────

describe("buildAudienceWhere — garde-fous non négociables", () => {
  it("exclut toujours les fiches sans email, invalides ou opposées au démarchage", () => {
    const where = buildAudienceWhere({});
    expect(where.email).toEqual({ not: null });
    expect(where.emailValide).toBe(true);
    expect(where.unsubscribedAt).toBeNull();
    expect(where.statut).toEqual({ notIn: ["DESABONNE", "INJOIGNABLE"] });
  });

  it("applique les critères en mode filtre", () => {
    const where = buildAudienceWhere({
      mode: "FILTRE",
      statuts: ["NOUVEAU"],
      departements: ["95", "78"],
      exclureDejaContactes: true,
    });
    expect(where.statut).toEqual({ in: ["NOUVEAU"] });
    expect(where.departement).toEqual({ in: ["95", "78"] });
    expect(where.nbEmailsEnvoyes).toBe(0);
    expect(where.id).toBeUndefined();
  });
});

describe("buildAudienceWhere — sélection nominative", () => {
  it("ne retient que les fiches cochées", () => {
    const where = buildAudienceWhere({ mode: "SELECTION", prospectIds: ["p1", "p2", "p3"] });
    expect(where.id).toEqual({ in: ["p1", "p2", "p3"] });
  });

  it("conserve les exclusions obligatoires malgré la sélection manuelle", () => {
    const where = buildAudienceWhere({ mode: "SELECTION", prospectIds: ["p1"] });
    expect(where.emailValide).toBe(true);
    expect(where.unsubscribedAt).toBeNull();
    expect(where.statut).toEqual({ notIn: ["DESABONNE", "INJOIGNABLE"] });
  });

  it("ignore les critères de ciblage, qui n'ont plus de sens", () => {
    const where = buildAudienceWhere({
      mode: "SELECTION",
      prospectIds: ["p1"],
      departements: ["95"],
      exclureDejaContactes: true,
    });
    expect(where.departement).toBeUndefined();
    expect(where.nbEmailsEnvoyes).toBeUndefined();
  });

  it("ne cible personne quand la sélection est vide — jamais tout le fichier", () => {
    expect(buildAudienceWhere({ mode: "SELECTION" }).id).toEqual({ in: [] });
    expect(buildAudienceWhere({ mode: "SELECTION", prospectIds: [] }).id).toEqual({ in: [] });
  });
});

// ─── Confidentialité des destinataires ────────────────────────

describe("buildCampaignMessage", () => {
  it("adresse le message à un seul destinataire, sans copie", () => {
    const message = buildCampaignMessage({
      campaign,
      email: "contact@exemple.fr",
      prospect: prospect(),
    });

    expect(message.to).toBe("contact@exemple.fr");
    expect(Array.isArray(message.to)).toBe(false);
    expect(message).not.toHaveProperty("cc");
    expect(message).not.toHaveProperty("bcc");
  });

  it("utilise l'adresse figée au ciblage plutôt que celle de la fiche", () => {
    const message = buildCampaignMessage({
      campaign,
      email: "ancienne@exemple.fr",
      prospect: prospect({ email: "nouvelle@exemple.fr" }),
    });
    expect(message.to).toBe("ancienne@exemple.fr");
  });

  it("personnalise l'objet et le corps pour chaque destinataire", () => {
    const message = buildCampaignMessage({
      campaign,
      email: "contact@exemple.fr",
      prospect: prospect(),
    });

    expect(message.subject).toBe("Centre Auto Formation — remplissez vos stages");
    expect(message.html).toContain("Bonjour Marc Dupont,");
    expect(message.html).toContain("Cergy");
    expect(message.html).not.toContain("{{");
  });

  it("porte le lien de désinscription du destinataire dans l'en-tête et le corps", () => {
    const message = buildCampaignMessage({
      campaign,
      email: "contact@exemple.fr",
      prospect: prospect({ unsubscribeToken: "tok_xyz" }),
    });

    expect(message.headers["List-Unsubscribe"]).toContain("/desabonnement/tok_xyz");
    expect(message.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(message.html).toContain("/desabonnement/tok_xyz");
  });

  it("n'ajoute une adresse de réponse que si la campagne en définit une", () => {
    const avec = buildCampaignMessage({ campaign, email: "a@b.fr", prospect: prospect() });
    expect(avec.replyTo).toBe("contact@byspermis.fr");

    const sans = buildCampaignMessage({
      campaign: { ...campaign, replyTo: null },
      email: "a@b.fr",
      prospect: prospect(),
    });
    expect(sans).not.toHaveProperty("replyTo");
  });

  it("produit un message distinct par destinataire sur tout un lot", () => {
    const destinataires = [
      { email: "un@exemple.fr", fiche: prospect({ nom: "Centre A", unsubscribeToken: "t1" }) },
      { email: "deux@exemple.fr", fiche: prospect({ nom: "Centre B", unsubscribeToken: "t2" }) },
      { email: "trois@exemple.fr", fiche: prospect({ nom: "Centre C", unsubscribeToken: "t3" }) },
    ];

    const lot = destinataires.map((d) =>
      buildCampaignMessage({ campaign, email: d.email, prospect: d.fiche }),
    );

    expect(lot).toHaveLength(3);
    // Une adresse par message, toutes différentes : personne ne voit les autres.
    expect(lot.map((m) => m.to)).toEqual(["un@exemple.fr", "deux@exemple.fr", "trois@exemple.fr"]);
    expect(new Set(lot.map((m) => m.to)).size).toBe(3);
    // Et chaque message porte bien le nom de son propre centre.
    expect(lot[0].subject).toContain("Centre A");
    expect(lot[1].subject).toContain("Centre B");
    expect(lot[2].subject).toContain("Centre C");
    for (const message of lot) {
      expect(message).not.toHaveProperty("cc");
      expect(message).not.toHaveProperty("bcc");
    }
  });
});
