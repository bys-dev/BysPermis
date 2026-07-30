import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prepareCampaign, sendCampaignBatch, BATCH_SIZE } from "@/lib/prospects/campaign";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/campagnes
 *
 * Fait avancer les campagnes de démarchage :
 *   - démarre celles dont l'heure de programmation est passée ;
 *   - expédie un lot pour chaque campagne EN_COURS.
 *
 * À appeler toutes les 5 minutes via le cron de l'hébergeur (Clever Cloud).
 *
 * Un seul lot par campagne et par passage : c'est ce qui étale les envois dans
 * le temps au lieu de déverser des milliers d'emails froids en quelques minutes,
 * ce qui ferait chuter la délivrabilité du domaine.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const now = new Date();
    const traitees: {
      id: string;
      nom: string;
      envoyes: number;
      echecs: number;
      ignores: number;
      restant: number;
      termine: boolean;
    }[] = [];

    // ── 1. Démarrage des campagnes programmées ──
    const aDemarrer = await prisma.emailCampaign.findMany({
      where: { statut: "PROGRAMMEE", scheduledAt: { lte: now } },
      select: { id: true, nom: true },
    });
    for (const campagne of aDemarrer) {
      try {
        await prepareCampaign(campagne.id);
        await prisma.emailCampaign.update({
          where: { id: campagne.id },
          data: { statut: "EN_COURS", startedAt: now },
        });
      } catch (err) {
        console.error(`[cron/campagnes] préparation ${campagne.id}:`, err);
      }
    }

    // ── 2. Un lot pour chaque campagne active ──
    const actives = await prisma.emailCampaign.findMany({
      where: { statut: "EN_COURS" },
      select: { id: true, nom: true },
      orderBy: { startedAt: "asc" },
      // Borne le travail d'un passage pour rester dans le temps d'exécution.
      take: 5,
    });

    for (const campagne of actives) {
      try {
        const result = await sendCampaignBatch(campagne.id, { limit: BATCH_SIZE });
        traitees.push({ id: campagne.id, nom: campagne.nom, ...result });
      } catch (err) {
        console.error(`[cron/campagnes] envoi ${campagne.id}:`, err);
        traitees.push({
          id: campagne.id,
          nom: campagne.nom,
          envoyes: 0,
          echecs: 0,
          ignores: 0,
          restant: -1,
          termine: false,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      demarrees: aDemarrer.length,
      campagnesTraitees: traitees.length,
      detail: traitees,
    });
  } catch (err) {
    console.error("[GET /api/cron/campagnes]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
