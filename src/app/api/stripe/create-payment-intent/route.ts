import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";
import { rateLimit } from "@/lib/rate-limit";
import { calculateCommission, generateReservationNumber, getCommissionRate } from "@/lib/utils";

const schema = z.object({
  sessionId: z.string().min(1),
  promoCode: z.string().optional(),
});

/**
 * POST /api/stripe/create-payment-intent
 *
 * Anti race-condition flow:
 *   1. Transaction atomique : vérifier placesRestantes > 0 ET décrémenter ET
 *      créer la Reservation (status EN_ATTENTE_PAIEMENT) → empêche la
 *      sur-réservation entre deux paiements concurrents.
 *   2. Créer le PaymentIntent Stripe avec la reservationId en metadata.
 *   3. Le webhook payment_intent.succeeded passera la résa en CONFIRMEE.
 *   4. Si abandon : un cron supprime les EN_ATTENTE_PAIEMENT > 30 min et
 *      ré-incrémente les places.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, {
      max: 15,
      windowMs: 60 * 1000,
      keyPrefix: "payment-intent",
    });
    if (limited) return limited;

    const user = await requireAuth();
    const body = await req.json();
    const { sessionId, promoCode } = schema.parse(body);

    // ─── 1. Transaction atomique : check places + create placeholder reservation ──
    const txResult = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { formation: { include: { centre: true } } },
      });

      if (!session) throw new Error("SESSION_NOT_FOUND");
      if (session.status !== "ACTIVE") throw new Error("SESSION_INACTIVE");
      if (session.placesRestantes <= 0) throw new Error("SESSION_FULL");

      const centre = session.formation.centre;
      let finalPrice = session.formation.prix;
      let promoIdToIncrement: string | null = null;

      // Appliquer le code promo s'il est fourni
      if (promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: promoCode.toUpperCase().trim() },
        });

        if (promo && promo.isActive) {
          const now = new Date();
          const isValid =
            now >= promo.dateDebut &&
            now <= promo.dateFin &&
            (promo.maxUtilisations === null || promo.utilisations < promo.maxUtilisations) &&
            (promo.minAchat === null || finalPrice >= promo.minAchat) &&
            (promo.centreId === null || promo.centreId === centre.id);

          if (isValid) {
            const reduction =
              promo.type === "POURCENTAGE"
                ? Math.round((finalPrice * promo.valeur) / 100 * 100) / 100
                : Math.min(promo.valeur, finalPrice);
            finalPrice = Math.round((finalPrice - reduction) * 100) / 100;
            promoIdToIncrement = promo.id;
          }
        }
      }

      // Atomic decrement + create reservation placeholder
      // Note: on décrémente avant; si insuffisant Prisma laissera passer mais
      // on vérifie via le check ci-dessus dans la transaction (lecture cohérente).
      const updatedSession = await tx.session.update({
        where: { id: sessionId },
        data: {
          placesRestantes: { decrement: 1 },
          // Mettre COMPLETE si on consomme la dernière place
          status: session.placesRestantes === 1 ? "COMPLETE" : session.status,
        },
      });

      const commissionRateFraction = getCommissionRate(centre);
      if (centre.commissionRateOverride !== null && centre.commissionRateOverride !== undefined) {
        console.info(`[create-payment-intent] centre ${centre.id} override rate=${centre.commissionRateOverride}`);
      }
      const { commission } = calculateCommission(finalPrice, commissionRateFraction * 100);

      // Crée la réservation en EN_ATTENTE_PAIEMENT (placeholder).
      // Pré-remplit avec les infos User (l'élève complétera le formulaire).
      const reservation = await tx.reservation.create({
        data: {
          numero: generateReservationNumber(),
          userId: user.id,
          sessionId,
          status: "EN_ATTENTE_PAIEMENT",
          montant: finalPrice,
          commissionMontant: commission,
          nom: user.nom ?? "",
          prenom: user.prenom ?? "",
          email: user.email,
          telephone: user.telephone ?? "",
        },
      });

      if (promoIdToIncrement) {
        await tx.promoCode.update({
          where: { id: promoIdToIncrement },
          data: { utilisations: { increment: 1 } },
        });
      }

      return { reservation, finalPrice, centre, session: updatedSession, formationTitre: session.formation.titre };
    });

    // ─── 2. Créer le PaymentIntent Stripe ────────────────────────
    const amountCents = Math.round(txResult.finalPrice * 100);
    const commissionRate = getCommissionRate(txResult.centre);
    const applicationFee = Math.round(amountCents * commissionRate);

    const paymentIntentData: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: amountCents,
      currency: "eur",
      metadata: {
        sessionId,
        userId: user.id,
        centreId: txResult.centre.id,
        reservationId: txResult.reservation.id,
      },
      description: `${txResult.formationTitre} — ${txResult.centre.nom}`,
      receipt_email: user.email,
    };

    if (txResult.centre.stripeAccountId && txResult.centre.stripeOnboardingDone) {
      paymentIntentData.application_fee_amount = applicationFee;
      paymentIntentData.transfer_data = { destination: txResult.centre.stripeAccountId };
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    } catch (stripeErr) {
      // Rollback : supprimer la résa placeholder + ré-incrémenter les places
      await prisma.$transaction(async (tx) => {
        await tx.reservation.delete({ where: { id: txResult.reservation.id } }).catch(() => {});
        await tx.session.update({
          where: { id: sessionId },
          data: { placesRestantes: { increment: 1 } },
        }).catch(() => {});
      });
      throw stripeErr;
    }

    // Stocker l'id du PaymentIntent sur la réservation
    await prisma.reservation.update({
      where: { id: txResult.reservation.id },
      data: { stripePaymentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
      currency: "eur",
      reservationId: txResult.reservation.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    if (err instanceof Error) {
      if (err.message === "Non authentifié") {
        return NextResponse.json({ error: "Vous devez être connecté" }, { status: 401 });
      }
      const known: Record<string, string> = {
        SESSION_NOT_FOUND: "Session introuvable",
        SESSION_INACTIVE: "Session non disponible",
        SESSION_FULL: "Plus de places disponibles",
      };
      if (known[err.message]) {
        return NextResponse.json({ error: known[err.message] }, { status: 400 });
      }
    }
    console.error("[POST /api/stripe/create-payment-intent]", err);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}
