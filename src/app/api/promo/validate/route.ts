import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase().trim()),
  montant: z.number().positive(),
});

// ─── POST /api/promo/validate — Valider un code promo (public) ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, montant } = schema.parse(body);

    const promo = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      return NextResponse.json({ valid: false, error: "Code promo introuvable" }, { status: 200 });
    }

    if (!promo.isActive) {
      return NextResponse.json({ valid: false, error: "Ce code promo n'est plus actif" }, { status: 200 });
    }

    const now = new Date();
    if (now < promo.dateDebut) {
      return NextResponse.json({ valid: false, error: "Ce code promo n'est pas encore valide" }, { status: 200 });
    }
    if (now > promo.dateFin) {
      return NextResponse.json({ valid: false, error: "Ce code promo a expiré" }, { status: 200 });
    }

    if (promo.maxUtilisations !== null && promo.utilisations >= promo.maxUtilisations) {
      return NextResponse.json({ valid: false, error: "Ce code promo a atteint son nombre maximum d'utilisations" }, { status: 200 });
    }

    if (promo.minAchat !== null && montant < promo.minAchat) {
      return NextResponse.json({
        valid: false,
        error: `Montant minimum d'achat requis : ${promo.minAchat} €`,
      }, { status: 200 });
    }

    // Calculer la réduction
    let reduction: number;
    if (promo.type === "POURCENTAGE") {
      reduction = Math.round((montant * promo.valeur) / 100 * 100) / 100;
    } else {
      // MONTANT_FIXE
      reduction = Math.min(promo.valeur, montant);
    }

    const nouveauMontant = Math.round((montant - reduction) * 100) / 100;

    return NextResponse.json({
      valid: true,
      reduction,
      nouveauMontant,
      type: promo.type,
      description: promo.description ?? `Code ${promo.code} appliqué`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ valid: false, error: "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/promo/validate]", err);
    return NextResponse.json({ valid: false, error: "Erreur serveur" }, { status: 500 });
  }
}
