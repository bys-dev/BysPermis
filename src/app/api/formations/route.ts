import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCentre } from "@/lib/auth0";
import { slugify } from "@/lib/utils";
import { haversineDistance } from "@/lib/geocoding";

// ─── GET /api/formations ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // ── Pagination ─────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(50, Number(searchParams.get("perPage") ?? 12));
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const rayon = Number(searchParams.get("rayon") ?? 50);

    // ── Mine (centre connecté) ─────────────────────────────
    const mine = searchParams.get("mine");
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

    // ── Filters ────────────────────────────────────────────
    const q = searchParams.get("q");
    const ville = searchParams.get("ville");
    const type = searchParams.get("type");
    const prixMin = searchParams.get("prixMin");
    const prixMax = searchParams.get("prixMax");
    const modalite = searchParams.get("modalite");
    const isQualiopi = searchParams.get("isQualiopi");
    const isCPF = searchParams.get("isCPF");
    const duree = searchParams.get("duree");
    const tri = searchParams.get("tri");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      centre: {
        statut: "ACTIF",
        isActive: true,
      },
    };

    // Full-text search across multiple fields
    if (q && q.trim()) {
      where.OR = [
        { titre: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { centre: { nom: { contains: q, mode: "insensitive" }, statut: "ACTIF", isActive: true } },
        { centre: { ville: { contains: q, mode: "insensitive" }, statut: "ACTIF", isActive: true } },
        { categorie: { nom: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Ville filter (on centre.ville or formation.lieu)
    if (ville && ville.trim()) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { lieu: { contains: ville, mode: "insensitive" } },
            { centre: { ville: { contains: ville, mode: "insensitive" }, statut: "ACTIF", isActive: true } },
          ],
        },
      ];
    }

    // Category filter
    if (type && type !== "Tous les types") {
      where.categorie = { ...(where.categorie ?? {}), nom: type };
    }

    // Price range
    if (prixMin) where.prix = { ...(where.prix ?? {}), gte: Number(prixMin) };
    if (prixMax) where.prix = { ...(where.prix ?? {}), lte: Number(prixMax) };

    // Modalité
    if (modalite && ["PRESENTIEL", "DISTANCIEL", "HYBRIDE"].includes(modalite)) {
      where.modalite = modalite;
    }

    // Qualiopi
    if (isQualiopi === "true") where.isQualiopi = true;

    // CPF
    if (isCPF === "true") where.isCPF = true;

    // Durée
    if (duree && duree.trim()) {
      where.duree = { contains: duree, mode: "insensitive" };
    }

    // ── Sort ───────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    switch (tri) {
      case "prix_asc":
        orderBy = { prix: "asc" };
        break;
      case "prix_desc":
        orderBy = { prix: "desc" };
        break;
      case "date":
        orderBy = { createdAt: "desc" };
        break;
      case "pertinence":
      default:
        // Default: BYS-priority already handled client-side, use createdAt
        orderBy = { createdAt: "desc" };
        break;
    }

    const centreSelect = {
      nom: true, ville: true, slug: true, stripeOnboardingDone: true,
      latitude: true, longitude: true,
    };

    // ── Proximity search ──────────────────────────────────
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      if (!isNaN(userLat) && !isNaN(userLng)) {
        // Remove ville filter when doing geo search
        if (where.AND) {
          where.AND = (where.AND as unknown[]).filter(
            (c: unknown) => !(c && typeof c === "object" && "OR" in c)
          );
          if ((where.AND as unknown[]).length === 0) delete where.AND;
        }
        delete where.lieu;

        const allFormations = await prisma.formation.findMany({
          where,
          include: {
            centre: { select: centreSelect },
            categorie: { select: { nom: true } },
            sessions: {
              where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
              orderBy: { dateDebut: "asc" },
              take: 1,
            },
          },
          orderBy,
        });

        const withDistance = allFormations
          .filter((f) => f.centre.latitude !== null && f.centre.longitude !== null)
          .map((f) => ({
            ...f,
            distance:
              Math.round(
                haversineDistance(userLat, userLng, f.centre.latitude!, f.centre.longitude!) * 10
              ) / 10,
          }))
          .filter((f) => f.distance <= rayon)
          .sort((a, b) => a.distance - b.distance);

        const total = withDistance.length;
        const paginated = withDistance.slice((page - 1) * perPage, page * perPage);

        return NextResponse.json({
          formations: paginated,
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        });
      }
    }

    // ── Standard query ────────────────────────────────────
    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        include: {
          centre: { select: centreSelect },
          categorie: { select: { nom: true } },
          sessions: {
            where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
            orderBy: { dateDebut: "asc" },
            take: 1,
          },
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
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
