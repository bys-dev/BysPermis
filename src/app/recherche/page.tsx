"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  isBYS?: boolean;
  slug: string;
}

const stageTypes = [
  "Tous les types",
  "Récupération de points",
  "Stage 48N",
  "Permis B accéléré",
  "FIMO/FCO",
  "Sécurité routière",
];

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

// ─── INNER COMPONENT (uses useSearchParams) ───────────────

function RechercheInner() {
  const searchParams = useSearchParams();
  const villeParam = searchParams.get("ville") ?? "";

  const [searchVille, setSearchVille] = useState(villeParam);
  const [selectedType, setSelectedType] = useState("Tous les types");
  const [qualiopiOnly, setQualiopiOnly] = useState(false);
  const [prixMax, setPrixMax] = useState(3000);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stages, setStages] = useState<StageCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  const perPage = 6;

  // Sync URL param → state quand l'URL change
  useEffect(() => {
    if (villeParam) setSearchVille(villeParam);
  }, [villeParam]);

  // Lire la ville détectée depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bys_city");
    if (saved) setDetectedCity(saved);
  }, []);

  // Fetch depuis l'API avec debounce sur la ville
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(currentPage), perPage: String(perPage) });
      if (searchVille) params.set("ville", searchVille);
      if (selectedType !== "Tous les types") params.set("type", selectedType);

      fetch(`/api/formations?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.formations) return;
          const mapped: StageCard[] = data.formations.map((f: {
            id: string; titre: string; slug: string; prix: number; isQualiopi: boolean;
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
              isBYS: f.centre.nom.toLowerCase().includes("bys"),
              slug: f.slug,
            };
          });
          // BYS toujours en premier
          mapped.sort((a, b) => (a.isBYS && !b.isBYS ? -1 : !a.isBYS && b.isBYS ? 1 : 0));
          setStages(mapped);
          setTotal(data.total ?? mapped.length);
          setTotalPages(data.totalPages ?? 1);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchVille, selectedType, currentPage]);

  // Client-side filters for prixMax and qualiopiOnly
  const filtered = stages.filter((s) => {
    if (qualiopiOnly && !s.isQualiopi) return false;
    if (s.prix > prixMax) return false;
    return true;
  });

  const resetFilters = () => {
    setSelectedType("Tous les types");
    setQualiopiOnly(false);
    setPrixMax(3000);
    setSearchVille("");
    setCurrentPage(1);
  };

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
            <div className="relative flex-1">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3.5 rounded-lg bg-white text-brand-text font-medium appearance-none cursor-pointer pr-10"
              >
                {stageTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                icon={faFilter}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
              />
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
            <button className="btn-primary px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Geoloc banner */}
      {detectedCity && !searchVille && (
        <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <FontAwesomeIcon icon={faLocationDot} className="text-blue-400" />
              Position détectée : <span className="font-semibold text-white">{detectedCity}</span>
              <span className="text-blue-400/60">— Afficher les stages à proximité ?</span>
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
          {(selectedType !== "Tous les types" || qualiopiOnly || prixMax < 3000) && (
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
                  className="text-sm text-brand-accent hover:underline"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Type de stage */}
              <div>
                <label className="label">Type de stage</label>
                <div className="space-y-2">
                  {stageTypes.map((type) => (
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

              {/* Prix max */}
              <div>
                <label className="label">
                  Prix maximum : <span className="text-brand-accent font-bold">{prixMax} &euro;</span>
                </label>
                <input
                  type="range"
                  min={100}
                  max={3000}
                  step={50}
                  value={prixMax}
                  onChange={(e) => {
                    setPrixMax(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full accent-brand-accent"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>100 &euro;</span>
                  <span>3 000 &euro;</span>
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="label">Ville / Département</label>
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
                  <span className="text-sm font-medium">Qualiopi uniquement</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {loading ? (
                  <span className="text-gray-400">Chargement…</span>
                ) : (
                  <>
                    <span className="font-semibold text-brand-text">{total}</span>{" "}
                    stage{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>

            {/* Cards grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((stage) => (
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
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-semibold text-brand-text mb-1 leading-snug">
                        {stage.titre}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{stage.centre}</p>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faLocationDot}
                            className="w-4 text-gray-400"
                          />
                          {stage.ville} ({stage.departement})
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faCalendarDays}
                            className="w-4 text-gray-400"
                          />
                          {stage.dateProchaine}
                        </div>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faUsers}
                            className="w-4 text-gray-400"
                          />
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
              <div className="text-center py-20">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-4xl text-gray-300 mb-4"
                />
                <h3 className="font-display font-semibold text-xl text-brand-text mb-2">
                  Aucun stage trouvé
                </h3>
                <p className="text-gray-500 mb-6">
                  Essayez de modifier vos critères de recherche.
                </p>
                <button onClick={resetFilters} className="btn-secondary text-sm px-6 py-2.5 rounded-lg">
                  Réinitialiser les filtres
                </button>
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
        <div className="text-gray-400">Chargement…</div>
      </div>
    }>
      <RechercheInner />
    </Suspense>
  );
}
