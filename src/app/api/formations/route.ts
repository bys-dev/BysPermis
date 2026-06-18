import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCentre } from "@/lib/auth0";
import { slugify } from "@/lib/utils";
import { geocodeAddress, haversineDistance } from "@/lib/geocoding";
import { getUserCentreId } from "@/lib/centre-utils";

function isVilleFilterClause(clause: unknown): boolean {
  if (!clause || typeof clause !== "object" || !("OR" in clause)) return false;
  const or = (clause as { OR: unknown[] }).OR;
  return or.some((item) => {
    if (!item || typeof item !== "object") return false;
    if ("lieu" in item) return true;
    const centre = (item as { centre?: { ville?: unknown } }).centre;
    return Boolean(centre && "ville" in centre);
  });
}

function stripVilleFilter(where: Record<string, unknown>) {
  if (!where.AND) return;
  where.AND = (where.AND as unknown[]).filter((c) => !isVilleFilterClause(c));
  if ((where.AND as unknown[]).length === 0) delete where.AND;
}

// ─── GET /api/formations ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // ── Pagination ─────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(50, Number(searchParams.get("perPage") ?? 12));
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const rayon = Number(searchParams.get("rayon") ?? 25);

    // ── Mine (centre connecté) ─────────────────────────────
    const mine = searchParams.get("mine");
    if (mine === "1") {
      const { requireCentre } = await import("@/lib/auth0");
      const centreUser = await requireCentre();
      const centreId = await getUserCentreId(centreUser.id, centreUser.role);
      if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
      const centre = { id: centreId };

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
    const dept = searchParams.get("dept");
    const type = searchParams.get("type");
    const prixMin = searchParams.get("prixMin");
    const prixMax = searchParams.get("prixMax");
    const modalite = searchParams.get("modalite");
    const isQualiopi = searchParams.get("isQualiopi");
    const isCPF = searchParams.get("isCPF");
    const duree = searchParams.get("duree");
    const tri = searchParams.get("tri");

    // Scope V1: stages de récupération de points uniquement.
    // Filtre par catégorie OU titre matching (tolère DB historique pas encore migrée).
    const scopeRecupPoints = {
      OR: [
        { categorie: { nom: { contains: "récup", mode: "insensitive" as const } } },
        { categorie: { nom: { contains: "sensib", mode: "insensitive" as const } } },
        { categorie: { nom: { contains: "48", mode: "insensitive" as const } } },
        { categorie: { nom: { contains: "probatoire", mode: "insensitive" as const } } },
        { titre: { contains: "récupération de points", mode: "insensitive" as const } },
        { titre: { contains: "stage 48", mode: "insensitive" as const } },
        { titre: { contains: "sensibilisation", mode: "insensitive" as const } },
      ],
    };

    // Une formation n'est listée que si elle a au moins une session à venir
    // avec des places disponibles (sinon rien à réserver → on ne l'affiche pas).
    const now = new Date();
    const availableSessionFilter = {
      status: "ACTIVE" as const,
      dateDebut: { gte: now },
      placesRestantes: { gt: 0 },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      modalite: "PRESENTIEL",
      centre: {
        statut: "ACTIF",
        isActive: true,
      },
      sessions: { some: availableSessionFilter },
      AND: [scopeRecupPoints],
    };

    // Full-text search across multiple fields
    if (q && q.trim()) {
      where.AND.push({
        OR: [
          { titre: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { centre: { nom: { contains: q, mode: "insensitive" }, statut: "ACTIF", isActive: true } },
          { centre: { ville: { contains: q, mode: "insensitive" }, statut: "ACTIF", isActive: true } },
          { categorie: { nom: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    // Ville filter (on centre.ville or formation.lieu)
    if (ville && ville.trim()) {
      where.AND.push({
        OR: [
          { lieu: { contains: ville, mode: "insensitive" } },
          { centre: { ville: { contains: ville, mode: "insensitive" }, statut: "ACTIF", isActive: true } },
        ],
      });
    }

    // Dept filter — sur les 2-3 premiers chiffres du code postal du centre.
    // (Métropole = 2 chiffres, DOM-TOM 97x/98x = 3 chiffres).
    if (dept && /^\d{2,3}$/.test(dept.trim())) {
      where.AND.push({
        centre: { codePostal: { startsWith: dept.trim() }, statut: "ACTIF", isActive: true },
      });
    }

    // Category filter
    if (type && type !== "Tous les types") {
      where.categorie = { ...(where.categorie ?? {}), nom: type };
    }

    // Price range
    if (prixMin) where.prix = { ...(where.prix ?? {}), gte: Number(prixMin) };
    if (prixMax) where.prix = { ...(where.prix ?? {}), lte: Number(prixMax) };

    // Modalité : scope V1 force PRESENTIEL, on ignore les autres valeurs.
    // (champ where.modalite déjà fixé plus haut)

    // Qualiopi
    if (isQualiopi === "true") where.isQualiopi = true;

    // CPF (en V1, aucun stage récup points n'est éligible CPF — toujours false)
    if (isCPF === "true") where.isCPF = false;

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

    // ── Proximity search (lat/lng explicites ou ville géocodée) ──
    let userLat: number | null = null;
    let userLng: number | null = null;

    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        userLat = parsedLat;
        userLng = parsedLng;
        stripVilleFilter(where);
      }
    } else if (ville && ville.trim()) {
      const coords = await geocodeAddress(ville.trim());
      if (coords) {
        userLat = coords.lat;
        userLng = coords.lng;
        stripVilleFilter(where);
      }
    }

    if (userLat !== null && userLng !== null) {
      const allFormations = await prisma.formation.findMany({
        where,
        include: {
          centre: { select: centreSelect },
          categorie: { select: { nom: true } },
          sessions: {
            where: availableSessionFilter,
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
              haversineDistance(userLat!, userLng!, f.centre.latitude!, f.centre.longitude!) * 10
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
        geo: { lat: userLat, lng: userLng, rayon },
      });
    }

    // ── Standard query ────────────────────────────────────
    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        include: {
          centre: { select: centreSelect },
          categorie: { select: { nom: true } },
          sessions: {
            where: availableSessionFilter,
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
    const centreIdForPost = await getUserCentreId(user.id, user.role);
    if (!centreIdForPost) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    const centre = await prisma.centre.findUnique({ where: { id: centreIdForPost } });
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
