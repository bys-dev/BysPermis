import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCentre } from "@/lib/auth0";
import { slugify } from "@/lib/utils";

// ─── GET /api/formations ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const ville = searchParams.get("ville");
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(50, Number(searchParams.get("perPage") ?? 12));

    const mine = searchParams.get("mine");

    // Si mine=1, retourner les formations du centre connecté
    if (mine === "1") {
      const { requireCentre } = await import("@/lib/auth0");
      const centreUser = await requireCentre();
      const centre = await prisma.centre.findUnique({ where: { userId: centreUser.id } });
      if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

      const formations = await prisma.formation.findMany({
        where: { centreId: centre.id },
        include: { _count: { select: { sessions: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(formations);
    }

    const where: Record<string, unknown> = { isActive: true, centre: { statut: "ACTIF" } };
    if (ville) where.lieu = { contains: ville, mode: "insensitive" };
    if (type && type !== "Tous les types") where.categorie = { nom: type };

    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        include: {
          centre: { select: { nom: true, ville: true, slug: true, stripeOnboardingDone: true } },
          categorie: { select: { nom: true } },
          sessions: {
            where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
            orderBy: { dateDebut: "asc" },
            take: 1,
          },
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.formation.count({ where }),
    ]);

    return NextResponse.json({ formations, total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (err) {
    console.error("[GET /api/formations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/formations — créer une formation ───────────
const createSchema = z.object({
  titre: z.string().min(3).max(200),
  description: z.string().min(10),
  duree: z.string().min(1),
  prix: z.number().positive(),
  modalite: z.enum(["PRESENTIEL", "DISTANCIEL", "HYBRIDE"]).default("PRESENTIEL"),
  lieu: z.string().optional(),
  isQualiopi: z.boolean().default(false),
  isCPF: z.boolean().default(false),
  categorieId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentre();
    const centre = await prisma.centre.findUnique({ where: { userId: user.id } });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    if (centre.statut !== "ACTIF") return NextResponse.json({ error: "Votre centre n'est pas encore activé" }, { status: 403 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const slug = slugify(data.titre) + "-" + centre.slug;

    const formation = await prisma.formation.create({
      data: { ...data, slug, centreId: centre.id },
    });

    return NextResponse.json(formation, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("[POST /api/formations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
