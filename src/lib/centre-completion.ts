/**
 * Centre profile completion calculation.
 *
 * Steps and their weights:
 *  - Informations de base (25%): nom, description (>= 50 chars), adresse, codePostal, ville
 *  - Contact (15%): telephone, email
 *  - Presentation (20%): presentationHtml (>= 100 chars) OR description (>= 200 chars)
 *  - Formations (20%): at least 1 active formation with >= 1 active session
 *  - Paiement (20%): stripeOnboardingDone === true OR subscriptionStatus === "ACTIVE"
 */

export interface CentreCompletionData {
  nom?: string | null;
  description?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  presentationHtml?: string | null;
  stripeOnboardingDone?: boolean | null;
  subscriptionStatus?: string | null;
  // These are injected separately (not on the Centre model directly)
  _activeFormationsWithSessions?: number;
}

export interface Step {
  id: string;
  label: string;
  weight: number;
  score: number; // 0-100 for this step
  completed: boolean;
  missingItems: string[];
}

export interface CompletionResult {
  percentage: number;
  missing: string[];
  steps: Step[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function calculateCentreCompletion(
  centre: CentreCompletionData
): CompletionResult {
  const steps: Step[] = [];

  // ─── Step 1: Informations de base (25%) ───────────────────
  {
    const fields: { key: string; label: string; ok: boolean }[] = [
      { key: "nom", label: "Nom du centre", ok: !!centre.nom && centre.nom.trim().length >= 2 },
      {
        key: "description",
        label: "Description (min. 50 caracteres)",
        ok: !!centre.description && centre.description.trim().length >= 50,
      },
      { key: "adresse", label: "Adresse", ok: !!centre.adresse && centre.adresse.trim().length > 0 },
      { key: "codePostal", label: "Code postal", ok: !!centre.codePostal && centre.codePostal.trim().length > 0 },
      { key: "ville", label: "Ville", ok: !!centre.ville && centre.ville.trim().length > 0 },
    ];
    const doneCount = fields.filter((f) => f.ok).length;
    const score = Math.round((doneCount / fields.length) * 100);
    const missingItems = fields.filter((f) => !f.ok).map((f) => f.label);
    steps.push({
      id: "informations",
      label: "Informations de base",
      weight: 25,
      score,
      completed: score === 100,
      missingItems,
    });
  }

  // ─── Step 2: Contact (15%) ─────────────────────────────────
  {
    const fields: { key: string; label: string; ok: boolean }[] = [
      { key: "telephone", label: "Telephone", ok: !!centre.telephone && centre.telephone.trim().length >= 8 },
      { key: "email", label: "Email", ok: !!centre.email && centre.email.includes("@") },
    ];
    const doneCount = fields.filter((f) => f.ok).length;
    const score = Math.round((doneCount / fields.length) * 100);
    const missingItems = fields.filter((f) => !f.ok).map((f) => f.label);
    steps.push({
      id: "contact",
      label: "Contact",
      weight: 15,
      score,
      completed: score === 100,
      missingItems,
    });
  }

  // ─── Step 3: Presentation (20%) ───────────────────────────
  {
    const presentationText = centre.presentationHtml
      ? stripHtml(centre.presentationHtml)
      : "";
    const descriptionText = centre.description?.trim() || "";

    const hasPresentationHtml = presentationText.length >= 100;
    const hasLongDescription = descriptionText.length >= 200;
    const ok = hasPresentationHtml || hasLongDescription;

    const score = ok ? 100 : 0;
    const missingItems = ok
      ? []
      : ["Texte de presentation (min. 100 caracteres) ou description longue (min. 200 caracteres)"];
    steps.push({
      id: "presentation",
      label: "Presentation",
      weight: 20,
      score,
      completed: ok,
      missingItems,
    });
  }

  // ─── Step 4: Formations (20%) ─────────────────────────────
  {
    const count = centre._activeFormationsWithSessions ?? 0;
    const ok = count >= 1;
    const score = ok ? 100 : 0;
    const missingItems = ok
      ? []
      : ["Au moins 1 formation active avec au moins 1 session active"];
    steps.push({
      id: "formations",
      label: "Formations",
      weight: 20,
      score,
      completed: ok,
      missingItems,
    });
  }

  // ─── Step 5: Paiement (20%) ───────────────────────────────
  {
    const ok =
      centre.stripeOnboardingDone === true ||
      centre.subscriptionStatus === "ACTIVE";
    const score = ok ? 100 : 0;
    const missingItems = ok
      ? []
      : ["Configurer Stripe Connect ou souscrire un abonnement actif"];
    steps.push({
      id: "paiement",
      label: "Paiement",
      weight: 20,
      score,
      completed: ok,
      missingItems,
    });
  }

  // ─── Calculate weighted average ────────────────────────────
  const totalWeight = steps.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = steps.reduce((sum, s) => sum + (s.score / 100) * s.weight, 0);
  const percentage = Math.round((weightedSum / totalWeight) * 100);

  const missing = steps.flatMap((s) => s.missingItems);

  return { percentage, missing, steps };
}
