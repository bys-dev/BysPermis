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
