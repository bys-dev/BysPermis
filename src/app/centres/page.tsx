"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationDot,
  faStar,
  faAward,
  faShieldHalved,
  faBookOpen,
  faMapLocationDot,
  faCheckCircle,
  faArrowRight,
  faChartLine,
  faHandshake,
  faGlobe,
  faSpinner,
  faCrosshairs,
  faXmark,
  faList,
  faTableCells,
  faChevronLeft,
  faChevronRight,
  faSlidersH,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { CentresMapBoundary } from "@/components/marketplace/CentresMapBoundary";
import {
  dispatchGeoUpdated,
  readGeoFromStorage,
  saveGeoToStorage,
  type GeoLocationDetail,
} from "@/lib/geo-client";

const CentresMap = dynamic(
  () => import("@/components/marketplace/CentresMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-xl border border-brand-border bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Chargement de la carte…</span>
      </div>
    ),
  },
);

// ─── TYPES ────────────────────────────────────────────────

interface Centre {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  codePostal?: string | null;
  adresse?: string;
  logo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isQualiopi: boolean;
  isBYS: boolean;
  nombreFormations: number;
  specialites: string[];
  distance?: number | null;
  dept?: string;
}

type ViewMode = "grid" | "list";
type SortMode = "alpha" | "dist" | "formations";

const DEPT_LABELS: Record<string, string> = {
  "75": "Paris (75)",
  "92": "Hauts-de-Seine (92)",
  "95": "Val d'Oise (95)",
};

const DEPT_COLORS: Record<string, string> = {
  "75": "bg-blue-100 text-blue-700 border-blue-200",
  "92": "bg-purple-100 text-purple-700 border-purple-200",
  "95": "bg-green-100 text-green-700 border-green-200",
};

const PAGE_SIZE = 12;

// ─── AVATAR INITIALES ─────────────────────────────────────

const AVATAR_COLORS = [
  "#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444",
  "#06B6D4","#EC4899","#6366F1","#14B8A6","#F97316",
];

function centreColor(nom: string): string {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function centreInitials(nom: string): string {
  return (nom ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function CentreAvatar({ centre, size = "md" }: { centre: Centre; size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const sz = size === "sm" ? "w-10 h-10 text-sm" : size === "lg" ? "w-24 h-24 text-2xl" : "w-16 h-16 text-lg";

  if (centre.logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={centre.isBYS ? "/colored-logo.svg" : centre.logo}
        alt={centre.nom}
        className="w-full h-full object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    );
  }

  if (centre.isBYS) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/colored-logo.svg" alt={centre.nom} className="w-full h-full object-contain p-1.5" />
    );
  }

  return (
    <div
      className={`${sz} rounded-xl flex items-center justify-center font-bold text-white select-none`}
      style={{ background: centreColor(centre.nom) }}
    >
      {centreInitials(centre.nom)}
    </div>
  );
}

// ─── DEPT BADGE ───────────────────────────────────────────

function DeptBadge({ dept }: { dept?: string }) {
  if (!dept || !DEPT_LABELS[dept]) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${DEPT_COLORS[dept] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {dept}
    </span>
  );
}

// ─── CARD GRILLE ──────────────────────────────────────────

function CentreCardGrid({ centre }: { centre: Centre }) {
  return (
    <Link
      href={`/centres/${centre.slug}`}
      className={`card p-0 overflow-hidden flex flex-col group transition-all hover:-translate-y-0.5 ${centre.isBYS ? "ring-2 ring-brand-accent shadow-lg" : "hover:shadow-md"}`}
    >
      <div className={`h-28 flex items-center justify-center p-4 ${centre.isBYS ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
        <div className={`w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden ${centre.isBYS ? "" : "border border-brand-border"}`}>
          <CentreAvatar centre={centre} />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1 mb-2">
          {centre.isBYS && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
              <FontAwesomeIcon icon={faStar} className="mr-1" />BYS
            </span>
          )}
          <span className="badge badge-success text-[10px]">
            <FontAwesomeIcon icon={faShieldHalved} className="mr-1" />Agréé
          </span>
          {centre.isQualiopi && (
            <span className="badge badge-qualiopi text-[10px]">
              <FontAwesomeIcon icon={faAward} className="mr-1" />Qualiopi
            </span>
          )}
          <DeptBadge dept={centre.dept} />
        </div>

        <h3 className="font-display font-semibold text-brand-text text-sm mb-1 group-hover:text-brand-accent transition-colors line-clamp-2">
          {centre.nom}
        </h3>

        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 shrink-0" />
          <span className="truncate">{centre.ville}</span>
          {centre.distance != null && (
            <span className="ml-auto shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              {centre.distance} km
            </span>
          )}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <FontAwesomeIcon icon={faBookOpen} className="text-gray-400 w-3" />
          {centre.nombreFormations} formation{centre.nombreFormations > 1 ? "s" : ""}
        </div>

        <div className="flex flex-wrap gap-1 mt-auto">
          {centre.specialites.slice(0, 1).map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 truncate max-w-[140px]">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── CARD LISTE ───────────────────────────────────────────

function CentreCardList({ centre }: { centre: Centre }) {
  return (
    <Link
      href={`/centres/${centre.slug}`}
      className={`card p-4 flex items-center gap-4 group hover:shadow-md transition-all ${centre.isBYS ? "ring-2 ring-brand-accent" : ""}`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${centre.isBYS ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-slate-50 border border-brand-border"}`}>
        <div className="w-12 h-12 flex items-center justify-center">
          <CentreAvatar centre={centre} size="sm" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1 mb-1">
              {centre.isBYS && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                  BYS
                </span>
              )}
              <span className="badge badge-success text-[10px]">Agréé Préfecture</span>
              {centre.isQualiopi && <span className="badge badge-qualiopi text-[10px]">Qualiopi</span>}
              <DeptBadge dept={centre.dept} />
            </div>
            <h3 className="font-semibold text-brand-text group-hover:text-brand-accent transition-colors truncate">
              {centre.nom}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 w-3" />
              {centre.ville}
              {centre.adresse && <span className="hidden sm:inline text-gray-400"> · {centre.adresse}</span>}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {centre.distance != null && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full block mb-1">
                {centre.distance} km
              </span>
            )}
            <span className="text-xs text-gray-500">
              {centre.nombreFormations} formation{centre.nombreFormations > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {centre.specialites.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 group-hover:text-brand-accent shrink-0 transition-colors hidden sm:block" />
    </Link>
  );
}

// ─── PAGINATION ───────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center border border-brand-border text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
              p === page
                ? "bg-brand-accent text-white border border-brand-accent"
                : "border border-brand-border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-lg flex items-center justify-center border border-brand-border text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
      </button>
    </div>
  );
}

// ─── INNER COMPONENT ──────────────────────────────────────

function CentresInner() {
  const searchParams = useSearchParams();
  const villeParam = searchParams.get("ville") ?? "";

  const [searchVille, setSearchVille] = useState(villeParam);
  const [allCentres, setAllCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoRayon, setGeoRayon] = useState(50);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Filters & display
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [onlyQualiopi, setOnlyQualiopi] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Geolocation ──────────────────────────────────────────

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/geolocation/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const geo: GeoLocationDetail = { city: data.city || "Votre ville", dept: data.dept ?? null, lat: latitude, lng: longitude, rayon: geoRayon };
            saveGeoToStorage(geo);
            dispatchGeoUpdated(geo);
            setSearchVille(geo.city);
          } else setSearchVille("");
        } catch { setSearchVille(""); }
        setUserLat(latitude);
        setUserLng(longitude);
        setGeoLoading(false);
      },
      () => { setGeoError("Impossible d'obtenir votre position."); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const clearGeo = () => { setUserLat(null); setUserLng(null); setGeoError(null); };

  // ── Init geo from storage ─────────────────────────────────

  useEffect(() => {
    if (villeParam) { setSearchVille(villeParam); clearGeo(); return; }
    const saved = readGeoFromStorage();
    if (saved) { setSearchVille(saved.city); setUserLat(saved.lat); setUserLng(saved.lng); setGeoRayon(saved.rayon ?? 25); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villeParam]);

  // ── Fetch centres ─────────────────────────────────────────

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
        if (!res.ok) { setAllCentres([]); return; }
        type ApiF = { titre: string; isQualiopi: boolean };
        type ApiC = { id: string; nom: string; slug: string; ville?: string | null; codePostal?: string | null; adresse?: string | null; logo?: string | null; latitude?: number | null; longitude?: number | null; formations?: ApiF[]; _count?: { formations?: number }; distance?: number | null };
        const data: unknown = await res.json();
        if (!Array.isArray(data)) { setAllCentres([]); return; }
        const mapped: Centre[] = data.map((c: ApiC) => {
          const cp = c.codePostal ?? "";
          const dept = cp.length >= 2 ? cp.slice(0, 2) : undefined;
          return {
            id: c.id, nom: c.nom, slug: c.slug,
            ville: c.ville ?? "", codePostal: c.codePostal,
            adresse: c.adresse ?? undefined,
            logo: c.logo ?? null,
            latitude: c.latitude ?? null, longitude: c.longitude ?? null,
            isQualiopi: c.formations?.some((f) => f.isQualiopi) ?? false,
            isBYS: (c.nom ?? "").toLowerCase().includes("bys"),
            nombreFormations: c._count?.formations ?? 0,
            specialites: [...new Set(c.formations?.map((f) => (f.titre ?? "Formation").split(" ").slice(0, 3).join(" ")) ?? [])].slice(0, 4),
            distance: c.distance ?? null,
            dept,
          };
        });
        setAllCentres(mapped);
        setPage(1);
      } catch { setAllCentres([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchVille, userLat, userLng, geoRayon]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedDept, onlyQualiopi, sortMode]);

  // ── Compute available departments ─────────────────────────

  const availableDepts = useMemo(() => {
    const depts = new Set(allCentres.map((c) => c.dept).filter(Boolean) as string[]);
    return Array.from(depts).sort();
  }, [allCentres]);

  // ── Filter + sort ─────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...allCentres];
    if (selectedDept) list = list.filter((c) => c.dept === selectedDept);
    if (onlyQualiopi) list = list.filter((c) => c.isQualiopi);
    list.sort((a, b) => {
      if (a.isBYS && !b.isBYS) return -1;
      if (!a.isBYS && b.isBYS) return 1;
      if (sortMode === "dist" && a.distance != null && b.distance != null) return a.distance - b.distance;
      if (sortMode === "formations") return b.nombreFormations - a.nombreFormations;
      return a.nom.localeCompare(b.nom, "fr");
    });
    return list;
  }, [allCentres, selectedDept, onlyQualiopi, sortMode]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Filters panel (shared) ────────────────────────────────

  function FiltersPanel({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className={mobile ? "" : "space-y-5"}>
        {/* Département */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Département</h4>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedDept(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === null ? "bg-brand-accent text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <span>Tous</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedDept === null ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {allCentres.length}
              </span>
            </button>
            {availableDepts.map((dept) => {
              const count = allCentres.filter((c) => c.dept === dept).length;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept === selectedDept ? null : dept)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === dept ? "bg-brand-accent text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <span>{DEPT_LABELS[dept] ?? `Dept ${dept}`}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedDept === dept ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Certification */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Certification</h4>
          <label className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={onlyQualiopi}
              onChange={(e) => setOnlyQualiopi(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-accent"
            />
            <span className="font-medium">Qualiopi uniquement</span>
          </label>
        </div>

        {/* Reset */}
        {(selectedDept || onlyQualiopi) && (
          <button
            onClick={() => { setSelectedDept(null); setOnlyQualiopi(false); }}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors px-3"
          >
            <FontAwesomeIcon icon={faXmark} />
            Réinitialiser les filtres
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />

      {/* Hero */}
      <section className="bg-[#0A1628] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl mb-3">
            Nos centres partenaires agréés
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Centres de formation agréés Ministère de l&apos;Intérieur pour les stages de récupération de points.
          </p>

          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Rechercher par ville ou département..."
              value={searchVille}
              onChange={(e) => { setSearchVille(e.target.value); clearGeo(); }}
              className="w-full px-4 py-3.5 pl-11 rounded-xl bg-white text-brand-text text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchVille && (
              <button onClick={() => { setSearchVille(""); clearGeo(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <div className="max-w-xl mx-auto mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              <FontAwesomeIcon icon={geoLoading ? faSpinner : faCrosshairs} className={geoLoading ? "animate-spin" : ""} />
              Me localiser
            </button>

            {userLat !== null && (
              <>
                {[10, 25, 50, 100].map((km) => (
                  <button
                    key={km}
                    onClick={() => setGeoRayon(km)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${geoRayon === km ? "bg-blue-600 text-white" : "bg-white/10 text-blue-200 hover:bg-white/20"}`}
                  >
                    {km} km
                  </button>
                ))}
                <button onClick={clearGeo} className="text-xs text-blue-400/60 hover:text-blue-300 transition-colors">
                  <FontAwesomeIcon icon={faXmark} className="mr-1" />Annuler
                </button>
              </>
            )}
            {geoError && <span className="text-xs text-red-400 w-full text-center">{geoError}</span>}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-brand-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { label: "Centres disponibles", icon: faBuilding, value: loading ? "…" : String(allCentres.length) },
              { label: "Couverture nationale", icon: faGlobe, value: "IDF" },
              { label: "Agréés préfecture", icon: faCheckCircle, value: "100%" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={s.icon} className="text-brand-accent text-base md:text-xl" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl md:text-2xl text-brand-text">{s.value}</p>
                  <p className="text-gray-500 text-xs md:text-sm hidden sm:block">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">

          {/* Sidebar filtres — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-4 bg-white rounded-xl border border-brand-border p-4 shadow-sm">
              <h3 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faSlidersH} className="text-brand-accent" />
                Filtres
              </h3>
              <FiltersPanel />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-gray-600 text-sm">
                  <span className="font-semibold text-brand-text">{loading ? "…" : filtered.length}</span> centre{filtered.length > 1 ? "s" : ""}
                  {selectedDept && <span className="text-brand-accent"> · {DEPT_LABELS[selectedDept] ?? selectedDept}</span>}
                  {onlyQualiopi && <span className="text-purple-600"> · Qualiopi</span>}
                </p>

                {/* Mobile filter toggle */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faSlidersH} className="text-brand-accent" />
                  Filtres
                  {(selectedDept || onlyQualiopi) && (
                    <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="text-sm border border-brand-border rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent"
                >
                  <option value="alpha">A → Z</option>
                  <option value="formations">Formations</option>
                  {userLat !== null && <option value="dist">Distance</option>}
                </select>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-brand-accent" : "text-gray-400 hover:text-gray-600"}`}
                    title="Vue grille"
                  >
                    <FontAwesomeIcon icon={faTableCells} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-brand-accent" : "text-gray-400 hover:text-gray-600"}`}
                    title="Vue liste"
                  >
                    <FontAwesomeIcon icon={faList} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile filters drawer */}
            {filtersOpen && (
              <div className="lg:hidden bg-white rounded-xl border border-brand-border p-4 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-brand-text">Filtres</h3>
                  <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                <FiltersPanel mobile />
              </div>
            )}

            {/* Grid or List */}
            <div className="relative min-h-[300px]">
              {loading ? (
                <div className={viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
                  : "flex flex-col gap-3 animate-pulse"}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`rounded-xl bg-gray-100 border border-brand-border ${viewMode === "grid" ? "h-52" : "h-20"}`} />
                  ))}
                </div>
              ) : paged.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paged.map((c) => <CentreCardGrid key={c.id} centre={c} />)}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {paged.map((c) => <CentreCardList key={c.id} centre={c} />)}
                  </div>
                )
              ) : (
                <div className="text-center py-20">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-4xl text-gray-300 mb-4" />
                  <h3 className="font-display font-semibold text-xl text-brand-text mb-2">Aucun centre trouvé</h3>
                  <p className="text-gray-500 text-sm">Essayez de modifier votre recherche ou vos filtres.</p>
                  {(selectedDept || onlyQualiopi) && (
                    <button
                      onClick={() => { setSelectedDept(null); setOnlyQualiopi(false); }}
                      className="mt-4 text-brand-accent text-sm font-medium hover:underline"
                    >
                      Supprimer les filtres
                    </button>
                  )}
                </div>
              )}
              <LoadingOverlay show={loading} label="Chargement des centres…" />
            </div>

            {/* Pagination */}
            {!loading && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            )}

            {/* Info pages */}
            {!loading && filtered.length > PAGE_SIZE && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Page {page} sur {totalPages} · {filtered.length} centres au total
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Carte */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faMapLocationDot} className="text-brand-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-brand-text">Trouvez un centre sur la carte</h3>
            <p className="text-gray-500 text-sm">
              {allCentres.filter((c) => c.latitude && c.longitude).length} centres géolocalisés
            </p>
          </div>
        </div>
        <CentresMapBoundary>
          {!loading && (
            <CentresMap
              centres={allCentres
                .filter((c) => c.latitude != null && c.longitude != null)
                .map((c) => ({
                  id: c.id, nom: c.nom, slug: c.slug, ville: c.ville,
                  adresse: c.adresse, latitude: c.latitude as number,
                  longitude: c.longitude as number, isBYS: c.isBYS,
                }))}
            />
          )}
        </CentresMapBoundary>
      </section>

      {/* CTA */}
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
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
            {[
              { icon: faChartLine, title: "Visibilité", desc: "Augmentez votre taux de remplissage" },
              { icon: faHandshake, title: "Simplicité", desc: "Gestion centralisée des réservations" },
              { icon: faCheckCircle, title: "Confiance", desc: "Label qualité BYS Formation" },
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
          <Link href="/devenir-partenaire" className="btn-primary px-8 py-3.5 rounded-lg text-lg inline-flex items-center gap-2">
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
