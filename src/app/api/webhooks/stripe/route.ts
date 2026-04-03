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

      // ── Abonnement: checkout complété ─────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const centreId = session.metadata?.centreId;
          const planId = session.metadata?.planId;
          if (centreId) {
            const updateData: Record<string, unknown> = {
              subscriptionStripeId: session.subscription as string,
              subscriptionStatus: "ACTIVE",
              stripeCustomerId: session.customer as string,
            };
            if (planId) {
              updateData.subscriptionPlanId = planId;
            }
            await prisma.centre.update({
              where: { id: centreId },
              data: updateData,
            });

            // Créer l'enregistrement de paiement d'abonnement initial
            const amountTotal = session.amount_total ?? 0;
            if (amountTotal > 0) {
              const plan = planId
                ? await prisma.subscriptionPlan.findUnique({ where: { id: planId }, select: { nom: true } })
                : null;
              const planName = plan?.nom ?? "Abonnement";
              const periode = new Date().toISOString().slice(0, 7);
              await prisma.centrePayment.create({
                data: {
                  centreId,
                  type: "ABONNEMENT",
                  montant: amountTotal / 100,
                  description: `Abonnement ${planName} — ${periode}`,
                  stripeId: session.id,
                  status: "PAYE",
                  periode,
                },
              });
            }
          }
        }
        break;
      }

      // ── Abonnement: mise à jour ───────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const centreId = subscription.metadata?.centreId;
        if (centreId) {
          let status: "ACTIVE" | "PAST_DUE" | "ANNULEE" | "TRIALING" = "ACTIVE";
          if (subscription.status === "past_due") status = "PAST_DUE";
          else if (subscription.status === "canceled" || subscription.status === "unpaid") status = "ANNULEE";
          else if (subscription.status === "trialing") status = "TRIALING";

          await prisma.centre.update({
            where: { id: centreId },
            data: { subscriptionStatus: status },
          });
        }
        break;
      }

      // ── Abonnement: supprimé ──────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const centreId = subscription.metadata?.centreId;
        if (centreId) {
          await prisma.centre.update({
            where: { id: centreId },
            data: {
              subscriptionStatus: "ANNULEE",
              subscriptionStripeId: null,
              subscriptionPlanId: null,
            },
          });
        }
        break;
      }

      // ── Facture: paiement réussi (renouvellement abonnement) ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubPaid = (invoice as unknown as { subscription: string | { id: string } | null }).subscription;
        if (invoiceSubPaid) {
          const subscriptionId = typeof invoiceSubPaid === "string"
            ? invoiceSubPaid
            : invoiceSubPaid.id;

          // Trouver le centre lié à cet abonnement
          const centre = await prisma.centre.findFirst({
            where: { subscriptionStripeId: subscriptionId },
            select: { id: true, subscriptionPlan: { select: { nom: true } } },
          });

          if (centre) {
            const amountPaid = (invoice as unknown as { amount_paid: number }).amount_paid ?? 0;
            if (amountPaid > 0) {
              const planName = centre.subscriptionPlan?.nom ?? "Abonnement";
              const invoiceId = invoice.id;
              // Extraire la période depuis la facture
              const periodEnd = (invoice as unknown as { period_end: number }).period_end;
              const periode = periodEnd
                ? new Date(periodEnd * 1000).toISOString().slice(0, 7)
                : new Date().toISOString().slice(0, 7);

              // Éviter les doublons (checkout.session.completed peut déjà l'avoir créé)
              const existing = await prisma.centrePayment.findFirst({
                where: { stripeId: invoiceId, centreId: centre.id },
              });

              if (!existing) {
                await prisma.centrePayment.create({
                  data: {
                    centreId: centre.id,
                    type: "ABONNEMENT",
                    montant: amountPaid / 100,
                    description: `Abonnement ${planName} — ${periode}`,
                    stripeId: invoiceId,
                    status: "PAYE",
                    periode,
                  },
                });
              }
            }
          }
        }
        break;
      }

      // ── Facture: paiement échoué ──────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSub = (invoice as unknown as { subscription: string | { id: string } | null }).subscription;
        if (invoiceSub) {
          const subscriptionId = typeof invoiceSub === "string"
            ? invoiceSub
            : invoiceSub.id;
          await prisma.centre.updateMany({
            where: { subscriptionStripeId: subscriptionId },
            data: { subscriptionStatus: "PAST_DUE" },
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
