import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// ─── GET /api/users/me — profil complet ─────────────────
export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        role: true,
        createdAt: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── PATCH /api/users/me — mise à jour du profil ────────
const updateSchema = z.object({
  prenom: z.string().min(1).max(100).optional(),
  nom: z.string().min(1).max(100).optional(),
  telephone: z.string().max(20).optional(),
  adresse: z.string().max(300).optional(),
  codePostal: z.string().max(10).optional(),
  ville: z.string().max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
