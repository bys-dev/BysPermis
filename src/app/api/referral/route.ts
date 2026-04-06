import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { z } from "zod";

// ─── GET /api/referral — infos parrainage de l'utilisateur ──
export async function GET() {
  try {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { referralCode: true },
    });

    // Nombre de filleuls
    const referralCount = await prisma.user.count({
      where: { referredBy: dbUser.referralCode },
    });

    // Points gagnés via parrainage
    const referralPoints = await prisma.loyaltyPoints.findMany({
      where: {
        userId: user.id,
        type: "GAIN",
        description: { startsWith: "Parrainage" },
      },
    });
    const totalReferralPoints = referralPoints.reduce((sum, p) => sum + p.points, 0);

    return NextResponse.json({
      referralCode: dbUser.referralCode,
      referralCount,
      totalReferralPoints,
      shareUrl: `https://bysformation.com/inscription?ref=${dbUser.referralCode}`,
    });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── POST /api/referral — lier un code parrain ──────────────
const linkSchema = z.object({
  referralCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = linkSchema.parse(body);

    // Vérifier que l'utilisateur n'a pas déjà un parrain
    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { referredBy: true, referralCode: true },
    });

    if (dbUser.referredBy) {
      return NextResponse.json({ error: "Vous avez déjà un parrain" }, { status: 400 });
    }

    // Pas d'auto-parrainage
    if (dbUser.referralCode === data.referralCode) {
      return NextResponse.json({ error: "Vous ne pouvez pas utiliser votre propre code" }, { status: 400 });
    }

    // Vérifier que le code existe
    const referrer = await prisma.user.findUnique({
      where: { referralCode: data.referralCode },
    });
    if (!referrer) {
      return NextResponse.json({ error: "Code parrain invalide" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { referredBy: data.referralCode },
    });

    return NextResponse.json({ success: true, referrerName: referrer.prenom });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[POST /api/referral]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
