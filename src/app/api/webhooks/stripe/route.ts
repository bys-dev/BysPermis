import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[Webhook] Signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Paiement réussi ──────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        // Mettre à jour le statut de la réservation si elle existe déjà
        await prisma.reservation.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: "CONFIRMEE" },
        });
        break;
      }

      // ── Paiement échoué ──────────────────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await prisma.reservation.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: "ANNULEE" },
        });
        break;
      }

      // ── Remboursement ────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await prisma.reservation.updateMany({
            where: { stripePaymentId: charge.payment_intent as string },
            data: { status: "REMBOURSEE" },
          });
        }
        break;
      }

      // ── Stripe Connect: onboarding centre terminé ─────────
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.payouts_enabled) {
          await prisma.centre.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboardingDone: true, statut: "ACTIF", isActive: true },
          });
        }
        break;
      }

      default:
        // Ignorer les autres events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Désactiver le body parser Next.js pour les webhooks Stripe
export const config = {
  api: { bodyParser: false },
};
