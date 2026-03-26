"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faLocationCrosshairs,
  faStar,
  faAward,
  faShieldHalved,
  faArrowRight,
  faSpinner,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";

interface Centre {
  id: number;
  nom: string;
  slug: string;
  ville: string;
  departement: string;
  note: number;
  avisCount: number;
  isQualiopi: boolean;
  isAgreePrefecture: boolean;
  isBYS?: boolean;
  specialites: string[];
  formations: number;
}

const allCentres: Centre[] = [
  { id: 1, nom: "BYS Formation — Osny", slug: "bys-formation-osny", ville: "Osny", departement: "95", note: 4.9, avisCount: 387, isQualiopi: true, isAgreePrefecture: true, isBYS: true, specialites: ["Récupération de points", "Permis B accéléré", "FIMO/FCO"], formations: 14 },
  { id: 2, nom: "BYS Formation — Cergy", slug: "bys-formation-cergy", ville: "Cergy", departement: "95", note: 4.8, avisCount: 264, isQualiopi: true, isAgreePrefecture: true, isBYS: true, specialites: ["Récupération de points", "Permis B accéléré"], formations: 11 },
  { id: 3, nom: "BYS Formation — Paris", slug: "bys-formation-paris", ville: "Paris", departement: "75", note: 4.9, avisCount: 512, isQualiopi: true, isAgreePrefecture: true, isBYS: true, specialites: ["Récupération de points", "Stage 48N", "FIMO/FCO"], formations: 12 },
  { id: 4, nom: "BYS Formation — Lyon", slug: "bys-formation-lyon", ville: "Lyon", departement: "69", note: 4.8, avisCount: 198, isQualiopi: true, isAgreePrefecture: true, isBYS: true, specialites: ["Récupération de points", "Permis B accéléré"], formations: 8 },
  { id: 5, nom: "Auto-école Dupont", slug: "auto-ecole-dupont", ville: "Cergy", departement: "95", note: 4.6, avisCount: 143, isQualiopi: true, isAgreePrefecture: true, isBYS: false, specialites: ["Récupération de points"], formations: 3 },
  { id: 6, nom: "Centre Formation Routière", slug: "cfr-pontoise", ville: "Pontoise", departement: "95", note: 4.5, avisCount: 89, isQualiopi: false, isAgreePrefecture: true, isBYS: false, specialites: ["Récupération de points", "Stage 48N"], formations: 2 },
  { id: 7, nom: "Sécurité Route Formation", slug: "srf-paris", ville: "Paris", departement: "75", note: 4.7, avisCount: 231, isQualiopi: true, isAgreePrefecture: true, isBYS: false, specialites: ["Récupération de points", "Sécurité routière"], formations: 5 },
  { id: 8, nom: "Formation Conduite Pro", slug: "fcp-versailles", ville: "Versailles", departement: "78", note: 4.4, avisCount: 76, isQualiopi: false, isAgreePrefecture: true, isBYS: false, specialites: ["Récupération de points"], formations: 2 },
];

const cityToDept: Record<string, string> = {
  paris: "75", lyon: "69", marseille: "13", toulouse: "31", nice: "06",
  nantes: "44", bordeaux: "33", lille: "59", strasbourg: "67", montpellier: "34",
  rennes: "35", cergy: "95", osny: "95", pontoise: "95", argenteuil: "95",
  versailles: "78", nanterre: "92",
};

function getDept(city: string): string | null {
  const key = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return cityToDept[key] ?? null;
}

type GeoStatus = "idle" | "loading" | "found" | "denied" | "error";

export function CentresProximite() {
  const [city, setCity] = useState<string | null>(null);
  const [dept, setDept] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [centres, setCentres] = useState<Centre[]>([]);

  // Charger la ville sauvegardée au montage
  useEffect(() => {
    const saved = localStorage.getItem("bys_city");
    if (saved) {
      applyCity(saved);
    } else {
      // Afficher les centres BYS par défaut
      setCentres(allCentres.filter((c) => c.isBYS).slice(0, 4));
    }
  }, []);

  function applyCity(cityName: string) {
    setCity(cityName);
    const d = getDept(cityName);
    setDept(d);
    const nearby = allCentres
      .filter((c) => {
        if (d && c.departement === d) return true;
        if (c.ville.toLowerCase().includes(cityName.toLowerCase())) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.isBYS && !b.isBYS) return -1;
        if (!a.isBYS && b.isBYS) return 1;
        return b.note - a.note;
      })
      .slice(0, 4);

    // Si aucun résultat dans la zone, afficher les BYS
    setCentres(nearby.length > 0 ? nearby : allCentres.filter((c) => c.isBYS).slice(0, 4));
    setGeoStatus("found");
  }

  function detect() {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`
          );
          const data = await res.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || "Votre ville";
          localStorage.setItem("bys_city", cityName);
          applyCity(cityName);
        } catch { setGeoStatus("error"); }
      },
      (err) => { setGeoStatus(err.code === 1 ? "denied" : "error"); },
      { timeout: 8000 }
    );
  }

  return (
    <section className="py-20 px-4 sm:px-8 bg-white">
      <div className="max-w-[1440px] mx-auto">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
              <FontAwesomeIcon icon={faLocationDot} />
              {city ? `Centres près de ${city}${dept ? ` (${dept})` : ""}` : "Centres recommandés"}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text">
              {city ? "Stages disponibles près de chez vous" : "Nos centres partenaires"}
            </h2>
            <p className="text-gray-500 mt-2 text-lg">
              {city
                ? `${centres.length} centre${centres.length > 1 ? "s" : ""} trouvé${centres.length > 1 ? "s" : ""} dans votre zone`
                : "Activez la géolocalisation pour voir les centres près de chez vous"}
            </p>
          </div>

          {/* Bouton géoloc */}
          {!city ? (
            <button
              onClick={detect}
              disabled={geoStatus === "loading"}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 shadow-lg shadow-blue-600/20"
            >
              {geoStatus === "loading"
                ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                : <FontAwesomeIcon icon={faLocationCrosshairs} className="w-4 h-4" />
              }
              {geoStatus === "loading" ? "Localisation…" : "Détecter ma position"}
            </button>
          ) : (
            <button
              onClick={detect}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-blue-600 hover:bg-blue-50 transition-all border border-blue-200"
            >
              <FontAwesomeIcon icon={faLocationCrosshairs} className="w-3.5 h-3.5" />
              Changer de position
            </button>
          )}
        </div>

        {/* Erreur permission */}
        {geoStatus === "denied" && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            Géolocalisation refusée. Autorisez-la dans votre navigateur puis réessayez.
          </div>
        )}

        {/* Grille de centres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {centres.map((c) => (
            <Link
              key={c.id}
              href={`/centres/${c.slug}`}
              className="group flex flex-col rounded-2xl border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{
                borderColor: c.isBYS ? "#3B82F6" : "#E5E7EB",
                boxShadow: c.isBYS ? "0 0 0 2px rgba(59,130,246,0.15)" : undefined,
              }}
            >
              {/* Header card */}
              <div className="px-5 pt-5 pb-4" style={{ background: c.isBYS ? "linear-gradient(135deg, #0A1628 0%, #0f2044 100%)" : "#F9FAFB" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.isBYS ? "bg-blue-600" : "bg-white border border-gray-200"}`}>
                    {c.isBYS
                      ? <span className="font-bold text-xs text-white">BYS</span>
                      : <FontAwesomeIcon icon={faBuilding} className="text-gray-400 w-4 h-4" />
                    }
                  </div>
                  {c.isBYS && (
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Partenaire officiel
                    </span>
                  )}
                </div>
                <h3 className={`font-display font-bold text-sm leading-tight ${c.isBYS ? "text-white" : "text-brand-text"}`}>
                  {c.nom}
                </h3>
                <p className={`text-xs mt-1 flex items-center gap-1 ${c.isBYS ? "text-blue-300" : "text-gray-500"}`}>
                  <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                  {c.ville} — Dép. {c.departement}
                </p>
              </div>

              {/* Body card */}
              <div className="flex-1 px-5 py-4 bg-white">
                {/* Note */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className={`w-3 h-3 ${i < Math.floor(c.note) ? "text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-brand-text">{c.note}</span>
                  <span className="text-xs text-gray-400">({c.avisCount} avis)</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {c.isAgreePrefecture && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-2.5 h-2.5" />
                      Agréé préfecture
                    </span>
                  )}
                  {c.isQualiopi && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <FontAwesomeIcon icon={faAward} className="w-2.5 h-2.5" />
                      Qualiopi
                    </span>
                  )}
                </div>

                {/* Formations */}
                <p className="text-xs text-gray-500">{c.formations} formations disponibles</p>
              </div>

              {/* Footer card */}
              <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                  Voir les stages
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Voir tous */}
        <div className="text-center mt-10">
          <Link
            href={city ? `/centres?ville=${encodeURIComponent(city)}` : "/centres"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-brand-border text-brand-text hover:border-blue-600 hover:text-blue-600 transition-all"
          >
            Voir tous les centres
            <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
