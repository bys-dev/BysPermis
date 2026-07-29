import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";

const StatutSchema = z.object({
  action: z.enum(["pause", "reprendre", "annuler"]),
});

/**
 * POST /api/admin/campagnes/[id]/statut — pilotage de l'envoi.
 *
 * « pause » est le bouton d'arrêt d'urgence : `sendCampaignBatch` refuse de
 * traiter une campagne PAUSEE, donc le cron cesse immédiatement d'expédier les
 * lots restants. Les emails déjà partis ne sont évidemment pas rappelables.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const parsed = StatutSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Action invalide", details: parsed.error.flatten() }, { status: 400 });
    }
    const { action } = parsed.data;

    const campagne = await prisma.emailCampaign.findUnique({
      where: { id },
      select: { id: true, statut: true, nbEnvoyes: true },
    });
    if (!campagne) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });

    if (campagne.statut === "ENVOYEE") {
      return NextResponse.json({ error: "Campagne déjà terminée." }, { status: 409 });
    }

    if (action === "pause") {
      if (campagne.statut !== "EN_COURS" && campagne.statut !== "PROGRAMMEE") {
        return NextResponse.json(
          { error: "Seule une campagne en cours ou programmée peut être mise en pause." },
          { status: 409 },
        );
      }
      const updated = await prisma.emailCampaign.update({ where: { id }, data: { statut: "PAUSEE" } });
      return NextResponse.json({ campagne: updated, message: "Envoi interrompu." });
    }

    if (action === "reprendre") {
      if (campagne.statut !== "PAUSEE") {
        return NextResponse.json({ error: "Cette campagne n'est pas en pause." }, { status: 409 });
      }
      // Reprise : EN_COURS si des emails sont déjà partis, sinon retour en
      // BROUILLON pour repasser par la confirmation de volumétrie.
      const statut = campagne.nbEnvoyes > 0 ? "EN_COURS" : "BROUILLON";
      const updated = await prisma.emailCampaign.update({ where: { id }, data: { statut } });
      return NextResponse.json({ campagne: updated, message: "Campagne réactivée." });
    }

    // action === "annuler" — les destinataires en attente ne partiront jamais.
    const [updated] = await prisma.$transaction([
      prisma.emailCampaign.update({
        where: { id },
        data: { statut: "ANNULEE", finishedAt: new Date() },
      }),
      prisma.campaignRecipient.updateMany({
        where: { campaignId: id, status: "EN_ATTENTE" },
        data: { status: "IGNORE", error: "Campagne annulée" },
      }),
    ]);

    return NextResponse.json({ campagne: updated, message: "Campagne annulée." });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes/[id]/statut]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
