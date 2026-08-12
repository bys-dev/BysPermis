import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCentre } from "@/lib/auth0";
import { slugify } from "@/lib/utils";
import { geocodeAddress } from "@/lib/geocoding";
import { getUserCentreId } from "@/lib/centre-utils";
import { termes } from "@/lib/search/text";
import { classerFormations, estTri, resoudreLieu, type Coordonnees } from "@/lib/search/formations";

/**
 * Plafond du classement en mémoire.
 *
 * Le filtrage dur reste en base ; seul l'ordonnancement (pertinence, distance,
 * date de la prochaine session) se fait ici, sur un catalogue qui se compte en
 * centaines de lignes. Le plafond est un garde-fou, pas un mode de pagination :
 * s'il est atteint, c'est que le catalogue a changé d'ordre de grandeur et que
 * la recherche mérite un vrai index plein texte.
 */
const MAX_CLASSEMENT = 500;

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

    // La requête libre `q` et la commune ne sont volontairement pas filtrées en
    // base : `contains` ignore la casse mais pas les accents, si bien que
    // « recuperation de points » ou « saint etienne » ne remontaient rien. Le
    // tri se faisant de toute façon en mémoire, ces deux filtres y sont traités
    // ensemble, sans accent et avec un vrai score (cf. lib/search).

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

    const centreSelect = {
      nom: true, ville: true, codePostal: true, slug: true, stripeOnboardingDone: true,
      latitude: true, longitude: true,
    };

    // ── Point de référence géographique ────────────────────
    // Priorité au référentiel communal local : il couvre les communes
    // courantes sans appel réseau, et le géocodeur ne sert plus que de repli.
    let origine: Coordonnees | null = null;
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) origine = { lat: parsedLat, lng: parsedLng };
    } else if (ville && ville.trim()) {
      origine = resoudreLieu(ville) ?? (await geocodeAddress(ville.trim()));
    }

    const lignes = await prisma.formation.findMany({
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
      orderBy: { createdAt: "desc" },
      take: MAX_CLASSEMENT,
    });

    const { resultats, elargi } = classerFormations(lignes, {
      termesRecherche: q?.trim() ? termes(q) : [],
      origine,
      villeRecherchee: ville,
      rayonKm: rayon,
      tri: estTri(tri) ? tri : "pertinence",
    });

    const total = resultats.length;
    const formations = resultats.slice((page - 1) * perPage, page * perPage);

    return NextResponse.json({
      formations,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      ...(origine ? { geo: { ...origine, rayon, elargi } } : {}),
    });
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
