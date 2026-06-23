import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeCoords } from "@/lib/geocoding";

/** GET /api/geolocation/reverse?lat=&lng= — ville depuis coordonnées GPS */
export async function GET(req: NextRequest) {
  try {
    const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
    const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
    }

    const result = await reverseGeocodeCoords(lat, lng);
    if (!result) {
      return NextResponse.json({ error: "Ville introuvable pour ces coordonnées" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/geolocation/reverse]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
