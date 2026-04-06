"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faChevronDown,
  faCheck,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface CentreItem {
  id: string;
  nom: string;
  ville: string;
  role: string;
  statut: string;
  profilCompletionPct: number;
  isActive: boolean;
}

const roleBadgeLabels: Record<string, { label: string; color: string }> = {
  CENTRE_OWNER: { label: "Propriétaire", color: "bg-blue-500/20 text-blue-400" },
  CENTRE_ADMIN: { label: "Admin", color: "bg-emerald-500/20 text-emerald-400" },
  CENTRE_FORMATEUR: { label: "Formateur", color: "bg-amber-500/20 text-amber-400" },
  CENTRE_SECRETAIRE: { label: "Secrétariat", color: "bg-purple-500/20 text-purple-400" },
};

export default function CentreSwitcher({ userRole }: { userRole: string | null }) {
  const router = useRouter();
  const [centres, setCentres] = useState<CentreItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCentre = centres.find((c) => c.isActive) ?? centres[0];

  useEffect(() => {
    fetch("/api/centre/list")
      .then((r) => r.json())
      .then((data) => {
        if (data.centres) {
          setCentres(data.centres);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function switchCentre(centreId: string) {
    if (centreId === activeCentre?.id) {
      setIsOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/centre/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centreId }),
      });
      if (res.ok) {
        setIsOpen(false);
        // Reload the page to refresh all centre-dependent data
        window.location.reload();
      }
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-3">
        <div className="h-12 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    );
  }

  // Single centre — no need for a switcher dropdown
  if (centres.length <= 1 && userRole !== "CENTRE_OWNER") {
    if (!activeCentre) return null;
    return (
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-xs" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{activeCentre.nom}</p>
            <p className="text-[11px] text-gray-500 truncate">{activeCentre.ville}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 py-3 relative" ref={dropdownRef}>
        {/* Trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/[0.08]"
          style={{ background: isOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)" }}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-xs" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-white truncate">
              {activeCentre?.nom ?? "Aucun centre"}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {activeCentre?.ville ?? ""}
            </p>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className="absolute left-3 right-3 top-full mt-1 rounded-xl border shadow-2xl z-50 overflow-hidden"
            style={{
              background: "#0F2445",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className="p-2 max-h-72 overflow-y-auto">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Vos centres
              </p>
              {centres.map((centre) => {
                const badge = roleBadgeLabels[centre.role] ?? { label: centre.role, color: "bg-gray-500/20 text-gray-400" };
                return (
                  <button
                    key={centre.id}
                    onClick={() => switchCentre(centre.id)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/[0.06] group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0 mt-0.5">
                      {centre.isActive ? (
                        <FontAwesomeIcon icon={faCheck} className="text-blue-400 text-xs" />
                      ) : (
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-500 text-xs group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${centre.isActive ? "text-white" : "text-gray-300"}`}>
                          {centre.nom}
                        </p>
                        {centre.isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{centre.ville}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.color}`}>
                          {badge.label}
                        </span>
                        {centre.profilCompletionPct < 100 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${centre.profilCompletionPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500">{centre.profilCompletionPct}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add centre button (CENTRE_OWNER only) */}
            {userRole === "CENTRE_OWNER" && (
              <div className="border-t p-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/[0.06] text-gray-400 hover:text-blue-400"
                >
                  <div className="w-8 h-8 rounded-lg border border-dashed flex items-center justify-center shrink-0" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  </div>
                  <span className="text-sm font-medium">Ajouter un centre</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Centre Modal */}
      {showCreateModal && (
        <CreateCentreModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}

// ─── Create Centre Modal ──────────────────────────────────────────

function CreateCentreModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    codePostal: "",
    ville: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/centre/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création");
        return;
      }

      // Success — redirect to onboarding for the new centre
      onClose();
      router.push("/espace-centre/onboarding");
      // Force reload to refresh all centre data
      window.location.href = "/espace-centre/onboarding";
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl"
        style={{ background: "#0F2445", borderColor: "rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-lg font-semibold text-white">Ajouter un centre</h2>
            <p className="text-xs text-gray-500 mt-0.5">Créez un nouveau centre de formation</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nom du centre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex : BYS Formation Lyon"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Adresse <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              placeholder="Ex : 15 Rue de la République"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Code postal <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.codePostal}
                onChange={(e) => setForm({ ...form, codePostal: e.target.value })}
                placeholder="69003"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Ville <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                placeholder="Lyon"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Création..." : "Créer le centre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
