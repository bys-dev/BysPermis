import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireCentre } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

// POST /api/stripe/connect — Démarrer l'onboarding Stripe Connect
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentre();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    const centre = await prisma.centre.findUnique({ where: { id: centreId } });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    let stripeAccountId = centre.stripeAccountId;

    // Créer le compte Connect si pas encore fait
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: centre.email ?? user.email,
        business_type: "company",
        business_profile: { name: centre.nom },
        metadata: { centreId: centre.id, userId: user.id },
      });

      stripeAccountId = account.id;
      await prisma.centre.update({
        where: { id: centre.id },
        data: { stripeAccountId },
      });
    }

    // Générer le lien d'onboarding
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/espace-centre/parametres?stripe=success`;
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/espace-centre/parametres?stripe=refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("[POST /api/stripe/connect]", err);
    return NextResponse.json({ error: "Erreur lors de la connexion Stripe" }, { status: 500 });
  }
}
