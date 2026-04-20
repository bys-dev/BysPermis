"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faBuilding, faCheckCircle, faCircleXmark,
  faClock, faEye, faFilter, faSpinner, faChevronDown, faChevronUp,
  faAward, faLocationDot, faEuro, faUsers, faCalendarDay,
  faEnvelope, faPhone, faGlobe, faEllipsisVertical, faPlus, faXmark,
  faPaperPlane, faCircleCheck, faShieldHalved,
  faHashtag, faSignature, faRoad, faMapPin, faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate, formatPrice } from "@/lib/utils";

type Statut = "ACTIF" | "EN_ATTENTE" | "SUSPENDU";

interface FormationInfo {
  id: string;
  titre: string;
  prix: number;
  isQualiopi: boolean;
  isCPF: boolean;
  modalite: string;
  sessionCount: number;
}

interface Centre {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  adresse: string;
  codePostal: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  statut: Statut;
  isActive: boolean;
  profilCompletionPct: number;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
  certifications: string[];
  ownerEmail: string;
  ownerNom: string;
  subscriptionPlan?: { nom: string; prix: number } | null;
  formationCount: number;
  sessionCount: number;
  membreCount: number;
  revenue: number;
  formations: FormationInfo[];
}

const statusMap: Record<Statut, { label: string; cls: string; dot: string }> = {
  ACTIF:      { label: "Actif",       cls: "bg-green-400/10 text-green-400 border-green-500/20",   dot: "bg-green-400"  },
  EN_ATTENTE: { label: "En attente",  cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  SUSPENDU:   { label: "Suspendu",    cls: "bg-red-400/10 text-red-400 border-red-500/20",           dot: "bg-red-400"    },
};

// ─── INVITE MODAL ─────────────────────────────────────────

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [telephone, setTelephone] = useState("");
  const [siret, setSiret] = useState("");
  const [siretLookup, setSiretLookup] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const inputClass =
    "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all";

  async function lookupSiret(raw: string) {
    const digits = raw.replace(/\s+/g, "");
    if (digits.length !== 14 || !/^\d{14}$/.test(digits)) return;
    setSiretLookup("loading");
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${digits}&per_page=1`
      );
      const data = await res.json();
      const first = data?.results?.[0];
      const siege = first?.siege;
      if (!siege) throw new Error("siret_not_found");
      if (!nom.trim()) setNom(first.nom_raison_sociale ?? first.nom_complet ?? "");
      if (!adresse.trim()) {
        const parts = [siege.numero_voie, siege.type_voie, siege.libelle_voie]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (parts) setAdresse(parts);
      }
      if (!codePostal.trim() && siege.code_postal) setCodePostal(siege.code_postal);
      if (!ville.trim() && siege.libelle_commune) setVille(siege.libelle_commune);
      setSiretLookup("ok");
    } catch {
      setSiretLookup("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/centres/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          email,
          ville: ville || undefined,
          adresse: adresse || undefined,
          codePostal: codePostal || undefined,
          telephone: telephone || undefined,
          siret: siret || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'invitation");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#0D1D3A", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faPaperPlane} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Inviter un centre</h2>
              <p className="text-gray-500 text-xs">
                Saisissez le SIRET pour pré-remplir automatiquement les informations
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
            </div>
            <p className="text-green-400 font-semibold text-lg">Invitation envoyée !</p>
            <p className="text-gray-500 text-sm mt-1">
              Le centre a été créé et l&apos;email d&apos;invitation envoyé.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ÉTAPE 1 — SIRET auto-complete */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  1
                </span>
                <span className="text-xs font-medium text-blue-300">
                  Remplissage rapide par SIRET
                </span>
              </div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                SIRET <span className="text-gray-600">(optionnel, 14 chiffres)</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faHashtag}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                />
                <input
                  type="text"
                  value={siret}
                  onChange={(e) => {
                    setSiret(e.target.value);
                    setSiretLookup("idle");
                  }}
                  onBlur={(e) => lookupSiret(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="123 456 789 00012"
                  inputMode="numeric"
                  maxLength={18}
                />
                {siretLookup === "loading" && (
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 animate-spin w-3.5 h-3.5"
                  />
                )}
                {siretLookup === "ok" && (
                  <FontAwesomeIcon
                    icon={faWandMagicSparkles}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-400 w-3.5 h-3.5"
                    title="Champs pré-remplis"
                  />
                )}
                {siretLookup === "error" && (
                  <FontAwesomeIcon
                    icon={faCircleXmark}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 w-3.5 h-3.5"
                    title="SIRET introuvable"
                  />
                )}
              </div>
              {siretLookup === "ok" && (
                <p className="mt-1.5 text-[11px] text-green-400 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
                  Champs ci-dessous pré-remplis depuis l&apos;INSEE
                </p>
              )}
            </div>

            {/* ÉTAPE 2 — Infos centre */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  2
                </span>
                <span className="text-xs font-medium text-gray-400">Identité du centre</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Nom du centre *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faSignature}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                    />
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      className={inputClass}
                      style={inputStyle}
                      placeholder="Ex: Centre de Formation ABC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Email du propriétaire *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      style={inputStyle}
                      placeholder="proprietaire@centre.fr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Téléphone <span className="text-gray-600">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                    />
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ÉTAPE 3 — Adresse */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  3
                </span>
                <span className="text-xs font-medium text-gray-400">Adresse</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Adresse <span className="text-gray-600">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faRoad}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                    />
                    <input
                      type="text"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="12 rue de la Paix"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Code postal
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faMapPin}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                      />
                      <input
                        type="text"
                        value={codePostal}
                        onChange={(e) => setCodePostal(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                        placeholder="75001"
                        inputMode="numeric"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Ville
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5"
                      />
                      <input
                        type="text"
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                        placeholder="Paris"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <FontAwesomeIcon icon={faCircleXmark} className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/20"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !nom.trim() || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin w-4 h-4" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
                    Envoyer l&apos;invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── REJECT MODAL ─────────────────────────────────────────

function RejectModal({
  centre,
  onClose,
  onSuccess,
}: {
  centre: Centre;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/centres/${centre.id}/validate`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du rejet");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 rounded-xl p-6 shadow-2xl"
        style={{ background: "#0D1D3A", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleXmark} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Rejeter le centre</h2>
              <p className="text-gray-500 text-xs">{centre.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Raison du refus *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-600 transition-all resize-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              placeholder="Expliquez les elements a corriger..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <FontAwesomeIcon icon={faCircleXmark} className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/20"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin w-4 h-4" />
                  Envoi...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCircleXmark} className="w-3.5 h-3.5" />
                  Rejeter avec motif
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────

export default function AdminCentresPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<"tous" | Statut>("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [rejectCentre, setRejectCentre] = useState<Centre | null>(null);

  const fetchCentres = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterStatut !== "tous") params.set("statut", filterStatut);
    if (search) params.set("search", search);

    fetch(`/api/admin/centres?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setCentres(data);
        else setCentres([]);
      })
      .catch((err) => {
        setError(err.message);
        setCentres([]);
      })
      .finally(() => setLoading(false));
  }, [filterStatut, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchCentres, 300);
    return () => clearTimeout(timeout);
  }, [fetchCentres]);

  async function handleActivate(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/centres/${id}/validate`, {
        method: "POST",
      });
      if (res.ok) {
        setCentres((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, statut: "ACTIF" as Statut, isActive: true } : c
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  async function changeStatut(id: string, statut: Statut) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/centres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut }),
      });
      if (res.ok) {
        setCentres((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, statut, isActive: statut === "ACTIF" } : c
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
      setOpenMenu(null);
    }
  }

  const filtered = centres.filter((c) => {
    // Search is handled server-side, but also apply client-side for instant feedback
    if (search) {
      const q = search.toLowerCase();
      const matchSearch =
        c.nom.toLowerCase().includes(q) ||
        c.ville.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.ownerEmail.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    // Status filter is also server-side, but local fallback
    if (filterStatut !== "tous" && c.statut !== filterStatut) return false;
    return true;
  });

  // Count from full dataset (not filtered by search)
  const counts = {
    tous: centres.length,
    ACTIF:      centres.filter((c) => c.statut === "ACTIF").length,
    EN_ATTENTE: centres.filter((c) => c.statut === "EN_ATTENTE").length,
    SUSPENDU:   centres.filter((c) => c.statut === "SUSPENDU").length,
  };

  // Centres ready to validate (EN_ATTENTE + 100% completion)
  const readyToValidateCount = centres.filter(
    (c) => c.statut === "EN_ATTENTE" && c.profilCompletionPct >= 100
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Centres partenaires</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {loading
              ? "Chargement..."
              : `${counts.tous} centres · ${counts.EN_ATTENTE} en attente de validation`}
            {!loading && readyToValidateCount > 0 && (
              <span className="text-green-400 font-semibold ml-2">
                · {readyToValidateCount} pret(s) a valider
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Inviter un centre
        </button>
      </div>

      {/* Tabs statut */}
      <div className="flex flex-wrap gap-2">
        {(["tous", "ACTIF", "EN_ATTENTE", "SUSPENDU"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${filterStatut === s
                ? "bg-white/10 text-white border-white/20"
                : "text-gray-400 border-white/8 hover:text-white hover:border-white/20"
              }`}
          >
            {s === "tous" ? "Tous" : statusMap[s].label}
            {!loading && <span className="ml-2 text-xs opacity-60">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Rechercher un centre, une ville, un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchCentres} className="ml-3 underline hover:no-underline">
            Reessayer
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faBuilding} className="text-2xl mb-2" />
            <p className="text-sm">Aucun centre trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-5">Centre</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Statut</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Profil</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Abonnement</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Formations</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">CA total</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Inscrit</th>
                  <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => {
                  const st = statusMap[c.statut];
                  const isExpanded = expandedId === c.id;
                  const isReadyToValidate =
                    c.statut === "EN_ATTENTE" && c.profilCompletionPct >= 100;
                  return (
                    <tr key={c.id} className="group">
                      <td colSpan={8} className="p-0">
                        <div>
                          {/* Main row */}
                          <div className="flex items-center hover:bg-white/3 transition-colors">
                            <div className="py-3.5 px-5 flex-1 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                                  <FontAwesomeIcon icon={faBuilding} className="text-xs text-gray-500" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">{c.nom}</p>
                                    {isReadyToValidate && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400/15 text-green-400 border border-green-500/25 animate-pulse">
                                        <FontAwesomeIcon icon={faShieldHalved} className="w-2.5 h-2.5" />
                                        Pret a valider
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                    <FontAwesomeIcon icon={faLocationDot} className="text-[9px]" />
                                    {c.ville || "Ville non renseignee"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </div>
                            <div className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${c.profilCompletionPct}%`,
                                      background: c.profilCompletionPct >= 100
                                        ? "#22c55e"
                                        : c.profilCompletionPct >= 50
                                        ? "#3b82f6"
                                        : "#f97316",
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-semibold ${
                                  c.profilCompletionPct >= 100
                                    ? "text-green-400"
                                    : c.profilCompletionPct >= 50
                                    ? "text-blue-400"
                                    : "text-orange-400"
                                }`}>
                                  {c.profilCompletionPct}%
                                </span>
                              </div>
                            </div>
                            <div className="py-3.5 px-4">
                              {c.subscriptionPlan ? (
                                <span className="text-gray-300 text-xs">{c.subscriptionPlan.nom}</span>
                              ) : (
                                <span className="text-gray-600 text-xs">Aucun</span>
                              )}
                            </div>
                            <div className="py-3.5 px-4">
                              <span className="text-gray-300 text-xs">{c.formationCount} formation(s)</span>
                              <p className="text-gray-600 text-[10px]">{c.sessionCount} session(s)</p>
                            </div>
                            <div className="py-3.5 px-4">
                              <span className="text-green-400 text-xs font-semibold">
                                {c.revenue > 0 ? formatPrice(c.revenue) : "\u2014"}
                              </span>
                            </div>
                            <div className="py-3.5 px-4 text-gray-500 text-xs">
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                                {formatDate(new Date(c.createdAt))}
                              </div>
                            </div>
                            <div className="py-3.5 px-4">
                              <div className="flex items-center gap-1 justify-end">
                                {/* Ready to validate: show prominent activate + reject buttons */}
                                {isReadyToValidate && (
                                  <>
                                    <button
                                      onClick={() => handleActivate(c.id)}
                                      disabled={updatingId === c.id}
                                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                      title="Activer ce centre"
                                    >
                                      {updatingId === c.id ? (
                                        <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                      ) : (
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                      )}
                                      Activer
                                    </button>
                                    <button
                                      onClick={() => setRejectCentre(c)}
                                      disabled={updatingId === c.id}
                                      className="p-1.5 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                                      title="Rejeter avec motif"
                                    >
                                      <FontAwesomeIcon icon={faCircleXmark} className="text-xs" />
                                    </button>
                                  </>
                                )}
                                {/* EN_ATTENTE but not ready: standard actions */}
                                {c.statut === "EN_ATTENTE" && !isReadyToValidate && (
                                  <>
                                    <button
                                      onClick={() => changeStatut(c.id, "ACTIF")}
                                      disabled={updatingId === c.id}
                                      className="p-1.5 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50"
                                      title="Activer"
                                    >
                                      {updatingId === c.id ? (
                                        <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                      ) : (
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setRejectCentre(c)}
                                      disabled={updatingId === c.id}
                                      className="p-1.5 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                                      title="Rejeter"
                                    >
                                      <FontAwesomeIcon icon={faCircleXmark} className="text-xs" />
                                    </button>
                                  </>
                                )}
                                {c.statut === "ACTIF" && (
                                  <button
                                    onClick={() => changeStatut(c.id, "SUSPENDU")}
                                    disabled={updatingId === c.id}
                                    className="p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-400/20 transition-colors disabled:opacity-50 text-[10px]"
                                    title="Suspendre"
                                  >
                                    {updatingId === c.id ? (
                                      <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                    ) : (
                                      "Suspendre"
                                    )}
                                  </button>
                                )}
                                {c.statut === "SUSPENDU" && (
                                  <button
                                    onClick={() => changeStatut(c.id, "ACTIF")}
                                    disabled={updatingId === c.id}
                                    className="p-1.5 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50 text-[10px]"
                                    title="Reactiver"
                                  >
                                    {updatingId === c.id ? (
                                      <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin" />
                                    ) : (
                                      "Reactiver"
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                  className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors"
                                  title={isExpanded ? "Masquer les details" : "Voir les details"}
                                >
                                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-white/5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                {/* Contact Info */}
                                <div className="space-y-3">
                                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Contact</h3>
                                  <div className="space-y-2">
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-[10px] w-3" />
                                      Proprietaire : <span className="text-white">{c.ownerNom}</span>
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-600 text-[10px] w-3" />
                                      {c.email ?? c.ownerEmail}
                                    </p>
                                    {c.telephone && (
                                      <p className="text-gray-400 text-xs flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPhone} className="text-gray-600 text-[10px] w-3" />
                                        {c.telephone}
                                      </p>
                                    )}
                                    {c.siteWeb && (
                                      <p className="text-gray-400 text-xs flex items-center gap-2">
                                        <FontAwesomeIcon icon={faGlobe} className="text-gray-600 text-[10px] w-3" />
                                        {c.siteWeb}
                                      </p>
                                    )}
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faLocationDot} className="text-gray-600 text-[10px] w-3" />
                                      {c.adresse}, {c.codePostal} {c.ville}
                                    </p>
                                  </div>
                                </div>

                                {/* Subscription & Stats */}
                                <div className="space-y-3">
                                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Abonnement & chiffres</h3>
                                  <div className="space-y-2">
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faEuro} className="text-gray-600 text-[10px] w-3" />
                                      Plan : <span className="text-white">{c.subscriptionPlan?.nom ?? "Aucun"}</span>
                                      {c.subscriptionPlan && (
                                        <span className="text-gray-500">({formatPrice(c.subscriptionPlan.prix)}/mois)</span>
                                      )}
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faCalendarDay} className="text-gray-600 text-[10px] w-3" />
                                      {c.formationCount} formation(s) · {c.sessionCount} session(s)
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-[10px] w-3" />
                                      {c.membreCount} membre(s) dans l'equipe
                                    </p>
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                      <FontAwesomeIcon icon={faEuro} className="text-gray-600 text-[10px] w-3" />
                                      CA total : <span className="text-green-400 font-semibold">{formatPrice(c.revenue)}</span>
                                    </p>
                                    {c.certifications.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {c.certifications.map((cert, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-400/10 border border-purple-500/20 text-purple-400">
                                            <FontAwesomeIcon icon={faAward} className="text-[9px]" />
                                            {cert}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Formations list */}
                                <div className="space-y-3">
                                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Formations actives</h3>
                                  {c.formations.length === 0 ? (
                                    <p className="text-gray-600 text-xs">Aucune formation active</p>
                                  ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {c.formations.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-white/3 border border-white/5">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-white text-xs truncate">{f.titre}</p>
                                            <p className="text-gray-600 text-[10px]">
                                              {f.sessionCount} session(s) · {f.modalite}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            {f.isQualiopi && (
                                              <span className="text-[9px] text-purple-400">Qualiopi</span>
                                            )}
                                            <span className="text-green-400 text-xs font-semibold">{formatPrice(f.prix)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={fetchCentres}
        />
      )}
      {rejectCentre && (
        <RejectModal
          centre={rejectCentre}
          onClose={() => setRejectCentre(null)}
          onSuccess={fetchCentres}
        />
      )}
    </div>
  );
}
