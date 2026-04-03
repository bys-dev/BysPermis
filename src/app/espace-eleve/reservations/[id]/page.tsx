"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendarCheck,
  faCircleCheck,
  faCircleXmark,
  faCircleExclamation,
  faHourglassHalf,
  faSpinner,
  faTriangleExclamation,
  faFileLines,
  faLocationDot,
  faClock,
  faPhone,
  faBuilding,
  faCreditCard,
  faGraduationCap,
  faChevronRight,
  faBan,
  faHeadset,
  faMapMarkerAlt,
  faUsers,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface ReservationDetail {
  id: string;
  numero: string;
  status: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "REMBOURSEE" | "TERMINEE";
  montant: number;
  commissionMontant: number | null;
  stripePaymentId: string | null;
  civilite: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  numeroPermis: string | null;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    dateDebut: string;
    dateFin: string;
    placesTotal: number;
    placesRestantes: number;
    status: string;
    formation: {
      id: string;
      titre: string;
      slug: string;
      description: string;
      duree: string;
      prix: number;
      modalite: string;
      lieu: string | null;
      isQualiopi: boolean;
      isCPF: boolean;
      centre: {
        id: string;
        nom: string;
        ville: string;
        adresse: string;
        codePostal: string;
        telephone: string | null;
        email: string | null;
      };
    };
  };
}

const statusConfig = {
  CONFIRMEE: {
    label: "Confirmée",
    icon: faCircleCheck,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-500/20",
  },
  TERMINEE: {
    label: "Terminée",
    icon: faCheckCircle,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    border: "border-gray-500/20",
  },
  ANNULEE: {
    label: "Annulée",
    icon: faCircleXmark,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-500/20",
  },
  EN_ATTENTE: {
    label: "En attente",
    icon: faHourglassHalf,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-500/20",
  },
  REMBOURSEE: {
    label: "Remboursée",
    icon: faCircleExclamation,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-500/20",
  },
} as const;

const modaliteLabels: Record<string, string> = {
  PRESENTIEL: "Présentiel",
  DISTANCIEL: "Distanciel",
  HYBRIDE: "Hybride",
};

// Timeline steps
const timelineSteps = [
  { key: "CREEE", label: "Créée" },
  { key: "CONFIRMEE", label: "Confirmée" },
  { key: "TERMINEE", label: "Terminée" },
] as const;

function getTimelineIndex(status: string): number {
  if (status === "EN_ATTENTE") return 0;
  if (status === "CONFIRMEE") return 1;
  if (status === "TERMINEE") return 2;
  // ANNULEE / REMBOURSEE stop at wherever they were
  if (status === "ANNULEE" || status === "REMBOURSEE") return -1;
  return 0;
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reservation, setReservation] = useState<ReservationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(async (r) => {
        if (r.status === 404) throw new Error("NOT_FOUND");
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Erreur lors du chargement");
        }
        return r.json();
      })
      .then((data) => setReservation(data))
      .catch((err) => {
        setError(
          err.message === "NOT_FOUND"
            ? "NOT_FOUND"
            : err.message || "Impossible de charger la réservation."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = useCallback(async () => {
    if (!reservation) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur lors de l'annulation");
      }
      const updated = await res.json();
      setReservation(updated);
      setShowCancelModal(false);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'annulation"
      );
    } finally {
      setCancelling(false);
    }
  }, [reservation]);

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement de la réservation...</span>
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────
  if (error === "NOT_FOUND") {
    return (
      <div
        className="text-center py-16 rounded-xl border"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-3xl text-yellow-400 mb-3"
        />
        <p className="text-white font-medium mb-1">Réservation introuvable</p>
        <p className="text-gray-500 text-sm mb-6">
          Cette réservation n&apos;existe pas ou ne vous appartient pas.
        </p>
        <Link
          href="/espace-eleve/reservations"
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all"
        >
          Retour aux réservations
        </Link>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (error || !reservation) {
    return (
      <div
        className="text-center py-16 rounded-xl border"
        style={{
          background: "rgba(220,38,38,0.05)",
          borderColor: "rgba(220,38,38,0.15)",
        }}
      >
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-3xl text-red-400 mb-3"
        />
        <p className="text-white font-medium mb-1">Erreur de chargement</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const s = statusConfig[reservation.status];
  const formation = reservation.session.formation;
  const centre = formation.centre;
  const timelineIdx = getTimelineIndex(reservation.status);
  const isCancelled =
    reservation.status === "ANNULEE" || reservation.status === "REMBOURSEE";
  const canCancel =
    reservation.status === "EN_ATTENTE" ||
    reservation.status === "CONFIRMEE";

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link
          href="/espace-eleve"
          className="hover:text-white transition-colors"
        >
          Espace élève
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5" />
        <Link
          href="/espace-eleve/reservations"
          className="hover:text-white transition-colors"
        >
          Mes réservations
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5" />
        <span className="text-gray-400 font-mono">{reservation.numero}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/espace-eleve/reservations")}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors hover:border-blue-500/30"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="w-4 h-4 text-gray-400"
          />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="font-display font-bold text-xl text-white">
              {formation.titre}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.color} ${s.bg} ${s.border}`}
            >
              <FontAwesomeIcon icon={s.icon} className="w-3 h-3" />
              {s.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm font-mono">
            {reservation.numero}
          </p>
        </div>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div
          className="rounded-xl p-5 mb-6 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Progression
          </h3>
          <div className="flex items-center gap-0">
            {timelineSteps.map((step, i) => {
              const isActive = i <= timelineIdx;
              const isCurrent = i === timelineIdx;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? isCurrent
                            ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                            : "bg-green-500/20 text-green-400"
                          : "bg-gray-800 text-gray-600"
                      }`}
                    >
                      {isActive && !isCurrent ? (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="w-4 h-4"
                        />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isActive ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full ${
                        i < timelineIdx ? "bg-green-500/40" : "bg-gray-800"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div
          className="rounded-xl p-4 mb-6 border flex items-center gap-3"
          style={{
            background:
              reservation.status === "REMBOURSEE"
                ? "rgba(59,130,246,0.08)"
                : "rgba(239,68,68,0.08)",
            borderColor:
              reservation.status === "REMBOURSEE"
                ? "rgba(59,130,246,0.2)"
                : "rgba(239,68,68,0.2)",
          }}
        >
          <FontAwesomeIcon
            icon={reservation.status === "REMBOURSEE" ? faCircleExclamation : faCircleXmark}
            className={`w-5 h-5 ${
              reservation.status === "REMBOURSEE"
                ? "text-blue-400"
                : "text-red-400"
            }`}
          />
          <div>
            <p className="text-white text-sm font-medium">
              {reservation.status === "REMBOURSEE"
                ? "Cette réservation a été annulée et remboursée"
                : "Cette réservation a été annulée"}
            </p>
          </div>
        </div>
      )}

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Formation */}
        <div
          className="rounded-xl p-5 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faGraduationCap}
                className="text-blue-400 text-sm"
              />
            </div>
            <h3 className="text-sm font-semibold text-white">Formation</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Titre</p>
              <p className="text-white">{formation.titre}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Description</p>
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
                {formation.description}
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-gray-500 text-xs">Durée</p>
                <p className="text-white">{formation.duree}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Modalité</p>
                <p className="text-white">
                  {modaliteLabels[formation.modalite] || formation.modalite}
                </p>
              </div>
            </div>
            {(formation.isQualiopi || formation.isCPF) && (
              <div className="flex gap-2 pt-1">
                {formation.isQualiopi && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    Qualiopi
                  </span>
                )}
                {formation.isCPF && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Eligible CPF
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Session */}
        <div
          className="rounded-xl p-5 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-600/15 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-purple-400 text-sm"
              />
            </div>
            <h3 className="text-sm font-semibold text-white">Session</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Dates</p>
              <p className="text-white flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faClock}
                  className="w-3 h-3 text-gray-500"
                />
                {formatDate(reservation.session.dateDebut)} —{" "}
                {formatDate(reservation.session.dateFin)}
              </p>
            </div>
            {formation.lieu && (
              <div>
                <p className="text-gray-500 text-xs">Lieu</p>
                <p className="text-white flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="w-3 h-3 text-gray-500"
                  />
                  {formation.lieu}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">Places</p>
              <p className="text-white flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="w-3 h-3 text-gray-500"
                />
                {reservation.session.placesRestantes} /{" "}
                {reservation.session.placesTotal} places restantes
              </p>
            </div>
          </div>
        </div>

        {/* Centre */}
        <div
          className="rounded-xl p-5 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-600/15 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faBuilding}
                className="text-orange-400 text-sm"
              />
            </div>
            <h3 className="text-sm font-semibold text-white">Centre</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Nom</p>
              <p className="text-white">{centre.nom}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Adresse</p>
              <p className="text-white flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="w-3 h-3 text-gray-500"
                />
                {centre.adresse}, {centre.codePostal} {centre.ville}
              </p>
            </div>
            {centre.telephone && (
              <div>
                <p className="text-gray-500 text-xs">Téléphone</p>
                <p className="text-white flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="w-3 h-3 text-gray-500"
                  />
                  {centre.telephone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Paiement */}
        <div
          className="rounded-xl p-5 border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-600/15 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faCreditCard}
                className="text-green-400 text-sm"
              />
            </div>
            <h3 className="text-sm font-semibold text-white">Paiement</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Montant</p>
              <p className="text-white text-lg font-bold">
                {formatPrice(reservation.montant)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Date</p>
              <p className="text-white">
                {formatDate(reservation.createdAt)}
              </p>
            </div>
            {reservation.stripePaymentId && (
              <div>
                <p className="text-gray-500 text-xs">Référence Stripe</p>
                <p className="text-gray-400 font-mono text-xs truncate">
                  {reservation.stripePaymentId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="rounded-xl p-5 border"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {reservation.status === "CONFIRMEE" && (
            <a
              href={`/api/convocation/${reservation.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all"
            >
              <FontAwesomeIcon icon={faFileLines} className="w-4 h-4" />
              Télécharger la convocation
            </a>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
            >
              <FontAwesomeIcon icon={faBan} className="w-4 h-4" />
              Annuler ma réservation
            </button>
          )}

          <Link
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-gray-400 border transition-all hover:text-white hover:border-gray-500/30"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <FontAwesomeIcon icon={faHeadset} className="w-4 h-4" />
            Contacter le support
          </Link>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !cancelling && setShowCancelModal(false)}
          />
          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl p-6 border shadow-2xl"
            style={{
              background: "#0D1D3A",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="text-red-400 text-2xl"
                />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Annuler cette réservation ?
              </h3>
              <p className="text-gray-400 text-sm">
                {reservation.stripePaymentId &&
                reservation.status === "CONFIRMEE"
                  ? "Votre paiement sera remboursé automatiquement. Cette action est irréversible."
                  : "Cette action est irréversible."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 border transition-all hover:text-white disabled:opacity-50"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                Non, garder
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin w-4 h-4"
                    />
                    Annulation...
                  </>
                ) : (
                  "Oui, annuler"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
