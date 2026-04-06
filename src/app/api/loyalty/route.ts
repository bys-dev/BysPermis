import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { z } from "zod";

// ─── GET /api/loyalty — points, niveau, historique ───────
export async function GET() {
  try {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { totalPoints: true, loyaltyLevel: true, referralCode: true },
    });

    const history = await prisma.loyaltyPoints.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate next level progress
    const thresholds = { BRONZE: 0, SILVER: 500, GOLD: 1500, PLATINUM: 5000 };
    const levelOrder = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;
    const currentIdx = levelOrder.indexOf(dbUser.loyaltyLevel as typeof levelOrder[number]);
    const nextLevel = currentIdx < levelOrder.length - 1 ? levelOrder[currentIdx + 1] : null;
    const currentThreshold = thresholds[levelOrder[currentIdx]];
    const nextThreshold = nextLevel ? thresholds[nextLevel] : null;

    let progressPercent = 100;
    let pointsToNextLevel = 0;
    if (nextThreshold !== null) {
      const range = nextThreshold - currentThreshold;
      const progress = dbUser.totalPoints - currentThreshold;
      progressPercent = Math.min(100, Math.round((progress / range) * 100));
      pointsToNextLevel = Math.max(0, nextThreshold - dbUser.totalPoints);
    }

    return NextResponse.json({
      totalPoints: dbUser.totalPoints,
      level: dbUser.loyaltyLevel,
      nextLevel,
      progressPercent,
      pointsToNextLevel,
      history,
    });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── POST /api/loyalty — échanger des points ─────────────
const redeemSchema = z.object({
  points: z.number().int().min(100),
  type: z.literal("PROMO_CODE"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = redeemSchema.parse(body);

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { totalPoints: true },
    });

    if (dbUser.totalPoints < data.points) {
      return NextResponse.json({ error: "Points insuffisants" }, { status: 400 });
    }

    const reduction = Math.floor(data.points / 10); // 10 points = 1 euro
    const code = `FID-${user.id.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      // Débit points
      await tx.loyaltyPoints.create({
        data: {
          userId: user.id,
          points: data.points,
          type: "DEPENSE",
          description: `Échange contre code promo ${code} (-${reduction} €)`,
        },
      });

      const newTotal = dbUser.totalPoints - data.points;
      const newLevel = newTotal >= 5000 ? "PLATINUM" : newTotal >= 1500 ? "GOLD" : newTotal >= 500 ? "SILVER" : "BRONZE";

      await tx.user.update({
        where: { id: user.id },
        data: { totalPoints: newTotal, loyaltyLevel: newLevel },
      });

      // Créer le code promo one-time
      const promoCode = await tx.promoCode.create({
        data: {
          code,
          description: `Code fidélité — ${data.points} points échangés`,
          type: "MONTANT_FIXE",
          valeur: reduction,
          maxUtilisations: 1,
          utilisations: 0,
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
          isActive: true,
        },
      });

      return { promoCode, newTotal, newLevel };
    });

    return NextResponse.json({
      code: result.promoCode.code,
      reduction,
      newTotal: result.newTotal,
      newLevel: result.newLevel,
      expiresAt: result.promoCode.dateFin,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[POST /api/loyalty]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
