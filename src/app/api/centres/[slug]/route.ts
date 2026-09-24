import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/centres/[slug] — détail d'un centre par slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const centre = await prisma.centre.findUnique({
      where: { slug },
      // select explicite : ni email ni téléphone (jamais exposés publiquement),
      // ni données internes (SIRET, IBAN, Stripe…).
      select: {
        id: true,
        nom: true,
        slug: true,
        description: true,
        logo: true,
        adresse: true,
        codePostal: true,
        ville: true,
        siteWeb: true,
        latitude: true,
        longitude: true,
        statut: true,
        isActive: true,
        bannerImage: true,
        couleurPrimaire: true,
        couleurSecondaire: true,
        presentationHtml: true,
        horaires: true,
        equipements: true,
        certifications: true,
        photos: true,
        reseauxSociaux: true,
        formations: {
          where: { isActive: true },
          include: {
            sessions: {
              where: {
                status: "ACTIVE",
                dateDebut: { gte: new Date() },
              },
              orderBy: { dateDebut: "asc" },
            },
            categorie: true,
          },
        },
      },
    });

    if (!centre) {
      return NextResponse.json(
        { error: "Centre non trouvé" },
        { status: 404 }
      );
    }

    // Calculer les compteurs
    const formationCount = centre.formations.length;
    const sessionCount = centre.formations.reduce(
      (acc, f) => acc + f.sessions.length,
      0
    );

    return NextResponse.json({
      ...centre,
      _count: {
        formations: formationCount,
        sessions: sessionCount,
      },
    });
  } catch (err) {
    console.error("[GET /api/centres/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
