import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { ordre: "asc" },
      select: {
        id: true,
        nom: true,
        stripePriceId: true,
        prix: true,
        features: true,
        maxFormations: true,
        isFeatured: true,
        commissionRate: true,
        ordre: true,
      },
    });

    return NextResponse.json(plans);
  } catch (error: unknown) {
    console.error("[subscription-plans] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
