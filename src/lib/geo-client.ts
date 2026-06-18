export const GEO_STORAGE_KEYS = {
  city: "bys_city",
  dept: "bys_dept",
  lat: "bys_lat",
  lng: "bys_lng",
} as const;

export const GEO_UPDATED_EVENT = "bys:geolocation";

export interface GeoLocationDetail {
  city: string;
  dept: string | null;
  lat: number;
  lng: number;
  rayon?: number;
}

export function saveGeoToStorage(geo: GeoLocationDetail) {
  localStorage.setItem(GEO_STORAGE_KEYS.city, geo.city);
  localStorage.setItem(GEO_STORAGE_KEYS.lat, String(geo.lat));
  localStorage.setItem(GEO_STORAGE_KEYS.lng, String(geo.lng));
  if (geo.dept) localStorage.setItem(GEO_STORAGE_KEYS.dept, geo.dept);
  else localStorage.removeItem(GEO_STORAGE_KEYS.dept);
}

export function readGeoFromStorage(): GeoLocationDetail | null {
  if (typeof window === "undefined") return null;
  const lat = localStorage.getItem(GEO_STORAGE_KEYS.lat);
  const lng = localStorage.getItem(GEO_STORAGE_KEYS.lng);
  const city = localStorage.getItem(GEO_STORAGE_KEYS.city);
  if (!lat || !lng || !city) return null;
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) return null;
  return {
    city,
    dept: localStorage.getItem(GEO_STORAGE_KEYS.dept),
    lat: parsedLat,
    lng: parsedLng,
    rayon: 25,
  };
}

export function dispatchGeoUpdated(geo: GeoLocationDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<GeoLocationDetail>(GEO_UPDATED_EVENT, { detail: geo }));
}

export function clearGeoStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GEO_STORAGE_KEYS.city);
  localStorage.removeItem(GEO_STORAGE_KEYS.dept);
  localStorage.removeItem(GEO_STORAGE_KEYS.lat);
  localStorage.removeItem(GEO_STORAGE_KEYS.lng);
}
