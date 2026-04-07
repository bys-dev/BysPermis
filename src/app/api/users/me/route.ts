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
        emailVerified: true,
        isProfileComplete: true,
        dateNaissance: true,
        numeroPermis: true,
        dateObtentionPermis: true,
        categoriesPermis: true,
        newsletterOptIn: true,
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
  dateNaissance: z.string().optional(),
  numeroPermis: z.string().max(50).optional(),
  dateObtentionPermis: z.string().optional(),
  categoriesPermis: z.array(z.string()).optional(),
  newsletterOptIn: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Build update payload, converting date strings to DateTime
    const updateData: Record<string, unknown> = {};
    if (data.prenom !== undefined) updateData.prenom = data.prenom;
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.codePostal !== undefined) updateData.codePostal = data.codePostal;
    if (data.ville !== undefined) updateData.ville = data.ville;
    if (data.dateNaissance !== undefined) {
      updateData.dateNaissance = data.dateNaissance ? new Date(data.dateNaissance) : null;
    }
    if (data.numeroPermis !== undefined) updateData.numeroPermis = data.numeroPermis || null;
    if (data.dateObtentionPermis !== undefined) {
      updateData.dateObtentionPermis = data.dateObtentionPermis ? new Date(data.dateObtentionPermis) : null;
    }
    if (data.categoriesPermis !== undefined) updateData.categoriesPermis = data.categoriesPermis;
    if (data.newsletterOptIn !== undefined) updateData.newsletterOptIn = data.newsletterOptIn;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Check if profile is complete (required: prenom, nom, telephone, ville)
    const isComplete = !!(updated.prenom && updated.nom && updated.telephone && updated.ville);
    if (isComplete !== updated.isProfileComplete) {
      await prisma.user.update({
        where: { id: updated.id },
        data: { isProfileComplete: isComplete },
      });
    }

    // Return profile with select
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
        emailVerified: true,
        isProfileComplete: true,
        dateNaissance: true,
        numeroPermis: true,
        dateObtentionPermis: true,
        categoriesPermis: true,
        newsletterOptIn: true,
        createdAt: true,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
