import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  sessionId: z.string().min(1),
  promoCode: z.string().optional(),
});

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

    // Charger la session avec la formation et le centre
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        formation: {
          include: { centre: true },
        },
      },
    });

    if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    if (session.status !== "ACTIVE") return NextResponse.json({ error: "Session non disponible" }, { status: 400 });
    if (session.placesRestantes <= 0) return NextResponse.json({ error: "Plus de places disponibles" }, { status: 400 });

    const centre = session.formation.centre;
    let finalPrice = session.formation.prix;

    // Appliquer le code promo s'il est fourni
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
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

          // Incrémenter les utilisations
          await prisma.promoCode.update({
            where: { id: promo.id },
            data: { utilisations: { increment: 1 } },
          });
        }
      }
    }

    const amountCents = Math.round(finalPrice * 100);
    const commissionRate = Number(process.env.COMMISSION_RATE ?? 0.1);
    const applicationFee = Math.round(amountCents * commissionRate);

    // Créer le PaymentIntent Stripe
    // Si le centre a Stripe Connect → utiliser transfer_data pour split automatique
    const paymentIntentData: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: amountCents,
      currency: "eur",
      metadata: {
        sessionId,
        userId: user.id,
        centreId: centre.id,
        formationId: session.formationId,
      },
      description: `${session.formation.titre} — ${centre.nom}`,
      receipt_email: user.email,
    };

    if (centre.stripeAccountId && centre.stripeOnboardingDone) {
      // Stripe Connect: commission BYS automatique
      paymentIntentData.application_fee_amount = applicationFee;
      paymentIntentData.transfer_data = { destination: centre.stripeAccountId };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
      currency: "eur",
    });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    if (err instanceof Error && err.message === "Non authentifié") {
      return NextResponse.json({ error: "Vous devez être connecté" }, { status: 401 });
    }
    console.error("[POST /api/stripe/create-payment-intent]", err);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}
