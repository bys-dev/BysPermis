import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// GET /api/centre/me
export async function GET() {
  try {
    const user = await requireAuth();
    const centre = await prisma.centre.findUnique({
      where: { userId: user.id },
      select: {
        id: true, nom: true, adresse: true, codePostal: true, ville: true,
        telephone: true, email: true, stripeAccountId: true, stripeOnboardingDone: true,
        statut: true, slug: true,
      },
    });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    return NextResponse.json(centre);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// PATCH /api/centre/me
const updateSchema = z.object({
  nom: z.string().min(2).max(200).optional(),
  adresse: z.string().max(300).optional(),
  codePostal: z.string().max(10).optional(),
  ville: z.string().max(100).optional(),
  telephone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const centre = await prisma.centre.findUnique({ where: { userId: user.id } });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const updated = await prisma.centre.update({
      where: { id: centre.id },
      data,
      select: {
        id: true, nom: true, adresse: true, codePostal: true, ville: true,
        telephone: true, email: true, stripeAccountId: true, stripeOnboardingDone: true,
        statut: true, slug: true,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
