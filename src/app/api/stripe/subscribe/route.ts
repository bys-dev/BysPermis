import { NextRequest, NextResponse } from "next/server";
import { requireCentre } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentre();

    const body = (await req.json()) as { planId?: string };
    if (!body.planId) {
      return NextResponse.json(
        { error: "planId est requis" },
        { status: 400 }
      );
    }

    // Fetch plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: body.planId },
    });
    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Plan introuvable ou inactif" },
        { status: 404 }
      );
    }

    // Fetch centre
    const centre = await prisma.centre.findUnique({
      where: { userId: user.id },
    });
    if (!centre) {
      return NextResponse.json(
        { error: "Centre introuvable" },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe Customer
    let stripeCustomerId = centre.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: centre.nom,
        metadata: {
          centreId: centre.id,
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      await prisma.centre.update({
        where: { id: centre.id },
        data: { stripeCustomerId },
      });
    }

    // Create Stripe Checkout Session in subscription mode
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        centreId: centre.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          centreId: centre.id,
          planId: plan.id,
        },
      },
      success_url: `${appUrl}/espace-centre/parametres?subscription=success`,
      cancel_url: `${appUrl}/tarifs-partenaires?subscription=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error("[subscribe] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
