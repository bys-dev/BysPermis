import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { rateLimit } from "@/lib/rate-limit";
import { prepareCampaign, sendCampaignBatch, BATCH_SIZE } from "@/lib/prospects/campaign";
import { validateCampaignTemplate } from "@/lib/prospects/template";

const EnvoyerSchema = z.object({
  /** Taille du lot expédié dans cet appel (max 100, limite de l'API batch). */
  limit: z.number().int().min(1).max(BATCH_SIZE).optional(),
  /** Confirmation explicite : évite un envoi massif déclenché par erreur. */
  confirmer: z.boolean().optional(),
});

/**
 * POST /api/admin/campagnes/[id]/envoyer
 *
 * Lance (ou poursuit) l'envoi d'une campagne :
 *   1. fige la liste des destinataires à partir du ciblage — idempotent ;
 *   2. expédie un premier lot.
 *
 * Le reste part par lots successifs via /api/cron/campagnes. Ce découpage est
 * volontaire : il tient dans le temps d'exécution d'une fonction serverless et
 * lisse la charge d'envoi, ce qui protège la réputation du domaine.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = rateLimit(req, { max: 30, windowMs: 60 * 1000, keyPrefix: "campagne-envoi" });
    if (limited) return limited;

    await requireCommercial();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const parsed = EnvoyerSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const campagne = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campagne) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });

    if (campagne.statut === "ENVOYEE") {
      return NextResponse.json({ error: "Cette campagne est déjà terminée." }, { status: 409 });
    }
    if (campagne.statut === "ANNULEE") {
      return NextResponse.json({ error: "Cette campagne a été annulée." }, { status: 409 });
    }
    if (campagne.statut === "PAUSEE") {
      return NextResponse.json(
        { error: "Campagne en pause : reprenez-la avant de relancer l'envoi." },
        { status: 409 },
      );
    }

    // Dernier contrôle du gabarit : après l'envoi, il est trop tard.
    const check = validateCampaignTemplate({ sujet: campagne.sujet, contenu: campagne.contenu });
    if (check.errors.length > 0) {
      return NextResponse.json({ error: check.errors.join(" "), details: check }, { status: 422 });
    }

    // ── Préparation (idempotente) ──
    const { totalCibles } = await prepareCampaign(id);

    if (totalCibles === 0) {
      return NextResponse.json(
        {
          error:
            "Aucun destinataire ne correspond au ciblage (prospects sans email, désinscrits ou déjà exclus). Ajustez le filtre.",
        },
        { status: 422 },
      );
    }

    // Premier envoi : on exige une confirmation explicite de la volumétrie.
    const dejaCommencee = campagne.statut === "EN_COURS" || campagne.nbEnvoyes > 0;
    if (!dejaCommencee && !parsed.data.confirmer) {
      return NextResponse.json(
        {
          confirmationRequise: true,
          totalCibles,
          message: `${totalCibles} centre(s) vont être contactés. Renvoyez la requête avec « confirmer: true » pour lancer l'envoi.`,
        },
        { status: 409 },
      );
    }

    const result = await sendCampaignBatch(id, { limit: parsed.data.limit });

    return NextResponse.json({
      success: true,
      totalCibles,
      lot: result,
      message: result.termine
        ? `Campagne terminée — ${result.envoyes} email(s) envoyé(s) dans ce lot.`
        : `${result.envoyes} email(s) envoyé(s), ${result.restant} restant(s). L'envoi se poursuit automatiquement.`,
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes/[id]/envoyer]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur lors de l'envoi." },
      { status: 500 },
    );
  }
}
