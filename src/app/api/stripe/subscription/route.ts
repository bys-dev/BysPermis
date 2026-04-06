import { NextResponse } from "next/server";
import { requireCentre } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getUserCentreId } from "@/lib/centre-utils";

export async function GET() {
  try {
    const user = await requireCentre();

    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) {
      return NextResponse.json(
        { error: "Centre introuvable" },
        { status: 404 }
      );
    }
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: { subscriptionPlan: true },
    });
    if (!centre) {
      return NextResponse.json(
        { error: "Centre introuvable" },
        { status: 404 }
      );
    }

    // No active subscription
    if (!centre.subscriptionStripeId) {
      return NextResponse.json({
        plan: null,
        status: centre.subscriptionStatus,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    // Fetch subscription from Stripe for up-to-date info
    const subscription = await stripe.subscriptions.retrieve(
      centre.subscriptionStripeId
    );

    return NextResponse.json({
      plan: centre.subscriptionPlan
        ? {
            id: centre.subscriptionPlan.id,
            nom: centre.subscriptionPlan.nom,
            prix: centre.subscriptionPlan.prix,
            features: centre.subscriptionPlan.features,
            commissionRate: centre.subscriptionPlan.commissionRate,
          }
        : null,
      status: centre.subscriptionStatus,
      currentPeriodEnd: (subscription as unknown as { current_period_end: number }).current_period_end
        ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error: unknown) {
    console.error("[subscription GET] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const user = await requireCentre();

    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) {
      return NextResponse.json(
        { error: "Centre introuvable" },
        { status: 404 }
      );
    }
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
    });
    if (!centre) {
      return NextResponse.json(
        { error: "Centre introuvable" },
        { status: 404 }
      );
    }

    if (!centre.subscriptionStripeId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif" },
        { status: 400 }
      );
    }

    // Cancel at period end (not immediately)
    const subscription = await stripe.subscriptions.update(
      centre.subscriptionStripeId,
      { cancel_at_period_end: true }
    );

    return NextResponse.json({
      message: "Abonnement sera annulé à la fin de la période",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: (subscription as unknown as { current_period_end: number }).current_period_end
        ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
        : null,
    });
  } catch (error: unknown) {
    console.error("[subscription PUT] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
