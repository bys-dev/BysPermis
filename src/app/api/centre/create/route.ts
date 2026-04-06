import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreOwner } from "@/lib/auth0";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  nom: z.string().min(2, "Nom du centre requis (min 2 caractères)").max(200),
  adresse: z.string().min(1, "Adresse requise").max(300),
  codePostal: z.string().min(1, "Code postal requis").max(10),
  ville: z.string().min(1, "Ville requise").max(100),
});

// POST /api/centre/create — Create an additional centre for CENTRE_OWNER
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreOwner();
    const body = await req.json();
    const data = createSchema.parse(body);

    // Generate unique slug
    let slug = slugify(data.nom);
    const existingSlug = await prisma.centre.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = slug + "-" + Date.now().toString(36);
    }

    // Create the new centre
    const centre = await prisma.centre.create({
      data: {
        nom: data.nom.trim(),
        slug,
        adresse: data.adresse.trim(),
        codePostal: data.codePostal.trim(),
        ville: data.ville.trim(),
        userId: user.id,
        profilCompletionPct: 0,
      },
    });

    // Switch to the new centre
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCentreId: centre.id },
    });

    return NextResponse.json(
      {
        success: true,
        centre: {
          id: centre.id,
          nom: centre.nom,
          slug: centre.slug,
          ville: centre.ville,
          profilCompletionPct: centre.profilCompletionPct,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    console.error("[POST /api/centre/create]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
