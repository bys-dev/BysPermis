import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  titre: z.string().min(3).max(200).optional(),
  prix: z.number().positive().optional(),
  description: z.string().min(10).optional(),
});

// PATCH /api/formations/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await req.json();
    const data = patchSchema.parse(body);

    // Vérifier que la formation appartient au centre de cet utilisateur (ou admin)
    const formation = await prisma.formation.findUnique({
      where: { id },
      include: { centre: { select: { userId: true } } },
    });
    if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    if (formation.centre.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const updated = await prisma.formation.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
