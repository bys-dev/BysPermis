import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { z } from "zod";

// ─── GET /api/centre/promo — Liste les codes promo du centre ───
export async function GET() {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);

    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const promoCodes = await prisma.promoCode.findMany({
      where: { centreId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(promoCodes);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

// ─── POST /api/centre/promo — Créer un code promo pour le centre ───
const createSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional(),
  type: z.enum(["POURCENTAGE", "MONTANT_FIXE"]),
  valeur: z.number().positive(),
  minAchat: z.number().positive().optional().nullable(),
  maxUtilisations: z.number().int().positive().optional().nullable(),
  dateDebut: z.string().transform((v) => new Date(v)),
  dateFin: z.string().transform((v) => new Date(v)),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);

    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    const promo = await prisma.promoCode.create({
      data: {
        code: data.code,
        description: data.description ?? null,
        type: data.type,
        valeur: data.valeur,
        minAchat: data.minAchat ?? null,
        maxUtilisations: data.maxUtilisations ?? null,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        isActive: true,
        centreId,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ce code promo existe déjà" }, { status: 409 });
    }
    console.error("[POST /api/centre/promo]", err);
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}
