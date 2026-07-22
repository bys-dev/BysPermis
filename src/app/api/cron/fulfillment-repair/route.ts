import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillReservation } from "@/lib/reservation-fulfillment";

const CRON_SECRET = process.env.CRON_SECRET;

/** Délai avant rattrapage : laisse le temps au tunnel de réservation d'aboutir. */
const GRACE_MINUTES = 20;
/** Garde-fou : nombre de réservations traitées par passage. */
const BATCH_SIZE = 25;

/**
 * GET /api/cron/fulfillment-repair
 *
 * Filet de sécurité final du parcours de paiement. Rattrape les réservations
 * encaissées dont les documents / emails ne sont jamais partis :
 *   - la route POST /api/reservations a planté après le paiement, ou
 *   - le stagiaire a fermé son navigateur avant qu'elle n'aboutisse (le webhook
 *     a alors confirmé la résa, mais sans fulfillment car les coordonnées
 *     n'étaient pas encore saisies).
 *
 * Sélectionne les réservations CONFIRMEE dont `fulfilledAt` est NULL depuis plus
 * de GRACE_MINUTES. `fulfillReservation` étant idempotent (verrou + journal
 * d'emails), un passage en double ne renvoie rien.
 *
 * À planifier toutes les 15–30 min (même scheduler que session-reminders).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - GRACE_MINUTES * 60 * 1000);

    const pending = await prisma.reservation.findMany({
      where: {
        status: "CONFIRMEE",
        fulfilledAt: null,
        updatedAt: { lte: cutoff },
      },
      select: { id: true, numero: true },
      orderBy: { updatedAt: "asc" },
      take: BATCH_SIZE,
    });

    if (pending.length === 0) {
      return NextResponse.json({ checked: 0, repaired: 0, message: "Rien à rattraper" });
    }

    console.warn(
      `[cron/fulfillment-repair] ${pending.length} réservation(s) payée(s) sans documents/emails : ${pending
        .map((r) => r.numero)
        .join(", ")}`,
    );

    const results: { numero: string; executed: boolean; emails: string[]; reason?: string }[] = [];
    // Séquentiel : le rendu PDF est CPU-bound, on évite de saturer l'instance.
    for (const r of pending) {
      const outcome = await fulfillReservation(r.id, { source: "cron-repair" });
      results.push({
        numero: r.numero,
        executed: outcome.executed,
        emails: outcome.emailsSent,
        reason: outcome.reason,
      });
    }

    const repaired = results.filter((r) => r.executed).length;
    return NextResponse.json({
      checked: pending.length,
      repaired,
      truncated: pending.length === BATCH_SIZE,
      results,
    });
  } catch (err) {
    console.error("[cron/fulfillment-repair]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
