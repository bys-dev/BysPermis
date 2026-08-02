"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationCrosshairs,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  dispatchGeoUpdated,
  readGeoFromStorage,
  saveGeoToStorage,
  type GeoLocationDetail,
} from "@/lib/geo-client";

/** Rayon de recherche autour de la position détectée, en kilomètres. */
const RAYON_KM = 25;

type GeoStatus = "idle" | "loading" | "active" | "denied" | "error";

/**
 * Formulaire de recherche du hero (client only).
 *
 * Un seul champ de saisie, la localisation étant fournie par le navigateur
 * plutôt que tapée à la main. La géolocalisation reste facultative : sans
 * elle, le terme saisi sert aussi à chercher une ville, et l'utilisateur n'est
 * jamais bloqué s'il refuse le partage de sa position.
 *
 * La position détectée est partagée avec le reste du site via `geo-client`
 * (même stockage et même évènement que le sélecteur du header), pour que les
 * pages de recherche et de centres restent cohérentes.
 */
export default function HeroSearchForm() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geo, setGeo] = useState<GeoLocationDetail | null>(null);

  // Position déjà accordée lors d'une visite précédente : on la reprend, sans
  // redemander la permission au navigateur.
  useEffect(() => {
    const stored = readGeoFromStorage();
    if (stored) {
      setGeo(stored);
      setGeoStatus("active");
    }
  }, []);

  function detecterPosition() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `/api/geolocation/reverse?lat=${latitude}&lng=${longitude}`,
          );
          if (!res.ok) throw new Error("reverse geocode failed");
          const data = await res.json();

          const detail: GeoLocationDetail = {
            city: data.city || "Votre position",
            dept: data.dept ?? null,
            lat: latitude,
            lng: longitude,
            rayon: RAYON_KM,
          };
          setGeo(detail);
          saveGeoToStorage(detail);
          dispatchGeoUpdated(detail);
          setGeoStatus("active");
        } catch {
          setGeoStatus("error");
        }
      },
      // Refus explicite (code 1) et échec technique méritent deux messages
      // distincts : le premier appelle à saisir une ville, le second à réessayer.
      (err) => setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function onToggleGeo(checked: boolean) {
    if (checked) {
      detecterPosition();
      return;
    }
    setGeo(null);
    setGeoStatus("idle");
  }

  const geoActive = geoStatus === "active" && geo !== null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (geoActive && geo) {
          params.set("lat", String(geo.lat));
          params.set("lng", String(geo.lng));
          params.set("rayon", String(geo.rayon ?? RAYON_KM));
          params.set("ville", geo.city);
        }
        router.push(`/recherche?${params.toString()}`);
      }}
      className="bg-white/95 backdrop-blur-md rounded-2xl ring-1 ring-black/5 shadow-2xl p-5 sm:p-7 md:p-8 max-w-4xl mx-auto text-left"
    >
      <label
        htmlFor="hero-search"
        className="block text-sm font-semibold text-gray-800 mb-2"
      >
        Chercher un stage près de chez vous
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative group flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"
          />
          <input
            id="hero-search"
            type="text"
            placeholder="Ville, code postal ou type de stage"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 placeholder-gray-400 text-sm sm:text-base transition-all duration-200 hover:border-gray-300"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 transition-all duration-200 active:scale-[0.98] shrink-0"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
          <span>Trouver mon stage</span>
        </button>
      </div>

      <div className="mt-4">
        <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={geoActive}
            disabled={geoStatus === "loading"}
            onChange={(e) => onToggleGeo(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer disabled:cursor-wait"
          />
          <span className="text-sm text-gray-700">
            <FontAwesomeIcon
              icon={geoStatus === "loading" ? faSpinner : faLocationCrosshairs}
              className={`mr-1.5 text-blue-600 ${geoStatus === "loading" ? "animate-spin" : ""}`}
            />
            Activer la géolocalisation
            {geoStatus === "loading" && (
              <span className="text-gray-500"> — localisation en cours…</span>
            )}
            {geoActive && geo && (
              <span className="text-gray-500">
                {" "}
                — stages à moins de {geo.rayon ?? RAYON_KM} km de{" "}
                <span className="font-medium text-gray-800">{geo.city}</span>
              </span>
            )}
          </span>
        </label>

        {geoStatus === "denied" && (
          <p className="mt-2 text-xs text-amber-700 flex items-start gap-1.5">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
            Localisation refusée. Autorisez-la dans votre navigateur, ou saisissez
            simplement votre ville dans le champ ci-dessus.
          </p>
        )}
        {geoStatus === "error" && (
          <p className="mt-2 text-xs text-amber-700 flex items-start gap-1.5">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 shrink-0" />
            Position introuvable. Réessayez, ou saisissez votre ville dans le champ
            ci-dessus.
          </p>
        )}
      </div>

    </form>
  );
}
