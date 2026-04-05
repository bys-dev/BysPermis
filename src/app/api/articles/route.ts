import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth0";

// ─── GET /api/articles — Liste publique des articles publiés ─────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const categorie = searchParams.get("categorie");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(50, Number(searchParams.get("perPage") ?? 12));
    const admin = searchParams.get("admin");

    // Admin mode: return all articles (including drafts)
    if (admin === "1") {
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 });
      }

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
          include: { author: { select: { id: true, prenom: true, nom: true } } },
        }),
        prisma.article.count(),
      ]);

      return NextResponse.json({ articles, total, page, perPage });
    }

    // Public mode: only published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isPublished: true };
    if (categorie) {
      where.categorie = categorie;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          titre: true,
          slug: true,
          extrait: true,
          image: true,
          categorie: true,
          tags: true,
          publishedAt: true,
          author: { select: { prenom: true, nom: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({ articles, total, page, perPage });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/articles — Creer un article (admin) ──────────────
const createArticleSchema = z.object({
  titre: z.string().min(1),
  slug: z.string().min(1),
  extrait: z.string().min(1),
  contenu: z.string().min(1),
  image: z.string().nullable().optional(),
  categorie: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    const data = createArticleSchema.parse(body);

    const article = await prisma.article.create({
      data: {
        titre: data.titre,
        slug: data.slug,
        extrait: data.extrait,
        contenu: data.contenu,
        image: data.image ?? null,
        categorie: data.categorie ?? null,
        tags: data.tags ?? [],
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? new Date() : null,
        authorId: user.id,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Donnees invalides", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Non autorise") {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
