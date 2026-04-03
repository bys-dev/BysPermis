import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { slugify } from "@/lib/utils";
import { z } from "zod";

// GET /api/centre/formations — list all formations for this centre
export async function GET() {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const formations = await prisma.formation.findMany({
      where: { centreId },
      include: {
        categorie: { select: { id: true, nom: true } },
        _count: { select: { sessions: true } },
        sessions: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      formations.map((f) => ({
        id: f.id,
        titre: f.titre,
        slug: f.slug,
        description: f.description,
        objectifs: f.objectifs,
        programme: f.programme,
        prerequis: f.prerequis,
        publicCible: f.publicCible,
        prix: f.prix,
        duree: f.duree,
        modalite: f.modalite,
        lieu: f.lieu,
        isQualiopi: f.isQualiopi,
        isCPF: f.isCPF,
        isActive: f.isActive,
        categorieId: f.categorieId,
        categorie: f.categorie?.nom ?? null,
        sessionsCount: f._count.sessions,
        sessionsActives: f.sessions.length,
        createdAt: f.createdAt,
      }))
    );
  } catch (err) {
    console.error("[GET /api/centre/formations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/centre/formations — create a new formation
const createSchema = z.object({
  titre: z.string().min(3, "Titre trop court (min 3 caractères)").max(200),
  description: z.string().min(10, "Description trop courte (min 10 caractères)"),
  prix: z.number().positive("Le prix doit être positif"),
  duree: z.string().min(1, "Durée requise"),
  modalite: z.enum(["PRESENTIEL", "DISTANCIEL", "HYBRIDE"]).default("PRESENTIEL"),
  lieu: z.string().max(300).optional().nullable(),
  isQualiopi: z.boolean().default(false),
  isCPF: z.boolean().default(false),
  categorieId: z.string().optional().nullable(),
  objectifs: z.string().max(5000).optional().nullable(),
  programme: z.string().max(10000).optional().nullable(),
  prerequis: z.string().max(2000).optional().nullable(),
  publicCible: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      select: { slug: true, statut: true },
    });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    // Auto-generate slug from titre
    let slug = slugify(data.titre) + "-" + centre.slug;

    // Ensure slug uniqueness
    const existing = await prisma.formation.findUnique({ where: { slug } });
    if (existing) {
      slug = slug + "-" + Date.now().toString(36);
    }

    // Validate categorieId if provided
    if (data.categorieId) {
      const cat = await prisma.categorie.findUnique({ where: { id: data.categorieId } });
      if (!cat) {
        return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
      }
    }

    const formation = await prisma.formation.create({
      data: {
        titre: data.titre,
        description: data.description,
        prix: data.prix,
        duree: data.duree,
        modalite: data.modalite,
        lieu: data.lieu ?? null,
        isQualiopi: data.isQualiopi,
        isCPF: data.isCPF,
        categorieId: data.categorieId ?? null,
        objectifs: data.objectifs ?? null,
        programme: data.programme ?? null,
        prerequis: data.prerequis ?? null,
        publicCible: data.publicCible ?? null,
        slug,
        centreId,
      },
      include: {
        categorie: { select: { id: true, nom: true } },
        _count: { select: { sessions: true } },
      },
    });

    return NextResponse.json(
      {
        id: formation.id,
        titre: formation.titre,
        slug: formation.slug,
        description: formation.description,
        objectifs: formation.objectifs,
        programme: formation.programme,
        prerequis: formation.prerequis,
        publicCible: formation.publicCible,
        prix: formation.prix,
        duree: formation.duree,
        modalite: formation.modalite,
        lieu: formation.lieu,
        isQualiopi: formation.isQualiopi,
        isCPF: formation.isCPF,
        isActive: formation.isActive,
        categorieId: formation.categorieId,
        categorie: formation.categorie?.nom ?? null,
        sessionsCount: formation._count.sessions,
        sessionsActives: 0,
        createdAt: formation.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/centre/formations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
