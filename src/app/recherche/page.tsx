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
  faBuilding,
  faCircleNodes,
  faSort,
  faCoins,
  faArrowRotateLeft,
  faClock,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";

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

const sortOptions = [
  { value: "pertinence", label: "Pertinence" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
  { value: "date", label: "Date" },
];

const modaliteOptions = [
  { value: "PRESENTIEL", label: "Présentiel", icon: faBuilding },
  { value: "DISTANCIEL", label: "Distanciel", icon: faLaptop },
  { value: "HYBRIDE", label: "Hybride", icon: faCircleNodes },
];

// ─── INNER COMPONENT (uses useSearchParams) ───────────────

function RechercheInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL
  const initialQ = searchParams.get("q") ?? "";
  const initialVille = searchParams.get("ville") ?? "";
  const initialType = searchParams.get("type") ?? "Tous les types";
  const initialModalite = searchParams.get("modalite") ?? "";
  const initialQualiopi = searchParams.get("isQualiopi") === "true";
  const initialCPF = searchParams.get("isCPF") === "true";
  const initialPrixMin = Number(searchParams.get("prixMin") ?? 0);
  const initialPrixMax = Number(searchParams.get("prixMax") ?? 5000);
  const initialTri = searchParams.get("tri") ?? "pertinence";

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [searchVille, setSearchVille] = useState(initialVille);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedModalite, setSelectedModalite] = useState(initialModalite);
  const [qualiopiOnly, setQualiopiOnly] = useState(initialQualiopi);
  const [cpfOnly, setCpfOnly] = useState(initialCPF);
  const [prixMin, setPrixMin] = useState(initialPrixMin);
  const [prixMax, setPrixMax] = useState(initialPrixMax);
  const [tri, setTri] = useState(initialTri);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stages, setStages] = useState<StageCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion>({ formations: [], villes: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Categories
  const [categories, setCategories] = useState<CategorieOption[]>([]);

  const perPage = 6;

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

  // Sync URL params whenever filters change
  const updateURL = useCallback(
    (overrides?: Record<string, string>) => {
      const params = new URLSearchParams();
      const vals: Record<string, string> = {
        q: searchQuery,
        ville: searchVille,
        type: selectedType,
        modalite: selectedModalite,
        isQualiopi: qualiopiOnly ? "true" : "",
        isCPF: cpfOnly ? "true" : "",
        prixMin: prixMin > 0 ? String(prixMin) : "",
        prixMax: prixMax < 5000 ? String(prixMax) : "",
        tri,
        page: String(currentPage),
        ...overrides,
      };
      for (const [k, v] of Object.entries(vals)) {
        if (v && v !== "Tous les types" && v !== "pertinence" && v !== "1") {
          params.set(k, v);
        }
      }
      // Keep page if > 1
      if (currentPage > 1 && !overrides?.page) params.set("page", String(currentPage));
      router.replace(`/recherche?${params.toString()}`, { scroll: false });
    },
    [searchQuery, searchVille, selectedType, selectedModalite, qualiopiOnly, cpfOnly, prixMin, prixMax, tri, currentPage, router],
  );

  // Fetch formations from API with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(currentPage), perPage: String(perPage) });

      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (searchVille.trim()) params.set("ville", searchVille.trim());
      if (selectedType !== "Tous les types") params.set("type", selectedType);
      if (selectedModalite) params.set("modalite", selectedModalite);
      if (qualiopiOnly) params.set("isQualiopi", "true");
      if (cpfOnly) params.set("isCPF", "true");
      if (prixMin > 0) params.set("prixMin", String(prixMin));
      if (prixMax < 5000) params.set("prixMax", String(prixMax));
      if (tri && tri !== "pertinence") params.set("tri", tri);

      fetch(`/api/formations?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.formations) return;
          const mapped: StageCard[] = data.formations.map((f: {
            id: string; titre: string; slug: string; prix: number; isQualiopi: boolean; isCPF: boolean;
            modalite: string; duree: string;
            categorie?: { nom: string } | null;
            centre: { nom: string; ville: string };
            sessions: { id: string; dateDebut: string; dateFin: string; placesRestantes: number }[];
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
            };
          });
          // BYS toujours en premier (only for "pertinence" sort)
          if (tri === "pertinence" || !tri) {
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
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchVille, selectedType, selectedModalite, qualiopiOnly, cpfOnly, prixMin, prixMax, tri, currentPage]);

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
    selectedType !== "Tous les types" ||
    selectedModalite !== "" ||
    qualiopiOnly ||
    cpfOnly ||
    prixMin > 0 ||
    prixMax < 5000 ||
    searchQuery.trim() !== "" ||
    searchVille.trim() !== "";

  const resetFilters = () => {
    setSelectedType("Tous les types");
    setSelectedModalite("");
    setQualiopiOnly(false);
    setCpfOnly(false);
    setPrixMin(0);
    setPrixMax(5000);
    setSearchQuery("");
    setSearchVille("");
    setTri("pertinence");
    setCurrentPage(1);
  };

  // All stage types: combine static + dynamic from API categories
  const allTypes = ["Tous les types", ...categories.map((c) => c.nom)];

  // Popular formations for "no results" state
  const popularSearches = ["Récupération de points", "Stage 48N", "FIMO", "Permis B"];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      {/* Hero */}
      <section className="bg-[#0A1628] text-white py-16 px-4">
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
                          <span className="text-xs text-gray-400 whitespace-nowrap">{f.prix} &euro;</span>
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
              onClick={() => setCurrentPage(1)}
              className="btn-primary px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Geoloc banner */}
      {detectedCity && !searchVille && (
        <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300 flex-wrap">
              <FontAwesomeIcon icon={faLocationDot} className="text-blue-400 shrink-0" />
              <span>Position detectee : <span className="font-semibold text-white">{detectedCity}</span></span>
              <span className="text-blue-400/60 hidden sm:inline">— Afficher les stages a proximite ?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setSearchVille(detectedCity); setCurrentPage(1); }}
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
              mobileFiltersOpen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : "hidden"
            } lg:block lg:static lg:bg-transparent lg:p-0 w-full lg:w-72 shrink-0`}
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
                </label>
                <input
                  type="text"
                  placeholder="ex: Paris, 75..."
                  value={searchVille}
                  onChange={(e) => {
                    setSearchVille(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input"
                />
              </div>

              {/* Modalité */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-xs text-gray-400" />
                  Modalité
                </label>
                <div className="space-y-2">
                  {modaliteOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModalite === opt.value}
                        onChange={(e) => {
                          setSelectedModalite(e.target.checked ? opt.value : "");
                          setCurrentPage(1);
                        }}
                        className="accent-brand-accent"
                      />
                      <FontAwesomeIcon icon={opt.icon} className="text-xs text-gray-400 w-4" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Qualiopi toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={qualiopiOnly}
                      onChange={(e) => {
                        setQualiopiOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-brand-accent rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </div>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faAward} className="text-xs text-gray-400" />
                    Qualiopi uniquement
                  </span>
                </label>
              </div>

              {/* CPF toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={cpfOnly}
                      onChange={(e) => {
                        setCpfOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-brand-accent rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </div>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCoins} className="text-xs text-gray-400" />
                    Éligible CPF
                  </span>
                </label>
              </div>
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
              <div className="flex flex-wrap sm:flex-wrap gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    &laquo; {searchQuery} &raquo;
                    <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {searchVille && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                    {searchVille}
                    <button onClick={() => { setSearchVille(""); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {selectedType !== "Tous les types" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    {selectedType}
                    <button onClick={() => { setSelectedType("Tous les types"); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {selectedModalite && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    {modaliteOptions.find((o) => o.value === selectedModalite)?.label}
                    <button onClick={() => { setSelectedModalite(""); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {qualiopiOnly && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    Qualiopi
                    <button onClick={() => { setQualiopiOnly(false); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {cpfOnly && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    CPF
                    <button onClick={() => { setCpfOnly(false); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {(prixMin > 0 || prixMax < 5000) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    {prixMin}&euro; — {prixMax}&euro;
                    <button onClick={() => { setPrixMin(0); setPrixMax(5000); setCurrentPage(1); }} className="hover:text-blue-900">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Cards grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
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
                      <div className="h-1 bg-gradient-to-r from-blue-600 via-white to-red-500 opacity-30" />
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
                            {stage.prix} &euro;
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
