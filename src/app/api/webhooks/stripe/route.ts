import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillReservation } from "@/lib/reservation-fulfillment";
import Stripe from "stripe";

/**
 * Stripe webhook handler with:
 *   - Signature verification (constructEvent)
 *   - Idempotence via the WebhookEvent table (event.id unique)
 *   - Reservation status sync on payment_intent.succeeded / failed / refunded
 */
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

  // ─── Idempotence: refuse de retraiter un event déjà vu ──────────
  try {
    await prisma.webhookEvent.create({
      data: { id: event.id, provider: "stripe", type: event.type },
    });
  } catch (err) {
    // P2002 = unique constraint violation → event déjà traité, on renvoie 200 OK
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2002") {
      console.info(`[Webhook] event ${event.id} (${event.type}) already processed — skipping`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }
    // Autre erreur DB : log + 500 pour que Stripe retry
    console.error("[Webhook] Idempotence check failed:", err);
    return NextResponse.json({ error: "Idempotence check failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      // ── Paiement réussi ──────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;

        // État AVANT mise à jour : permet de savoir si POST /api/reservations est
        // déjà passé (il confirme la résa et remplit adresse / n° de permis…).
        const before = await prisma.reservation.findFirst({
          where: { stripePaymentId: pi.id },
          select: { id: true, status: true },
        });

        await prisma.reservation.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: "CONFIRMEE" },
        });

        // Filet de sécurité : la route synchrone a bien tourné (données client
        // complètes) mais son pipeline de documents/emails a pu échouer après
        // encaissement. `fulfillReservation` est idempotent : si tout est déjà
        // parti, il ne fait rien.
        //
        // Si la résa était encore EN_ATTENTE_PAIEMENT, on NE fulfill PAS ici : le
        // stagiaire n'a pas encore saisi ses coordonnées, la convocation serait
        // générée sans adresse ni numéro de permis. Le cron de réparation
        // (/api/cron/fulfillment-repair) s'en chargera si la route ne revient jamais.
        if (before?.status === "CONFIRMEE") {
          const outcome = await fulfillReservation(before.id, { source: "webhook-stripe" });
          if (outcome.executed) {
            console.warn(
              `[Webhook] fulfillment de rattrapage exécuté pour ${before.id} — la route synchrone avait échoué`,
            );
          }
        }
        break;
      }

      // ── Paiement échoué ──────────────────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await prisma.reservation.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: "ANNULEE" },
        });
        // Re-libérer la place côté session
        const reservations = await prisma.reservation.findMany({
          where: { stripePaymentId: pi.id, status: "ANNULEE" },
          select: { sessionId: true },
        });
        for (const r of reservations) {
          await prisma.session.update({
            where: { id: r.sessionId },
            data: { placesRestantes: { increment: 1 } },
          });
        }
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

      // ── Stripe Connect: transfer vers le centre ───────────
      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        const destination =
          typeof transfer.destination === "string"
            ? transfer.destination
            : transfer.destination?.id ?? null;
        if (destination) {
          const centre = await prisma.centre.findFirst({
            where: { stripeAccountId: destination },
            select: { id: true },
          });
          if (centre) {
            // Idempotent: skip if a CentrePayment already exists for this transfer
            const existing = await prisma.centrePayment.findFirst({
              where: { stripeId: transfer.id, centreId: centre.id },
            });
            if (!existing) {
              const amount = (transfer.amount ?? 0) / 100;
              await prisma.centrePayment.create({
                data: {
                  centreId: centre.id,
                  type: "COMMISSION",
                  montant: amount,
                  description:
                    transfer.description ?? `Transfert Stripe Connect ${transfer.id}`,
                  stripeId: transfer.id,
                  status: "PAYE",
                  periode: new Date().toISOString().slice(0, 7),
                },
              });
            }
          }
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
    // Important : si le handler échoue après avoir inséré le WebhookEvent,
    // on supprime l'entry pour permettre à Stripe de retry.
    await prisma.webhookEvent.delete({ where: { id: event.id } }).catch(() => {});
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
