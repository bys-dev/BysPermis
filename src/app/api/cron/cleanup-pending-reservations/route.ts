import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/cleanup-pending-reservations
 *
 * Supprime les réservations en EN_ATTENTE_PAIEMENT depuis plus de 30 minutes
 * (utilisateur a abandonné le checkout). Ré-incrémente les placesRestantes
 * de la session associée.
 *
 * À appeler toutes les 5 minutes via Vercel Cron (vercel.json).
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const stale = await prisma.reservation.findMany({
      where: {
        status: "EN_ATTENTE_PAIEMENT",
        createdAt: { lt: thirtyMinAgo },
      },
      select: { id: true, sessionId: true, numero: true },
    });

    let cleaned = 0;
    for (const r of stale) {
      try {
        await prisma.$transaction(async (tx) => {
          // Re-check the status before deletion (could've been confirmed concurrently)
          const fresh = await tx.reservation.findUnique({
            where: { id: r.id },
            select: { status: true },
          });
          if (fresh?.status !== "EN_ATTENTE_PAIEMENT") return;

          await tx.reservation.delete({ where: { id: r.id } });
          await tx.session.update({
            where: { id: r.sessionId },
            data: {
              placesRestantes: { increment: 1 },
              // Si la session était COMPLETE, on la repasse ACTIVE
              status: "ACTIVE",
            },
          });
        });
        cleaned++;
      } catch (err) {
        console.error(`[CRON cleanup] Erreur sur reservation ${r.numero}:`, err);
      }
    }

    return NextResponse.json({ success: true, found: stale.length, cleaned });
  } catch (err) {
    console.error("[GET /api/cron/cleanup-pending-reservations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
