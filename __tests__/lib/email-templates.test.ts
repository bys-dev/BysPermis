/**
 * Tests pour le systeme de templates email.
 *
 * On teste la fonction replacePlaceholders via renderEmailTemplate
 * en mockant Prisma pour fournir des templates fictifs.
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    emailTemplate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { renderEmailTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────
//  Tests — renderEmailTemplate() et remplacement de variables
// ─────────────────────────────────────────────────────────────

describe("renderEmailTemplate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("remplace {{prenom}} avec la valeur fournie", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "confirmation",
      centreId: null,
      sujet: "Bonjour {{prenom}}",
      contenu: "<p>Bienvenue {{prenom}} !</p>",
    });

    const result = await renderEmailTemplate("confirmation", null, {
      prenom: "Jean",
    });

    expect(result.subject).toBe("Bonjour Jean");
    expect(result.html).toBe("<p>Bienvenue Jean !</p>");
  });

  it("remplace plusieurs variables differentes", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "reservation",
      centreId: null,
      sujet: "Reservation {{numero}} - {{formation}}",
      contenu:
        "<p>{{prenom}} {{nom}}, votre reservation {{numero}} pour {{formation}} est confirmee.</p>",
    });

    const result = await renderEmailTemplate("reservation", null, {
      prenom: "Jean",
      nom: "Dupont",
      numero: "BYS-2026-AB12",
      formation: "Stage recuperation de points",
    });

    expect(result.subject).toBe(
      "Reservation BYS-2026-AB12 - Stage recuperation de points"
    );
    expect(result.html).toContain("Jean Dupont");
    expect(result.html).toContain("BYS-2026-AB12");
    expect(result.html).toContain("Stage recuperation de points");
  });

  it("laisse les variables inconnues telles quelles", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "test",
      centreId: null,
      sujet: "{{prenom}} — {{inconnu}}",
      contenu: "<p>{{prenom}} et {{autre}}</p>",
    });

    const result = await renderEmailTemplate("test", null, {
      prenom: "Jean",
    });

    expect(result.subject).toBe("Jean — {{inconnu}}");
    expect(result.html).toBe("<p>Jean et {{autre}}</p>");
  });

  it("gere un template sans aucune variable", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "info",
      centreId: null,
      sujet: "Information importante",
      contenu: "<p>Ceci est un message sans variable.</p>",
    });

    const result = await renderEmailTemplate("info", null, {});

    expect(result.subject).toBe("Information importante");
    expect(result.html).toBe("<p>Ceci est un message sans variable.</p>");
  });

  it("gere un template vide", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "empty",
      centreId: null,
      sujet: "",
      contenu: "",
    });

    const result = await renderEmailTemplate("empty", null, {
      prenom: "Jean",
    });

    expect(result.subject).toBe("");
    expect(result.html).toBe("");
  });

  it("priorise le template specifique au centre", async () => {
    (prisma.emailTemplate.findUnique as jest.Mock).mockResolvedValue({
      slug: "confirmation",
      centreId: "centre_1",
      sujet: "Centre specifique — {{prenom}}",
      contenu: "<p>Template centre pour {{prenom}}</p>",
    });

    const result = await renderEmailTemplate("confirmation", "centre_1", {
      prenom: "Marie",
    });

    expect(result.subject).toBe("Centre specifique — Marie");
    expect(result.html).toContain("Template centre pour Marie");

    // Verifie qu'on a cherche le template centre en premier
    expect(prisma.emailTemplate.findUnique).toHaveBeenCalledWith({
      where: { slug_centreId: { slug: "confirmation", centreId: "centre_1" } },
    });
    // Et qu'on n'a PAS cherche le fallback default
    expect(prisma.emailTemplate.findFirst).not.toHaveBeenCalled();
  });

  it("utilise le template par defaut si pas de template centre", async () => {
    (prisma.emailTemplate.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "confirmation",
      centreId: null,
      sujet: "Defaut — {{prenom}}",
      contenu: "<p>Template defaut pour {{prenom}}</p>",
    });

    const result = await renderEmailTemplate("confirmation", "centre_1", {
      prenom: "Marie",
    });

    expect(result.subject).toBe("Defaut — Marie");
    expect(prisma.emailTemplate.findFirst).toHaveBeenCalledWith({
      where: { slug: "confirmation", centreId: null },
    });
  });

  it("lance une erreur si le template est introuvable", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      renderEmailTemplate("inexistant", null, {})
    ).rejects.toThrow('Email template "inexistant" introuvable');
  });

  it("remplace les occurrences multiples de la meme variable", async () => {
    (prisma.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
      slug: "multi",
      centreId: null,
      sujet: "{{prenom}} {{prenom}}",
      contenu: "<p>Bonjour {{prenom}}, bienvenue {{prenom}} !</p>",
    });

    const result = await renderEmailTemplate("multi", null, {
      prenom: "Jean",
    });

    expect(result.subject).toBe("Jean Jean");
    expect(result.html).toBe("<p>Bonjour Jean, bienvenue Jean !</p>");
  });
});
