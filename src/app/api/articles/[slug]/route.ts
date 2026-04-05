import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth0";

// ─── GET /api/articles/[slug] — Article par slug (public) ───────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await prisma.article.findUnique({
      where: { slug },
      include: { author: { select: { prenom: true, nom: true } } },
    });

    if (!article) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    // If not published, only admins can see it
    if (!article.isPublished) {
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
      }
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT /api/articles/[slug] — Modifier un article (admin) ────
const updateArticleSchema = z.object({
  titre: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  extrait: z.string().min(1).optional(),
  contenu: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  categorie: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const body = await req.json();
    const data = updateArticleSchema.parse(body);

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    // If publishing for the first time, set publishedAt
    const publishedAt =
      data.isPublished && !existing.isPublished
        ? new Date()
        : data.isPublished === false
        ? null
        : undefined;

    const article = await prisma.article.update({
      where: { slug },
      data: {
        ...data,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Donnees invalides", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/articles/[slug] — Supprimer un article (admin) ─
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();
    const { slug } = await params;

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    await prisma.article.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
