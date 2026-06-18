/**
 * Geocoding utility using the free French government API
 * https://api-adresse.data.gouv.fr
 */

interface GeoApiFeature {
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    label: string;
    score: number;
  };
}

interface GeoApiResponse {
  features: GeoApiFeature[];
}

interface GeoApiReverseFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    label?: string;
  };
}

interface GeoApiReverseResponse {
  features: GeoApiReverseFeature[];
}

export interface ReverseGeocodeResult {
  lat: number;
  lng: number;
  city: string;
  postcode: string | null;
  dept: string | null;
}

function deptFromPostcode(postcode: string | undefined): string | null {
  if (!postcode || !/^\d{5}$/.test(postcode)) return null;
  return postcode.startsWith("97") || postcode.startsWith("98")
    ? postcode.slice(0, 3)
    : postcode.slice(0, 2);
}

/**
 * Geocode a French address using api-adresse.data.gouv.fr (free, no API key)
 * Returns { lat, lng } or null if not found
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encoded}&limit=1`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data: GeoApiResponse = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const [lng, lat] = data.features[0].geometry.coordinates;
    return { lat, lng };
  } catch (err) {
    console.error("[geocodeAddress] Erreur:", err);
    return null;
  }
}

/**
 * Reverse geocode GPS coordinates using api-adresse.data.gouv.fr (France)
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data: GeoApiReverseResponse = await res.json();
    if (!data.features?.length) return null;

    const props = data.features[0].properties;
    const city =
      props.city ||
      props.town ||
      props.village ||
      props.municipality ||
      props.label?.split(",")[0]?.trim() ||
      "Votre ville";

    const postcode = props.postcode ?? null;
    return {
      lat,
      lng,
      city,
      postcode,
      dept: deptFromPostcode(postcode ?? undefined),
    };
  } catch (err) {
    console.error("[reverseGeocodeCoords] Erreur:", err);
    return null;
  }
}

/**
 * Calculate distance between two GPS points using the Haversine formula
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
