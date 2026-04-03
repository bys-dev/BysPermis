import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { slugify } from "@/lib/utils";
import { z } from "zod";

// GET /api/centre/formations/[id] — single formation detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const formation = await prisma.formation.findFirst({
      where: { id, centreId },
      include: {
        categorie: { select: { id: true, nom: true } },
        _count: { select: { sessions: true } },
        sessions: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    return NextResponse.json({
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
      sessionsActives: formation.sessions.length,
      createdAt: formation.createdAt,
    });
  } catch (err) {
    console.error("[GET /api/centre/formations/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/centre/formations/[id] — update formation
const updateSchema = z.object({
  titre: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  prix: z.number().positive().optional(),
  duree: z.string().min(1).optional(),
  modalite: z.enum(["PRESENTIEL", "DISTANCIEL", "HYBRIDE"]).optional(),
  lieu: z.string().max(300).optional().nullable(),
  isQualiopi: z.boolean().optional(),
  isCPF: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categorieId: z.string().optional().nullable(),
  objectifs: z.string().max(5000).optional().nullable(),
  programme: z.string().max(10000).optional().nullable(),
  prerequis: z.string().max(2000).optional().nullable(),
  publicCible: z.string().max(2000).optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // Verify formation belongs to this centre
    const existing = await prisma.formation.findFirst({
      where: { id, centreId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    // If titre changed, update slug
    const updateData: Record<string, unknown> = { ...data };
    if (data.titre && data.titre !== existing.titre) {
      const centre = await prisma.centre.findUnique({
        where: { id: centreId },
        select: { slug: true },
      });
      let newSlug = slugify(data.titre) + "-" + (centre?.slug ?? "centre");
      const slugExists = await prisma.formation.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (slugExists) {
        newSlug = newSlug + "-" + Date.now().toString(36);
      }
      updateData.slug = newSlug;
    }

    // Validate categorieId if provided
    if (data.categorieId) {
      const cat = await prisma.categorie.findUnique({ where: { id: data.categorieId } });
      if (!cat) {
        return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
      }
    }

    const formation = await prisma.formation.update({
      where: { id },
      data: updateData,
      include: {
        categorie: { select: { id: true, nom: true } },
        _count: { select: { sessions: true } },
        sessions: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
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
      sessionsActives: formation.sessions.length,
      createdAt: formation.createdAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[PUT /api/centre/formations/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/centre/formations/[id] — soft-delete (set isActive=false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // Verify formation belongs to this centre
    const formation = await prisma.formation.findFirst({
      where: { id, centreId },
    });
    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    await prisma.formation.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/centre/formations/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
