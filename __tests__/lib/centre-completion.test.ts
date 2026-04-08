import {
  calculateCentreCompletion,
  type CentreCompletionData,
} from "@/lib/centre-completion";

// ─────────────────────────────────────────────────────────────
//  Tests — calculateCentreCompletion()
// ─────────────────────────────────────────────────────────────

describe("calculateCentreCompletion", () => {
  // ─── Centre vide ─────────────────────────────────────────
  it("retourne 0% pour un centre completement vide", () => {
    const result = calculateCentreCompletion({});
    expect(result.percentage).toBe(0);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.steps).toHaveLength(5);
    result.steps.forEach((step) => {
      expect(step.completed).toBe(false);
    });
  });

  // ─── Informations de base uniquement (25%) ───────────────
  it("retourne 25% avec seulement les informations de base completes", () => {
    const centre: CentreCompletionData = {
      nom: "BYS Formation Osny",
      description:
        "Centre de formation specialise en securite routiere et transport professionnel",
      adresse: "9 Chaussee Jules Cesar",
      codePostal: "95520",
      ville: "Osny",
    };

    const result = calculateCentreCompletion(centre);
    expect(result.percentage).toBe(25);

    const infoStep = result.steps.find((s) => s.id === "informations");
    expect(infoStep?.completed).toBe(true);
    expect(infoStep?.score).toBe(100);
    expect(infoStep?.missingItems).toHaveLength(0);
  });

  // ─── Informations de base + Contact (40%) ────────────────
  it("retourne 40% avec informations de base + contact", () => {
    const centre: CentreCompletionData = {
      nom: "BYS Formation Osny",
      description:
        "Centre de formation specialise en securite routiere et transport professionnel",
      adresse: "9 Chaussee Jules Cesar",
      codePostal: "95520",
      ville: "Osny",
      telephone: "0134256789",
      email: "contact@bys-formation.fr",
    };

    const result = calculateCentreCompletion(centre);
    expect(result.percentage).toBe(40);

    const contactStep = result.steps.find((s) => s.id === "contact");
    expect(contactStep?.completed).toBe(true);
    expect(contactStep?.score).toBe(100);
  });

  // ─── Centre complet (100%) ───────────────────────────────
  it("retourne 100% avec toutes les donnees completes", () => {
    const centre: CentreCompletionData = {
      nom: "BYS Formation Osny",
      description:
        "Centre de formation specialise en securite routiere et transport professionnel",
      adresse: "9 Chaussee Jules Cesar",
      codePostal: "95520",
      ville: "Osny",
      telephone: "0134256789",
      email: "contact@bys-formation.fr",
      presentationHtml:
        "<p>Notre centre de formation est un etablissement reconnu avec plus de 10 ans d'experience dans le domaine de la securite routiere.</p>",
      stripeOnboardingDone: true,
      _activeFormationsWithSessions: 3,
    };

    const result = calculateCentreCompletion(centre);
    expect(result.percentage).toBe(100);
    expect(result.missing).toHaveLength(0);
    result.steps.forEach((step) => {
      expect(step.completed).toBe(true);
      expect(step.score).toBe(100);
    });
  });

  // ─── Description longue en alternative a presentationHtml ─
  it("accepte une description longue (>= 200 chars) en alternative a la presentation HTML", () => {
    const longDescription = "A".repeat(200);
    const centre: CentreCompletionData = {
      nom: "Test Centre",
      description: longDescription,
      adresse: "1 Rue Test",
      codePostal: "75001",
      ville: "Paris",
      telephone: "0612345678",
      email: "test@test.fr",
      stripeOnboardingDone: true,
      _activeFormationsWithSessions: 1,
    };

    const result = calculateCentreCompletion(centre);
    // description >= 50 chars: informations OK (25%)
    // contact OK (15%)
    // description >= 200 chars: presentation OK (20%)
    // formations OK (20%)
    // paiement OK (20%)
    expect(result.percentage).toBe(100);
  });

  // ─── Presentation HTML : nettoyage des balises ───────────
  it("nettoie les balises HTML avant de verifier la longueur de la presentation", () => {
    // HTML with lots of tags but not enough text content
    const shortHtml =
      '<div><p><strong><em>Court</em></strong></p></div>';
    const centre: CentreCompletionData = {
      presentationHtml: shortHtml,
    };

    const result = calculateCentreCompletion(centre);
    const presStep = result.steps.find((s) => s.id === "presentation");
    expect(presStep?.completed).toBe(false);
  });

  // ─── subscriptionStatus ACTIVE remplace stripeOnboardingDone ─
  it("accepte subscriptionStatus ACTIVE comme alternative a Stripe Connect", () => {
    const centre: CentreCompletionData = {
      subscriptionStatus: "ACTIVE",
    };

    const result = calculateCentreCompletion(centre);
    const paiementStep = result.steps.find((s) => s.id === "paiement");
    expect(paiementStep?.completed).toBe(true);
    expect(paiementStep?.score).toBe(100);
  });

  // ─── Stripe onboarding non fait ──────────────────────────
  it("marque le paiement comme incomplet si stripeOnboardingDone est false", () => {
    const centre: CentreCompletionData = {
      stripeOnboardingDone: false,
    };

    const result = calculateCentreCompletion(centre);
    const paiementStep = result.steps.find((s) => s.id === "paiement");
    expect(paiementStep?.completed).toBe(false);
    expect(paiementStep?.missingItems).toHaveLength(1);
  });

  // ─── Formations : aucune formation active ────────────────
  it("indique qu'il faut au moins 1 formation active avec session", () => {
    const centre: CentreCompletionData = {
      _activeFormationsWithSessions: 0,
    };

    const result = calculateCentreCompletion(centre);
    const formStep = result.steps.find((s) => s.id === "formations");
    expect(formStep?.completed).toBe(false);
    expect(formStep?.missingItems[0]).toContain("formation active");
  });

  // ─── Champs partiellement remplis ────────────────────────
  it("calcule un score partiel pour les informations de base (3/5 champs)", () => {
    const centre: CentreCompletionData = {
      nom: "BYS Formation",
      adresse: "9 Chaussee Jules Cesar",
      ville: "Osny",
      // description et codePostal manquants
    };

    const result = calculateCentreCompletion(centre);
    const infoStep = result.steps.find((s) => s.id === "informations");
    expect(infoStep?.completed).toBe(false);
    expect(infoStep?.score).toBe(60); // 3/5 = 60%
    expect(infoStep?.missingItems).toHaveLength(2);
  });

  // ─── Contact partiel (1/2 champs) ────────────────────────
  it("calcule un score partiel pour le contact (1/2 champs)", () => {
    const centre: CentreCompletionData = {
      telephone: "0134256789",
      // email manquant
    };

    const result = calculateCentreCompletion(centre);
    const contactStep = result.steps.find((s) => s.id === "contact");
    expect(contactStep?.completed).toBe(false);
    expect(contactStep?.score).toBe(50); // 1/2 = 50%
    expect(contactStep?.missingItems).toContainEqual(
      expect.stringContaining("Email")
    );
  });

  // ─── Nom trop court ──────────────────────────────────────
  it("rejette un nom de centre trop court (< 2 caracteres)", () => {
    const centre: CentreCompletionData = {
      nom: "A",
    };

    const result = calculateCentreCompletion(centre);
    const infoStep = result.steps.find((s) => s.id === "informations");
    expect(infoStep?.missingItems).toContainEqual(
      expect.stringContaining("Nom du centre")
    );
  });

  // ─── Telephone trop court ────────────────────────────────
  it("rejette un telephone trop court (< 8 caracteres)", () => {
    const centre: CentreCompletionData = {
      telephone: "0123",
    };

    const result = calculateCentreCompletion(centre);
    const contactStep = result.steps.find((s) => s.id === "contact");
    expect(contactStep?.missingItems).toContainEqual(
      expect.stringContaining("Telephone")
    );
  });

  // ─── Email invalide ──────────────────────────────────────
  it("rejette un email sans @", () => {
    const centre: CentreCompletionData = {
      email: "invalide-email.fr",
    };

    const result = calculateCentreCompletion(centre);
    const contactStep = result.steps.find((s) => s.id === "contact");
    expect(contactStep?.missingItems).toContainEqual(
      expect.stringContaining("Email")
    );
  });

  // ─── Structure des steps ─────────────────────────────────
  it("retourne toujours 5 steps avec les bons ids et poids", () => {
    const result = calculateCentreCompletion({});

    expect(result.steps).toHaveLength(5);

    const expectedSteps = [
      { id: "informations", weight: 25 },
      { id: "contact", weight: 15 },
      { id: "presentation", weight: 20 },
      { id: "formations", weight: 20 },
      { id: "paiement", weight: 20 },
    ];

    expectedSteps.forEach((expected) => {
      const step = result.steps.find((s) => s.id === expected.id);
      expect(step).toBeDefined();
      expect(step?.weight).toBe(expected.weight);
    });

    // Total poids = 100
    const totalWeight = result.steps.reduce((sum, s) => sum + s.weight, 0);
    expect(totalWeight).toBe(100);
  });

  // ─── missing agrege correctement ─────────────────────────
  it("agrege tous les champs manquants dans le tableau missing", () => {
    const result = calculateCentreCompletion({});

    // Au moins un missing par step incomplet
    expect(result.missing.length).toBeGreaterThanOrEqual(5);

    // Verifie que les categories principales sont representees
    const missingText = result.missing.join(" ");
    expect(missingText).toContain("Nom du centre");
    expect(missingText).toContain("Telephone");
    expect(missingText).toContain("presentation");
    expect(missingText).toContain("formation active");
    expect(missingText).toContain("Stripe");
  });
});
