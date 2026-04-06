import { NextResponse } from "next/server";
import { requireCentre } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getUserCentreId } from "@/lib/centre-utils";

export async function POST() {
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

    if (!centre.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun compte Stripe associé" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: centre.stripeCustomerId,
      return_url: `${appUrl}/espace-centre/parametres`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("[portal] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
