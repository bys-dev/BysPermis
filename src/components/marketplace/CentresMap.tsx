"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

export interface MapCentre {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  adresse?: string;
  latitude: number;
  longitude: number;
  isBYS?: boolean;
}

function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete ((L.Icon.Default.prototype as unknown) as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function MapPlaceholder() {
  return (
    <div className="h-[360px] sm:h-[480px] lg:h-[560px] w-full rounded-xl border border-brand-border bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
      <span className="text-gray-400 text-sm">Chargement de la carte…</span>
    </div>
  );
}

export default function CentresMap({ centres }: { centres: MapCentre[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcons();
    setMounted(true);
  }, []);

  const bysIcon = useMemo(
    () =>
      new L.DivIcon({
        className: "bys-map-marker",
        html: `<div style="background:#0A1628;color:white;border-radius:9999px;border:3px solid #DC2626;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;box-shadow:0 4px 10px rgba(0,0,0,.3)">BYS</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );

  const geolocated = useMemo(
    () =>
      centres.filter(
        (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude),
      ),
    [centres],
  );

  const defaultCenter: [number, number] = geolocated.length
    ? [geolocated[0].latitude, geolocated[0].longitude]
    : [46.6, 2.4];

  const mapKey = geolocated.map((c) => c.id).join("-") || "france";

  if (!mounted) {
    return <MapPlaceholder />;
  }

  return (
    <div className="h-[360px] sm:h-[480px] lg:h-[560px] w-full rounded-xl overflow-hidden border border-brand-border">
      <MapContainer
        key={mapKey}
        center={defaultCenter}
        zoom={geolocated.length > 1 ? 6 : geolocated.length === 1 ? 10 : 5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geolocated.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude, c.longitude]}
            icon={c.isBYS ? bysIcon : undefined}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-brand-text mb-1">{c.nom}</p>
                {c.adresse && <p className="text-gray-600 text-xs">{c.adresse}</p>}
                <p className="text-gray-600 text-xs mb-2">{c.ville}</p>
                <Link
                  href={`/centres/${c.slug}`}
                  className="text-brand-accent hover:underline text-xs font-semibold"
                >
                  Voir le centre →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
