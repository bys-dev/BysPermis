import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwner } from "@/lib/auth0";
import { z } from "zod";

// ─── GET /api/admin/promo — Liste tous les codes promo (admin) ───
export async function GET() {
  try {
    await requireAdmin();

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { centre: { select: { id: true, nom: true } } },
    });

    return NextResponse.json(promoCodes);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

// ─── POST /api/admin/promo — Créer un code promo (admin) ───
const createSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional(),
  type: z.enum(["POURCENTAGE", "MONTANT_FIXE"]),
  valeur: z.number().positive(),
  minAchat: z.number().positive().optional().nullable(),
  maxUtilisations: z.number().int().positive().optional().nullable(),
  dateDebut: z.string().transform((v) => new Date(v)),
  dateFin: z.string().transform((v) => new Date(v)),
  isActive: z.boolean().optional().default(true),
  centreId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
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
        isActive: data.isActive,
        centreId: data.centreId ?? null,
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
    console.error("[POST /api/admin/promo]", err);
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

// ─── PATCH /api/admin/promo — Modifier / désactiver (admin) ───
const patchSchema = z.object({
  id: z.string().min(1),
  description: z.string().max(500).optional(),
  valeur: z.number().positive().optional(),
  minAchat: z.number().positive().optional().nullable(),
  maxUtilisations: z.number().int().positive().optional().nullable(),
  dateDebut: z.string().transform((v) => new Date(v)).optional(),
  dateFin: z.string().transform((v) => new Date(v)).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, ...data } = patchSchema.parse(body);

    const promo = await prisma.promoCode.update({
      where: { id },
      data,
    });

    return NextResponse.json(promo);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[PATCH /api/admin/promo]", err);
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

// ─── DELETE /api/admin/promo — Supprimer (owner uniquement) ───
const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    await requireOwner();
    const body = await req.json();
    const { id } = deleteSchema.parse(body);

    await prisma.promoCode.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[DELETE /api/admin/promo]", err);
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}
