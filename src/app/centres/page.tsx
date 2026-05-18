"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Leaflet doit être chargé côté client uniquement (utilise `window`).
const CentresMap = dynamic(
  () => import("@/components/marketplace/CentresMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-xl border border-brand-border bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Chargement de la carte…</span>
      </div>
    ),
  }
);
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationDot,
  faStar,
  faAward,
  faShieldHalved,
  faBookOpen,
  faMapLocationDot,
  faBuilding,
  faCheckCircle,
  faArrowRight,
  faChartLine,
  faHandshake,
  faGlobe,
  faSpinner,
  faCrosshairs,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

// ─── TYPES ────────────────────────────────────────────────

interface Centre {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  adresse?: string;
  logo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isQualiopi: boolean;
  isBYS: boolean;
  nombreFormations: number;
  specialites: string[];
  distance?: number | null;
}

// ─── EMPTY FALLBACK ────────────────────────────────────────

const MOCK_CENTRES: Centre[] = [];

const stats = [
  { value: "150+", label: "Centres partenaires", icon: faBuilding },
  { value: "Toute la France", label: "Couverture nationale", icon: faGlobe },
  { value: "100%", label: "Agréés préfecture", icon: faCheckCircle },
];

// ─── INNER COMPONENT ──────────────────────────────────────

function CentresInner() {
  const searchParams = useSearchParams();
  const villeParam = searchParams.get("ville") ?? "";
  const [searchVille, setSearchVille] = useState(villeParam);
  const [centres, setCentres] = useState<Centre[]>(MOCK_CENTRES);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoRayon, setGeoRayon] = useState(50);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
        setSearchVille("");
        setGeoLoading(false);
      },
      () => {
        setGeoError("Impossible d'obtenir votre position. Vérifiez les permissions.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearGeolocation = () => {
    setUserLat(null);
    setUserLng(null);
    setGeoError(null);
  };

  useEffect(() => {
    if (villeParam) setSearchVille(villeParam);
  }, [villeParam]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("/api/centres", window.location.origin);
        if (userLat !== null && userLng !== null) {
          url.searchParams.set("lat", String(userLat));
          url.searchParams.set("lng", String(userLng));
          url.searchParams.set("rayon", String(geoRayon));
        } else if (searchVille) {
          url.searchParams.set("ville", searchVille);
        }
        const res = await fetch(url.toString());
        type ApiFormation = { titre: string; isQualiopi: boolean };
        type ApiCentre = {
          id: string;
          nom: string;
          slug: string;
          ville?: string | null;
          adresse?: string | null;
          logo?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          formations?: ApiFormation[];
          _count?: { formations?: number };
          distance?: number | null;
        };
        const data: ApiCentre[] = await res.json();
        const mapped: Centre[] = data.map((c) => ({
          id: c.id,
          nom: c.nom,
          slug: c.slug,
          ville: c.ville ?? "",
          adresse: c.adresse ?? undefined,
          logo: c.logo ?? null,
          latitude: c.latitude ?? null,
          longitude: c.longitude ?? null,
          isQualiopi: c.formations?.some((f) => f.isQualiopi) ?? false,
          isBYS: c.nom.toLowerCase().includes("bys"),
          nombreFormations: c._count?.formations ?? 0,
          specialites: [...new Set(c.formations?.map((f) => f.titre.split(" ").slice(0, 3).join(" ")) ?? [])].slice(0, 4),
          distance: c.distance ?? null,
        }));
        // When not using geo, BYS toujours en premier
        if (userLat === null) {
          mapped.sort((a, b) => (a.isBYS && !b.isBYS ? -1 : !a.isBYS && b.isBYS ? 1 : 0));
        }
        setCentres(mapped);
        setTotal(mapped.length);
      } catch {
        setCentres([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchVille, userLat, userLng, geoRayon]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />

      {/* Hero */}
      <section className="bg-[#0A1628] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
            Nos centres partenaires agréés
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Découvrez nos centres de formation partenaires, tous sélectionnés pour leur
            sérieux et la qualité de leurs prestations.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Rechercher par ville ou département..."
              value={searchVille}
              onChange={(e) => { setSearchVille(e.target.value); clearGeolocation(); }}
              className="w-full px-4 py-3.5 pl-11 rounded-lg bg-white text-brand-text"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Geolocation button + radius */}
          <div className="max-w-xl mx-auto mt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={geoLoading ? faSpinner : faCrosshairs}
                className={geoLoading ? "animate-spin" : ""}
              />
              Me localiser
            </button>

            {userLat !== null && userLng !== null && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-300">Rayon :</span>
                  {[10, 25, 50, 100].map((km) => (
                    <button
                      key={km}
                      onClick={() => setGeoRayon(km)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        geoRayon === km
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-blue-200 hover:bg-white/20"
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
                <button
                  onClick={clearGeolocation}
                  className="text-xs text-blue-400/60 hover:text-blue-300 transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="mr-1" />
                  Annuler
                </button>
              </>
            )}

            {geoError && (
              <span className="text-xs text-red-400">{geoError}</span>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-brand-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={stat.icon} className="text-brand-accent text-xl" />
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-brand-text">{stat.value}</p>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Centre grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            <span className="font-semibold text-brand-text">
              {loading ? "…" : total}
            </span>{" "}
            centre{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-4xl text-brand-accent mb-4 animate-spin"
            />
            <p className="text-gray-500">Chargement des centres…</p>
          </div>
        ) : centres.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {centres.map((centre) => (
              <Link
                key={centre.id}
                href={`/centres/${centre.slug}`}
                className={`card p-0 overflow-hidden flex flex-col group ${centre.isBYS ? "ring-2 ring-brand-accent shadow-lg" : ""}`}
              >
                {/* Logo du centre */}
                <div className={`h-32 flex items-center justify-center p-4 ${centre.isBYS ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
                  <div className={`w-20 h-20 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden ${centre.isBYS ? "" : "border border-brand-border"}`}>
                    {centre.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={centre.logo}
                        alt={centre.nom}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : centre.isBYS ? (
                      <img
                        src="/colored-logo.svg"
                        alt={centre.nom}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faBuilding}
                        className="text-brand-accent text-2xl"
                      />
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {centre.isBYS && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        <FontAwesomeIcon icon={faStar} className="mr-1" />
                        BYS Formation
                      </span>
                    )}
                    <span className="badge badge-success text-[10px]">
                      <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />
                      Agréé Préfecture
                    </span>
                    {centre.isQualiopi && (
                      <span className="badge badge-qualiopi text-[10px]">
                        <FontAwesomeIcon icon={faAward} className="mr-1" />
                        Qualiopi
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-display font-semibold text-brand-text mb-1 group-hover:text-brand-accent transition-colors">
                    {centre.nom}
                  </h3>

                  {/* Location */}
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                    <FontAwesomeIcon icon={faLocationDot} className="text-gray-400" />
                    {centre.ville}
                    {centre.distance != null && (
                      <span className="ml-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        à {centre.distance} km
                      </span>
                    )}
                  </p>

                  {/* Info */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faBookOpen} className="w-4 text-gray-400" />
                      {centre.nombreFormations} formation{centre.nombreFormations > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Specialities */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {centre.specialites.slice(0, 2).map((spec) => (
                      <span
                        key={spec}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      >
                        {spec}
                      </span>
                    ))}
                    {centre.specialites.length > 2 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        +{centre.specialites.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-4xl text-gray-300 mb-4"
            />
            <h3 className="font-display font-semibold text-xl text-brand-text mb-2">
              Aucun centre trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier votre recherche.
            </p>
          </div>
        )}
      </section>

      {/* Carte interactive des centres */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faMapLocationDot} className="text-brand-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-brand-text">Trouvez un centre sur la carte</h3>
            <p className="text-gray-500 text-sm">
              {centres.filter((c) => c.latitude && c.longitude).length} centre
              {centres.filter((c) => c.latitude && c.longitude).length > 1 ? "s" : ""} géolocalisé
              {centres.filter((c) => c.latitude && c.longitude).length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <CentresMap
          centres={centres
            .filter((c) => c.latitude != null && c.longitude != null)
            .map((c) => ({
              id: c.id,
              nom: c.nom,
              slug: c.slug,
              ville: c.ville,
              adresse: c.adresse,
              latitude: c.latitude as number,
              longitude: c.longitude as number,
              isBYS: c.isBYS,
            }))}
        />
      </section>

      {/* CTA for centres */}
      <section className="bg-[#0A1628] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm text-blue-300 mb-6">
            <FontAwesomeIcon icon={faHandshake} />
            Devenez partenaire
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Vous êtes un centre de formation ?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez notre réseau de centres partenaires et développez votre activité.
            Bénéficiez d&apos;une visibilité accrue, d&apos;un système de réservation en ligne
            et d&apos;un accompagnement dédié.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
            {[
              {
                icon: faChartLine,
                title: "Visibilité",
                desc: "Augmentez votre taux de remplissage",
              },
              {
                icon: faHandshake,
                title: "Simplicité",
                desc: "Gestion centralisée des réservations",
              },
              {
                icon: faCheckCircle,
                title: "Confiance",
                desc: "Label qualité BYS Formation",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={item.icon} className="text-blue-400" />
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/inscription"
            className="btn-primary px-8 py-3.5 rounded-lg text-lg inline-flex items-center gap-2"
          >
            Rejoignez notre réseau
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function CentresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-gray-400">Chargement…</div>
      </div>
    }>
      <CentresInner />
    </Suspense>
  );
}
