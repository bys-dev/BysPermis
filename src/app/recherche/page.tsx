"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationDot,
  faFilter,
  faCalendarDays,
  faUsers,
  faAward,
  faShieldHalved,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faStar,
  faSliders,
  faBolt,
  faArrowRight,
  faLaptop,
  faCircleNodes,
  faSort,
  faCoins,
  faArrowRotateLeft,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { formatPrice } from "@/lib/utils";
import {
  GEO_UPDATED_EVENT,
  readGeoFromStorage,
  type GeoLocationDetail,
} from "@/lib/geo-client";

// ─── TYPES ────────────────────────────────────────────────

interface StageCard {
  id: string;
  sessionId: string | null;
  titre: string;
  type: string;
  centre: string;
  ville: string;
  departement: string;
  dateProchaine: string;
  prix: number;
  placesRestantes: number;
  isQualiopi: boolean;
  isCPF: boolean;
  modalite: string;
  duree: string;
  isBYS?: boolean;
  slug: string;
  distance?: number | null;
}

interface Suggestion {
  formations: { id: string; titre: string; slug: string; prix: number }[];
  villes: string[];
}

interface CategorieOption {
  id: string;
  nom: string;
}

// ─── DÉPARTEMENT MAP ──────────────────────────────────────
const cityToDept: Record<string, string> = {
  paris: "75", lyon: "69", marseille: "13", toulouse: "31", nice: "06",
  nantes: "44", bordeaux: "33", lille: "59", strasbourg: "67", montpellier: "34",
  rennes: "35", cergy: "95", osny: "95", pontoise: "95", argenteuil: "95",
  versailles: "78", nanterre: "92", "saint-denis": "93", creteil: "94",
};

function getDeptFromCity(city: string): string | null {
  const key = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return cityToDept[key] ?? null;
}

const rayonOptions = [
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
];

const sortOptions = [
  { value: "pertinence", label: "Pertinence" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
  { value: "date", label: "Date" },
];

// ─── INNER COMPONENT (uses useSearchParams) ───────────────

function RechercheInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL
  const initialQ = searchParams.get("q") ?? "";
  const initialVille = searchParams.get("ville") ?? "";
  const initialDept = searchParams.get("dept") ?? "";
  const initialType = searchParams.get("type") ?? "Tous les types";
  const initialPrixMin = Number(searchParams.get("prixMin") ?? 0);
  const initialPrixMax = Number(searchParams.get("prixMax") ?? 5000);
  const initialTri = searchParams.get("tri") ?? "pertinence";
  const initialRayon = Number(searchParams.get("rayon") ?? 25) || 25;
  const initialLat = searchParams.get("lat") ?? "";
  const initialLng = searchParams.get("lng") ?? "";
  const initialPage = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  // Draft (UI inputs)
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [searchVille, setSearchVille] = useState(initialVille);
  const [searchDept, setSearchDept] = useState(initialDept);
  const [selectedType, setSelectedType] = useState(initialType);
  const [prixMin, setPrixMin] = useState(initialPrixMin);
  const [prixMax, setPrixMax] = useState(initialPrixMax);
  const [tri, setTri] = useState(initialTri);
  const [rayon, setRayon] = useState(initialRayon);
  const [geoLat, setGeoLat] = useState(initialLat);
  const [geoLng, setGeoLng] = useState(initialLng);

  // Applied (actual query)
  const [applied, setApplied] = useState(() => ({
    q: initialQ,
    ville: initialVille,
    dept: initialDept,
    type: initialType,
    prixMin: initialPrixMin,
    prixMax: initialPrixMax,
    tri: initialTri,
    rayon: initialRayon,
    lat: initialLat,
    lng: initialLng,
  }));

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stages, setStages] = useState<StageCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detectedDept, setDetectedDept] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion>({ formations: [], villes: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Categories
  const [categories, setCategories] = useState<CategorieOption[]>([]);

  const perPage = 25;
  const skipDebounceRef = useRef(false);

  const applyGeoToFilters = useCallback((geo: GeoLocationDetail) => {
    skipDebounceRef.current = true;
    const r = geo.rayon ?? 25;
    setSearchVille(geo.city);
    setSearchDept(geo.dept ?? "");
    setGeoLat(String(geo.lat));
    setGeoLng(String(geo.lng));
    setRayon(r);
    setDetectedCity(geo.city);
    if (geo.dept) setDetectedDept(geo.dept);
    setApplied((prev) => ({
      ...prev,
      ville: geo.city,
      dept: geo.dept ?? "",
      rayon: r,
      lat: String(geo.lat),
      lng: String(geo.lng),
    }));
    setCurrentPage(1);
  }, []);

  // Sync depuis l'URL (ex. clic « Ma position » dans le header)
  useEffect(() => {
    const lat = searchParams.get("lat") ?? "";
    const lng = searchParams.get("lng") ?? "";
    const ville = searchParams.get("ville") ?? "";
    const dept = searchParams.get("dept") ?? "";
    const rayonParam = Number(searchParams.get("rayon") ?? 25) || 25;

    setSearchQuery(searchParams.get("q") ?? "");
    setSelectedType(searchParams.get("type") ?? "Tous les types");
    setPrixMin(Number(searchParams.get("prixMin") ?? 0));
    setPrixMax(Number(searchParams.get("prixMax") ?? 5000));
    setTri(searchParams.get("tri") ?? "pertinence");
    setCurrentPage(Math.max(1, Number(searchParams.get("page") ?? 1) || 1));

    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        skipDebounceRef.current = true;
        const city = ville || readGeoFromStorage()?.city || "";
        setSearchVille(city);
        setSearchDept(dept);
        setGeoLat(lat);
        setGeoLng(lng);
        setRayon(rayonParam);
        setApplied({
          q: searchParams.get("q") ?? "",
          ville: city,
          dept,
          type: searchParams.get("type") ?? "Tous les types",
          prixMin: Number(searchParams.get("prixMin") ?? 0),
          prixMax: Number(searchParams.get("prixMax") ?? 5000),
          tri: searchParams.get("tri") ?? "pertinence",
          rayon: rayonParam,
          lat,
          lng,
        });
        return;
      }
    }

    setSearchVille(ville);
    setSearchDept(dept);
    setGeoLat("");
    setGeoLng("");
    setRayon(rayonParam);
    setApplied({
      q: searchParams.get("q") ?? "",
      ville,
      dept,
      type: searchParams.get("type") ?? "Tous les types",
      prixMin: Number(searchParams.get("prixMin") ?? 0),
      prixMax: Number(searchParams.get("prixMax") ?? 5000),
      tri: searchParams.get("tri") ?? "pertinence",
      rayon: rayonParam,
      lat: "",
      lng: "",
    });
  }, [searchParams]);

  // Écoute le clic « Ma position » (même page /recherche déjà ouverte)
  useEffect(() => {
    function onGeoUpdated(e: Event) {
      const detail = (e as CustomEvent<GeoLocationDetail>).detail;
      if (!detail) return;
      applyGeoToFilters(detail);
    }
    window.addEventListener(GEO_UPDATED_EVENT, onGeoUpdated);
    return () => window.removeEventListener(GEO_UPDATED_EVENT, onGeoUpdated);
  }, [applyGeoToFilters]);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Lire la ville détectée depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bys_city");
    if (saved) setDetectedCity(saved);
    const savedDept = localStorage.getItem("bys_dept");
    if (savedDept) setDetectedDept(savedDept);
  }, []);

  // Auto-apply geo depuis localStorage si pas déjà de lat/lng dans l'URL
  useEffect(() => {
    const hasUrlGeo = searchParams.get("lat") && searchParams.get("lng");
    if (hasUrlGeo) return;
    const geo = readGeoFromStorage();
    if (geo?.lat && geo?.lng) {
      applyGeoToFilters(geo);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync URL params whenever applied query/page changes
  const updateURL = useCallback(
    (overrides?: Record<string, string>) => {
      const params = new URLSearchParams();
      const vals: Record<string, string> = {
        q: applied.q,
        ville: applied.ville,
        dept: applied.dept,
        type: applied.type,
        prixMin: applied.prixMin > 0 ? String(applied.prixMin) : "",
        prixMax: applied.prixMax < 5000 ? String(applied.prixMax) : "",
        tri: applied.tri,
        rayon: applied.lat && applied.lng ? String(applied.rayon) : applied.ville.trim() ? String(applied.rayon) : "",
        lat: applied.lat,
        lng: applied.lng,
        page: String(currentPage),
        ...overrides,
      };
      for (const [k, v] of Object.entries(vals)) {
        if (!v || v === "Tous les types" || v === "pertinence" || v === "1") continue;
        const geoActive = Boolean(vals.lat && vals.lng);
        if (k === "rayon" && v === "25" && !geoActive && !vals.ville.trim()) continue;
        params.set(k, v);
      }
      // Keep page if > 1
      if (currentPage > 1 && !overrides?.page) params.set("page", String(currentPage));
      router.replace(`/recherche?${params.toString()}`, { scroll: false });
    },
    [applied, currentPage, router],
  );

  function applyFilters() {
    skipDebounceRef.current = true;
    setApplied({
      q: searchQuery,
      ville: searchVille,
      dept: searchDept,
      type: selectedType,
      prixMin,
      prixMax,
      tri,
      rayon,
      lat: geoLat,
      lng: geoLng,
    });
    setCurrentPage(1);
  }

  // Appliquer automatiquement les filtres après modification (debounce)
  const filtersFirstRender = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (skipDebounceRef.current) {
        skipDebounceRef.current = false;
        return;
      }
      if (!filtersFirstRender.current) {
        setCurrentPage(1);
      }
      filtersFirstRender.current = false;
      setApplied({
        q: searchQuery,
        ville: searchVille,
        dept: searchDept,
        type: selectedType,
        prixMin,
        prixMax,
        tri,
        rayon,
        lat: geoLat,
        lng: geoLng,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchVille, searchDept, selectedType, prixMin, prixMax, tri, rayon, geoLat, geoLng]);

  // Fetch formations from API (applied query only) + AbortController
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(currentPage), perPage: String(perPage) });

      if (applied.q.trim()) params.set("q", applied.q.trim());
      if (applied.lat.trim() && applied.lng.trim()) {
        params.set("lat", applied.lat.trim());
        params.set("lng", applied.lng.trim());
        params.set("rayon", String(applied.rayon));
      } else if (applied.ville.trim()) {
        params.set("ville", applied.ville.trim());
        params.set("rayon", String(applied.rayon));
      }
      if (applied.dept.trim()) params.set("dept", applied.dept.trim());
      if (applied.type !== "Tous les types") params.set("type", applied.type);
      if (applied.prixMin > 0) params.set("prixMin", String(applied.prixMin));
      if (applied.prixMax < 5000) params.set("prixMax", String(applied.prixMax));
      if (applied.tri && applied.tri !== "pertinence") params.set("tri", applied.tri);

      fetch(`/api/formations?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          if (!data.formations) return;
          const mapped: StageCard[] = data.formations.map((f: {
            id: string; titre: string; slug: string; prix: number; isQualiopi: boolean; isCPF: boolean;
            modalite: string; duree: string;
            categorie?: { nom: string } | null;
            centre: { nom: string; ville: string };
            sessions: { id: string; dateDebut: string; dateFin: string; placesRestantes: number }[];
            distance?: number | null;
          }) => {
            const firstSession = f.sessions[0] ?? null;
            const ville = f.centre.ville ?? "";
            const dept = getDeptFromCity(ville) ?? "";
            const dateStr = firstSession
              ? new Date(firstSession.dateDebut).toLocaleDateString("fr-FR") +
                " — " +
                new Date(firstSession.dateFin).toLocaleDateString("fr-FR")
              : "Date à venir";
            return {
              id: f.id,
              sessionId: firstSession?.id ?? null,
              titre: f.titre,
              type: f.categorie?.nom ?? "Stage",
              centre: f.centre.nom,
              ville,
              departement: dept,
              dateProchaine: dateStr,
              prix: f.prix,
              placesRestantes: firstSession?.placesRestantes ?? 0,
              isQualiopi: f.isQualiopi,
              isCPF: f.isCPF ?? false,
              modalite: f.modalite ?? "PRESENTIEL",
              duree: f.duree ?? "",
              isBYS: f.centre.nom.toLowerCase().includes("bys"),
              slug: f.slug,
              distance: f.distance ?? null,
            };
          });
          // BYS toujours en premier (only for "pertinence" sort)
          if (applied.tri === "pertinence" || !applied.tri) {
            mapped.sort((a, b) => (a.isBYS && !b.isBYS ? -1 : !a.isBYS && b.isBYS ? 1 : 0));
          }
          setStages(mapped);
          setTotal(data.total ?? mapped.length);
          setTotalPages(data.totalPages ?? 1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      // Update URL silently
      updateURL();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, currentPage, updateURL]);

  // Auto-suggestions for search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions({ formations: [], villes: [] });
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/formations/suggestions?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          setSuggestions({
            formations: data.formations ?? [],
            villes: data.villes ?? [],
          });
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasActiveFilters =
    applied.type !== "Tous les types" ||
    applied.prixMin > 0 ||
    applied.prixMax < 5000 ||
    applied.q.trim() !== "" ||
    applied.ville.trim() !== "" ||
    Boolean(applied.lat && applied.lng) ||
    (applied.ville.trim() !== "" && applied.rayon !== 25);

  const hasGeoFilter = Boolean(applied.lat && applied.lng);
  const locationLabel = hasGeoFilter
    ? applied.ville.trim() || "Ma position"
    : applied.ville.trim();

  const resetFilters = () => {
    setSelectedType("Tous les types");
    setPrixMin(0);
    setPrixMax(5000);
    setSearchQuery("");
    setSearchVille("");
    setGeoLat("");
    setGeoLng("");
    setRayon(25);
    setTri("pertinence");
    setCurrentPage(1);
    setApplied({
      q: "",
      ville: "",
      dept: "",
      type: "Tous les types",
      prixMin: 0,
      prixMax: 5000,
      tri: "pertinence",
      rayon: 25,
      lat: "",
      lng: "",
    });
  };

  // All stage types: combine static + dynamic from API categories
  const allTypes = ["Tous les types", ...categories.map((c) => c.nom)];

  // Popular formations for "no results" state
  const popularSearches = ["Stage 48N", "Stage 48SI", "Stage volontaire", "Stage Paris", "Stage Lyon", "Stage Marseille"];

  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />

      {/* Hero */}
      <section className="bg-navy-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
            Trouvez votre stage près de chez vous
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Comparez les prix, consultez les avis et réservez votre stage en quelques clics.
            Tous nos centres sont agréés par la Préfecture.
          </p>

          {/* Search bar */}
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1" ref={suggestionsRef}>
              <input
                type="text"
                placeholder="Rechercher un stage, un centre..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.formations.length > 0 || suggestions.villes.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full px-4 py-3.5 pl-10 rounded-lg bg-white text-brand-text"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && (suggestions.formations.length > 0 || suggestions.villes.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  {suggestions.formations.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                        Formations
                      </div>
                      {suggestions.formations.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setSearchQuery(f.titre);
                            setShowSuggestions(false);
                            setCurrentPage(1);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="text-sm text-brand-text truncate">{f.titre}</span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatPrice(f.prix)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.villes.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                        Villes
                      </div>
                      {suggestions.villes.map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setSearchVille(v);
                            setGeoLat("");
                            setGeoLng("");
                            setShowSuggestions(false);
                            setCurrentPage(1);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 text-xs" />
                          <span className="text-sm text-brand-text">{v}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ville ou code postal..."
                value={searchVille}
                onChange={(e) => {
                  setSearchVille(e.target.value);
                  setGeoLat("");
                  setGeoLng("");
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3.5 pl-10 rounded-lg bg-white text-brand-text"
              />
              <FontAwesomeIcon
                icon={faLocationDot}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              />
            </div>
            <button
              onClick={applyFilters}
              className="btn-primary px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Geoloc banner */}
      {detectedCity && !searchVille && !geoLat && (
        <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300 flex-wrap">
              <FontAwesomeIcon icon={faLocationDot} className="text-blue-400 shrink-0" />
              <span>
                Position détectée :{" "}
                <span className="font-semibold text-white">
                  {detectedCity}
                  {detectedDept ? ` (${detectedDept})` : ""}
                </span>
              </span>
              <span className="text-blue-400/60 hidden sm:inline">— Afficher les stages à proximité ?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const geo = readGeoFromStorage();
                  if (geo) {
                    applyGeoToFilters(geo);
                    return;
                  }
                  setSearchVille(detectedCity ?? "");
                  if (detectedDept) setSearchDept(detectedDept);
                  applyFilters();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
                Oui, filtrer
              </button>
              <button
                onClick={() => setDetectedCity(null)}
                className="p-1.5 text-blue-400/60 hover:text-blue-300 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="lg:hidden mb-6 flex items-center gap-2 px-4 py-2.5 border border-brand-border rounded-lg bg-white font-medium text-brand-text"
        >
          <FontAwesomeIcon icon={faSliders} />
          Filtres
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-accent" />
          )}
        </button>

        <div className="flex gap-8">
          {/* Filters sidebar */}
          <aside
            className={`${
              mobileFiltersOpen ? "fixed inset-0 z-50 bg-white p-4 sm:p-6 overflow-y-auto overflow-x-hidden" : "hidden"
            } lg:block lg:static lg:bg-transparent lg:p-0 w-full lg:w-72 shrink-0 min-w-0`}
          >
            {/* Mobile close */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="font-display font-bold text-xl">Filtres</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>

            <div className="bg-white border border-brand-border rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Filtres</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-brand-accent hover:underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faArrowRotateLeft} className="text-xs" />
                  Réinitialiser
                </button>
              </div>

              {/* Type de stage / Catégorie */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFilter} className="text-xs text-gray-400" />
                  Type de stage
                </label>
                <div className="space-y-2">
                  {allTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="radio"
                        name="type"
                        checked={selectedType === type}
                        onChange={() => {
                          setSelectedType(type);
                          setCurrentPage(1);
                        }}
                        className="accent-brand-accent"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* Prix range */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCoins} className="text-xs text-gray-400" />
                  Fourchette de prix
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Min : <span className="text-brand-accent font-bold">{prixMin} &euro;</span></span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={prixMin}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPrixMin(Math.min(val, prixMax));
                        setCurrentPage(1);
                      }}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Max : <span className="text-brand-accent font-bold">{prixMax} &euro;</span></span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={prixMax}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPrixMax(Math.max(val, prixMin));
                        setCurrentPage(1);
                      }}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0 &euro;</span>
                    <span>5 000 &euro;</span>
                  </div>
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLocationDot} className="text-xs text-gray-400" />
                  Ville / Département
                  {geoLat && geoLng && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      GPS
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="ex: Paris, 75..."
                  value={searchVille}
                  onChange={(e) => {
                    setSearchVille(e.target.value);
                    setGeoLat("");
                    setGeoLng("");
                    setCurrentPage(1);
                  }}
                  className="input"
                />
              </div>

              {/* Rayon autour de la ville */}
              {(searchVille.trim() || (geoLat && geoLng)) && (
                <div>
                  <label className="label flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationDot} className="text-xs text-gray-400" />
                    Rayon de recherche
                  </label>
                  <select
                    value={rayon}
                    onChange={(e) => {
                      setRayon(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="input text-sm"
                  >
                    {rayonOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {geoLat && geoLng
                      ? `Stages dans un rayon de ${rayon} km autour de votre position.`
                      : `Stages dans un rayon de ${rayon} km autour de ${searchVille}.`}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  applyFilters();
                  setMobileFiltersOpen(false);
                }}
                className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                Actualiser la recherche
              </button>

            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results count + sort */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <p className="text-gray-600">
                {loading ? (
                  <span className="text-gray-400">Chargement...</span>
                ) : (
                  <>
                    <span className="font-semibold text-brand-text">{total}</span>{" "}
                    stage{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
                    {searchQuery && (
                      <span className="text-gray-400 ml-1">
                        pour &laquo; {searchQuery} &raquo;
                      </span>
                    )}
                    {applied.ville.trim() && (
                      <span className="text-gray-400 ml-1">
                        {applied.lat && applied.lng ? (
                          <>
                            autour de votre position
                            {applied.ville ? ` (${applied.ville})` : ""} ({applied.rayon} km)
                          </>
                        ) : (
                          <>
                            autour de <span className="font-medium text-brand-text">{applied.ville}</span> ({applied.rayon} km)
                          </>
                        )}
                      </span>
                    )}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSort} className="text-gray-400 text-sm" />
                <select
                  value={tri}
                  onChange={(e) => {
                    setTri(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-sm border border-brand-border rounded-lg px-3 py-2 bg-white text-brand-text cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filters pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6 pb-1 -mx-1 px-1 min-w-0">
                {applied.q && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    &laquo; {applied.q} &raquo;
                    <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {(applied.ville.trim() || hasGeoFilter) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                    {hasGeoFilter ? `Ma position · ${locationLabel}` : locationLabel} ({applied.rayon} km)
                    <button
                      onClick={() => {
                        skipDebounceRef.current = true;
                        setSearchVille("");
                        setGeoLat("");
                        setGeoLng("");
                        setRayon(25);
                        setCurrentPage(1);
                        setApplied((prev) => ({
                          ...prev,
                          ville: "",
                          lat: "",
                          lng: "",
                          rayon: 25,
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {applied.type !== "Tous les types" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    {applied.type}
                    <button onClick={() => { setSelectedType("Tous les types"); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {(applied.prixMin > 0 || applied.prixMax < 5000) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    {applied.prixMin}&euro; — {applied.prixMax}&euro;
                    <button onClick={() => { setPrixMin(0); setPrixMax(5000); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Cards grid */}
            <div className="relative min-h-[300px]">
              <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-xl bg-gray-100 border border-brand-border" />
                ))}
              </div>
            ) : stages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className={`card p-0 overflow-hidden flex flex-col ${stage.isBYS ? "ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/10" : ""}`}
                  >
                    {/* BYS header banner */}
                    {stage.isBYS ? (
                      <div className="px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0f2044 100%)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">BYS</span>
                          </div>
                          <span className="text-white text-xs font-bold">BYS Formation</span>
                        </div>
                        <span className="text-[10px] text-blue-300 font-medium flex items-center gap-1">
                          <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[9px]" />
                          Partenaire officiel
                        </span>
                      </div>
                    ) : (
                      <div className="h-1 bg-linear-to-r from-blue-600 via-white to-red-500 opacity-30" />
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${stage.isBYS ? "bg-blue-600/10 text-blue-600 border-blue-500/20" : "badge badge-success"}`}>
                          <FontAwesomeIcon icon={faShieldHalved} className="mr-1 text-[9px]" />
                          Agréé Préfecture
                        </span>
                        {stage.isQualiopi && (
                          <span className="badge badge-qualiopi text-[11px]">
                            <FontAwesomeIcon icon={faAward} className="mr-1" />
                            Qualiopi
                          </span>
                        )}
                        {stage.isCPF && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border bg-green-50 text-green-700 border-green-200">
                            <FontAwesomeIcon icon={faCoins} className="mr-1 text-[9px]" />
                            CPF
                          </span>
                        )}
                        {stage.modalite && stage.modalite !== "PRESENTIEL" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-purple-50 text-purple-700 border-purple-200">
                            <FontAwesomeIcon
                              icon={stage.modalite === "DISTANCIEL" ? faLaptop : faCircleNodes}
                              className="mr-1 text-[9px]"
                            />
                            {stage.modalite === "DISTANCIEL" ? "Distanciel" : "Hybride"}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-semibold text-brand-text mb-1 leading-snug">
                        {stage.titre}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{stage.centre}</p>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faLocationDot} className="w-4 text-gray-400" />
                          {stage.ville}{stage.departement ? ` (${stage.departement})` : ""}
                          {stage.distance != null && (
                            <span className="text-blue-600 font-medium">· {stage.distance} km</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarDays} className="w-4 text-gray-400" />
                          {stage.dateProchaine}
                        </div>
                        {stage.duree && (
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="w-4 text-gray-400" />
                            {stage.duree}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUsers} className="w-4 text-gray-400" />
                          <span
                            className={
                              stage.placesRestantes <= 3
                                ? "text-red-600 font-semibold"
                                : ""
                            }
                          >
                            {stage.placesRestantes} place
                            {stage.placesRestantes > 1 ? "s" : ""} restante
                            {stage.placesRestantes > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Price + CTA */}
                      <div className="mt-auto flex items-end justify-between pt-4 border-t border-brand-border">
                        <div>
                          <span className="text-2xl font-bold text-brand-text">
                            {formatPrice(stage.prix)}
                          </span>
                          <span className="text-sm text-gray-400 ml-1">/ pers.</span>
                        </div>
                        <Link
                          href={stage.sessionId ? `/reserver/${stage.sessionId}/donnees` : `/formations/${stage.slug}`}
                          className={`text-sm px-5 py-2.5 rounded-lg inline-flex items-center gap-1.5 font-semibold transition-all ${
                            stage.isBYS
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          Réserver
                          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* No results state */
              <div className="text-center py-20">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-4xl text-gray-300 mb-4"
                />
                <h3 className="font-display font-semibold text-xl text-brand-text mb-2">
                  Aucun résultat pour votre recherche
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Essayez avec moins de filtres ou modifiez vos critères de recherche.
                </p>
                <div className="flex flex-col items-center gap-4">
                  <button onClick={resetFilters} className="btn-secondary text-sm px-6 py-2.5 rounded-lg">
                    <FontAwesomeIcon icon={faArrowRotateLeft} className="mr-2" />
                    Réinitialiser les filtres
                  </button>
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-3">Recherches populaires :</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            resetFilters();
                            setSearchQuery(term);
                            setCurrentPage(1);
                          }}
                          className="px-4 py-2 text-sm bg-white border border-brand-border rounded-full hover:border-brand-accent hover:text-brand-accent transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

              </div>
              <LoadingOverlay show={loading} label="Chargement des résultats..." />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-lg border border-brand-border flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                      currentPage === page
                        ? "bg-brand-accent text-white"
                        : "border border-brand-border hover:bg-gray-100 text-brand-text"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-lg border border-brand-border flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ─── EXPORT avec Suspense (requis pour useSearchParams) ───

export default function RecherchePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    }>
      <RechercheInner />
    </Suspense>
  );
}
