"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faSpinner,
  faTriangleExclamation,
  faSearch,
  faLocationDot,
  faClock,
  faCalendarDays,
  faStar as faStarSolid,
  faCircleCheck,
  faCircleXmark,
  faHourglassHalf,
  faXmark,
  faFileLines,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────

interface Reservation {
  id: string;
  numero: string;
  status: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "REMBOURSEE" | "TERMINEE";
  montant: number;
  createdAt: string;
  session: {
    dateDebut: string;
    dateFin: string;
    formation: {
      titre: string;
      slug: string;
      prix: number;
      lieu: string | null;
      duree: string;
      centre: { nom: string; ville: string };
    };
  };
}

interface ReviewData {
  id: string;
  note: number;
  commentaire: string | null;
  formationId: string;
}

interface FormationGroup {
  formationSlug: string;
  formationTitre: string;
  centre: { nom: string; ville: string };
  lieu: string | null;
  duree: string;
  prix: number;
  reservations: Reservation[];
  category: "en_cours" | "terminee" | "annulee";
  nextSession: string | null;
  review: ReviewData | null;
}

// ─── Star Rating Component ──────────────────────────────

function StarRatingInput({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <FontAwesomeIcon
            icon={star <= value ? faStarSolid : faStarRegular}
            className={`text-lg ${star <= value ? "text-yellow-400" : "text-gray-600"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Review Modal ───────────────────────────────────────

function ReviewModal({
  formationTitre,
  formationId,
  onClose,
  onSuccess,
}: {
  formationTitre: string;
  formationId: string;
  onClose: () => void;
  onSuccess: (review: ReviewData) => void;
}) {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (note === 0) {
      setError("Veuillez sélectionner une note.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId,
          note,
          commentaire: commentaire.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur lors de l'envoi");
      }
      const review = await res.json();
      onSuccess(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-white">Laisser un avis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          Comment s&apos;est passée votre formation <span className="text-white font-medium">{formationTitre}</span> ?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Votre note</p>
            <StarRatingInput value={note} onChange={setNote} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Commentaire (optionnel)</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-blue-500 transition-colors resize-none"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || note === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                Envoyer mon avis
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function MesFormationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"en_cours" | "terminee" | "annulee">("en_cours");
  const [reviewModal, setReviewModal] = useState<{ formationTitre: string; formationId: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations").then((r) => {
        if (!r.ok) throw new Error("Erreur chargement réservations");
        return r.json();
      }),
      fetch("/api/reviews").then((r) => {
        if (!r.ok) throw new Error("Erreur chargement avis");
        return r.json();
      }),
    ])
      .then(([reservationsData, reviewsData]) => {
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Group reservations by formation ──────────────────
  const formationGroups: FormationGroup[] = (() => {
    const groupMap = new Map<string, FormationGroup>();

    for (const r of reservations) {
      const slug = r.session.formation.slug;
      if (!groupMap.has(slug)) {
        const sessionDate = new Date(r.session.dateDebut);
        const now = new Date();
        let category: "en_cours" | "terminee" | "annulee";

        if (r.status === "TERMINEE") {
          category = "terminee";
        } else if (r.status === "ANNULEE" || r.status === "REMBOURSEE") {
          category = "annulee";
        } else if (r.status === "CONFIRMEE" && sessionDate > now) {
          category = "en_cours";
        } else if (r.status === "CONFIRMEE" && sessionDate <= now) {
          category = "en_cours";
        } else {
          category = "en_cours";
        }

        const review = reviews.find(
          (rev) => rev.formationId === slug || (rev as unknown as { formation?: { slug?: string } }).formation?.slug === slug
        ) ?? null;

        groupMap.set(slug, {
          formationSlug: slug,
          formationTitre: r.session.formation.titre,
          centre: r.session.formation.centre,
          lieu: r.session.formation.lieu,
          duree: r.session.formation.duree,
          prix: r.session.formation.prix,
          reservations: [],
          category,
          nextSession: r.status === "CONFIRMEE" ? r.session.dateDebut : null,
          review,
        });
      }
      groupMap.get(slug)!.reservations.push(r);
    }

    // Re-evaluate category based on all reservations in the group
    for (const group of groupMap.values()) {
      const hasTerminee = group.reservations.some((r) => r.status === "TERMINEE");
      const hasConfirmee = group.reservations.some((r) => r.status === "CONFIRMEE");
      const allCancelled = group.reservations.every(
        (r) => r.status === "ANNULEE" || r.status === "REMBOURSEE"
      );

      if (hasTerminee) {
        group.category = "terminee";
      } else if (allCancelled) {
        group.category = "annulee";
      } else if (hasConfirmee) {
        group.category = "en_cours";
      }

      // Find next session date
      const futureSessions = group.reservations
        .filter((r) => r.status === "CONFIRMEE" && new Date(r.session.dateDebut) > new Date())
        .map((r) => r.session.dateDebut)
        .sort();
      group.nextSession = futureSessions[0] ?? null;

      // Match review by checking the formation data from reviews response
      const matchedReview = reviews.find((rev) => {
        const revFormation = (rev as unknown as { formation?: { slug?: string; id?: string } }).formation;
        return revFormation?.slug === group.formationSlug;
      });
      if (matchedReview) {
        group.review = matchedReview;
      }
    }

    return Array.from(groupMap.values());
  })();

  const filteredGroups = formationGroups.filter((g) => g.category === activeTab);

  const counts = {
    en_cours: formationGroups.filter((g) => g.category === "en_cours").length,
    terminee: formationGroups.filter((g) => g.category === "terminee").length,
    annulee: formationGroups.filter((g) => g.category === "annulee").length,
  };

  function getCountdown(dateStr: string): string {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Maintenant";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return `Dans ${Math.floor(days / 30)} mois`;
    if (days > 0) return `Dans ${days} jour${days > 1 ? "s" : ""}`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `Dans ${hours} heure${hours > 1 ? "s" : ""}`;
  }

  function handleReviewSuccess(review: ReviewData) {
    setReviews((prev) => [...prev, review]);
    setReviewModal(null);
  }

  // We need formation IDs for the review API, so we need to find them
  // Since the reservations API doesn't return formationId, we fetch it from the formations API by slug
  async function openReviewModal(group: FormationGroup) {
    // Try to find formationId from existing reviews first
    // Otherwise, fetch the formation to get its ID
    try {
      const res = await fetch(`/api/formations/slug/${group.formationSlug}`);
      if (!res.ok) throw new Error("Formation introuvable");
      const formation = await res.json();
      setReviewModal({ formationTitre: group.formationTitre, formationId: formation.id });
    } catch {
      alert("Impossible de charger la formation. Veuillez réessayer.");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Mes formations</h1>
        <p className="text-gray-500 text-sm">Suivez l&apos;avancement de vos formations</p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement de vos formations...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
          <p className="text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {([
              { key: "en_cours" as const, label: "En cours", count: counts.en_cours, icon: faHourglassHalf },
              { key: "terminee" as const, label: "Terminées", count: counts.terminee, icon: faCircleCheck },
              { key: "annulee" as const, label: "Annulées", count: counts.annulee, icon: faCircleXmark },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                style={activeTab !== tab.key ? { background: "rgba(255,255,255,0.05)" } : undefined}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-3 h-3" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20" : "bg-white/5"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Formation Cards */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
              <FontAwesomeIcon icon={faSearch} className="text-3xl text-gray-600 mb-3" />
              <p className="text-white font-medium mb-1">
                {activeTab === "en_cours" && "Aucune formation en cours"}
                {activeTab === "terminee" && "Aucune formation terminée"}
                {activeTab === "annulee" && "Aucune formation annulée"}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {activeTab === "en_cours"
                  ? "Réservez un stage pour le voir ici."
                  : "Rien à afficher pour le moment."}
              </p>
              {activeTab === "en_cours" && (
                <Link
                  href="/recherche"
                  className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all"
                >
                  Rechercher un stage
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div
                  key={group.formationSlug}
                  className="rounded-xl p-5 border"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm mb-1">{group.formationTitre}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                          {group.centre.nom} — {group.centre.ville}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                          {group.duree}
                        </span>
                        <span className="font-medium text-white">{formatPrice(group.prix)}</span>
                      </div>

                      {/* Session dates */}
                      {group.reservations.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 text-xs text-gray-400 mb-1"
                        >
                          <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 text-gray-600" />
                          <span>
                            {formatDate(r.session.dateDebut)} — {formatDate(r.session.dateFin)}
                          </span>
                          <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            r.status === "CONFIRMEE"
                              ? "bg-green-400/10 text-green-400"
                              : r.status === "TERMINEE"
                              ? "bg-gray-400/10 text-gray-400"
                              : "bg-red-400/10 text-red-400"
                          }`}>
                            {r.status === "CONFIRMEE" ? "Confirmée" : r.status === "TERMINEE" ? "Terminée" : r.status === "ANNULEE" ? "Annulée" : "Remboursée"}
                          </span>
                        </div>
                      ))}

                      {/* Countdown for en_cours */}
                      {group.category === "en_cours" && group.nextSession && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: "30%" }} />
                          </div>
                          <span className="text-xs text-blue-400 font-medium">
                            {getCountdown(group.nextSession)}
                          </span>
                        </div>
                      )}

                      {/* Review for terminee */}
                      {group.category === "terminee" && group.review && (
                        <div className="mt-3 flex items-center gap-2">
                          <StarRatingInput value={group.review.note} readonly />
                          <span className="text-xs text-green-400 font-medium">Avis déposé</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      {group.category === "en_cours" && (
                        <>
                          {group.reservations[0] && (
                            <a
                              href={`/api/convocation/${group.reservations[0].id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
                              Convocation
                            </a>
                          )}
                        </>
                      )}
                      {group.category === "terminee" && !group.review && (
                        <button
                          onClick={() => openReviewModal(group)}
                          className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-500/20 transition-colors"
                        >
                          <FontAwesomeIcon icon={faStarSolid} className="w-3 h-3" />
                          Laisser un avis
                        </button>
                      )}
                      <Link
                        href={`/formations/${group.formationSlug}`}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Voir la fiche
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {formationGroups.length > 0 && (
            <div
              className="mt-10 text-center rounded-xl p-8 border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="text-gray-400 mb-4 text-sm">Vous souhaitez réserver un nouveau stage ?</p>
              <Link
                href="/recherche"
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Rechercher un stage
              </Link>
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          formationTitre={reviewModal.formationTitre}
          formationId={reviewModal.formationId}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
