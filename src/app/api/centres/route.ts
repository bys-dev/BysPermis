import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";
import { geocodeAddress, haversineDistance } from "@/lib/geocoding";

// GET /api/centres — liste publique des centres actifs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const ville = searchParams.get("ville");
    const statut = searchParams.get("statut");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const rayon = Number(searchParams.get("rayon") ?? 50);

    const validStatuts = ["ACTIF", "EN_ATTENTE", "SUSPENDU"];
    const statutFilter = statut && validStatuts.includes(statut)
      ? { statut: statut as "ACTIF" | "EN_ATTENTE" | "SUSPENDU" }
      : statut === "all"
        ? {}
        : { statut: "ACTIF" as const, isActive: true };

    const centres = await prisma.centre.findMany({
      where: {
        ...statutFilter,
        ...(ville ? { ville: { contains: ville, mode: "insensitive" } } : {}),
      },
      include: {
        formations: {
          where: { isActive: true },
          select: { id: true, titre: true, prix: true, isQualiopi: true },
          take: 5,
        },
        _count: { select: { formations: true } },
      },
      orderBy: { nom: "asc" },
    });

    // If lat/lng provided, filter by proximity and add distance
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      if (!isNaN(userLat) && !isNaN(userLng)) {
        const withDistance = centres
          .filter((c) => c.latitude !== null && c.longitude !== null)
          .map((c) => ({
            ...c,
            distance: Math.round(
              haversineDistance(userLat, userLng, c.latitude!, c.longitude!) * 10
            ) / 10,
          }))
          .filter((c) => c.distance <= rayon)
          .sort((a, b) => a.distance - b.distance);

        // Also include centres without coordinates at the end
        const withoutCoords = centres
          .filter((c) => c.latitude === null || c.longitude === null)
          .map((c) => ({ ...c, distance: null }));

        return NextResponse.json([...withDistance, ...withoutCoords]);
      }
    }

    return NextResponse.json(centres);
  } catch (err) {
    console.error("[GET /api/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/centres/:id — admin: valider/suspendre un centre
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, statut } = body;

    if (!id || !statut) return NextResponse.json({ error: "id et statut requis" }, { status: 400 });
    if (!["ACTIF", "SUSPENDU", "EN_ATTENTE"].includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const centre = await prisma.centre.update({
      where: { id },
      data: { statut, isActive: statut === "ACTIF" },
    });

    return NextResponse.json(centre);
  } catch (err) {
    console.error("[PATCH /api/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/centres — créer un centre (avec geocoding automatique)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Geocode the address
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (body.adresse && body.codePostal && body.ville) {
      const fullAddress = `${body.adresse}, ${body.codePostal} ${body.ville}`;
      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    const centre = await prisma.centre.create({
      data: {
        ...body,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(centre, { status: 201 });
  } catch (err) {
    console.error("[POST /api/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/centres — mettre à jour un centre (avec re-geocoding si adresse change)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    // Re-geocode if address fields changed
    if (data.adresse || data.codePostal || data.ville) {
      const existing = await prisma.centre.findUnique({ where: { id } });
      if (existing) {
        const adresse = data.adresse ?? existing.adresse;
        const codePostal = data.codePostal ?? existing.codePostal;
        const ville = data.ville ?? existing.ville;
        const fullAddress = `${adresse}, ${codePostal} ${ville}`;
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          data.latitude = coords.lat;
          data.longitude = coords.lng;
        }
      }
    }

    const centre = await prisma.centre.update({
      where: { id },
      data,
    });

    return NextResponse.json(centre);
  } catch (err) {
    console.error("[PUT /api/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
