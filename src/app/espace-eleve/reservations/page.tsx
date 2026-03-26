"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck, faLocationDot, faClock, faFileLines,
  faCircleCheck, faCircleXmark, faCircleExclamation, faHourglassHalf,
  faSpinner, faSearch,
} from "@fortawesome/free-solid-svg-icons";
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
      centre: { nom: string; ville: string };
    };
  };
}

const statusConfig = {
  CONFIRMEE:  { label: "Confirmée",  icon: faCircleCheck,      color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20" },
  TERMINEE:   { label: "Terminée",   icon: faCircleCheck,      color: "text-gray-400",   bg: "bg-gray-400/10",   border: "border-gray-500/20"  },
  ANNULEE:    { label: "Annulée",    icon: faCircleXmark,      color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-500/20"   },
  EN_ATTENTE: { label: "En attente", icon: faHourglassHalf,    color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
  REMBOURSEE: { label: "Remboursée", icon: faCircleExclamation,color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/20"  },
} as const;

// ─── Données mock (fallback si API non connectée) ─────────
const MOCK: Reservation[] = [
  {
    id: "res_1", numero: "BYS-2026-A4F2", status: "CONFIRMEE", montant: 199, createdAt: new Date().toISOString(),
    session: { dateDebut: "2026-04-21T09:00:00", dateFin: "2026-04-22T17:30:00", formation: { titre: "Stage de récupération de points", centre: { nom: "BYS Formation — Osny", ville: "Osny" } } },
  },
  {
    id: "res_2", numero: "BYS-2026-B2C9", status: "TERMINEE", montant: 210, createdAt: "2026-03-22T09:00:00",
    session: { dateDebut: "2026-03-22T09:00:00", dateFin: "2026-03-23T17:00:00", formation: { titre: "Sensibilisation sécurité routière", centre: { nom: "Auto-École Dupont", ville: "Cergy" } } },
  },
  {
    id: "res_3", numero: "BYS-2026-D7E1", status: "ANNULEE", montant: 750, createdAt: "2026-02-05T08:00:00",
    session: { dateDebut: "2026-02-05T08:00:00", dateFin: "2026-02-05T18:00:00", formation: { titre: "Stage permis B accéléré", centre: { nom: "BYS Formation — Paris", ville: "Paris" } } },
  },
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setReservations(data);
        else setReservations(MOCK); // fallback mock en dev
      })
      .catch(() => setReservations(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: reservations.length,
    confirmees: reservations.filter((r) => r.status === "CONFIRMEE").length,
    terminees:  reservations.filter((r) => r.status === "TERMINEE").length,
    annulees:   reservations.filter((r) => r.status === "ANNULEE").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Mes réservations</h1>
        <p className="text-gray-500 text-sm">Retrouvez l&apos;historique de tous vos stages</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total",       value: counts.total,      color: "text-white"      },
          { label: "Confirmées",  value: counts.confirmees, color: "text-green-400"  },
          { label: "Terminées",   value: counts.terminees,  color: "text-gray-400"   },
          { label: "Annulées",    value: counts.annulees,   color: "text-red-400"    },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
          <FontAwesomeIcon icon={faSearch} className="text-3xl text-gray-600 mb-3" />
          <p className="text-white font-medium mb-1">Aucune réservation</p>
          <p className="text-gray-500 text-sm mb-6">Vous n&apos;avez pas encore réservé de stage.</p>
          <Link href="/recherche" className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all">
            Réserver un stage
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => {
            const s = statusConfig[r.status];
            const dateDebut = new Date(r.session.dateDebut);
            const dateFin   = new Date(r.session.dateFin);
            return (
              <div key={r.id} className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faCalendarCheck} className="text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm">{r.session.formation.titre}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${s.color} ${s.bg} ${s.border}`}>
                      <FontAwesomeIcon icon={s.icon} className="w-3 h-3" />
                      {s.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3" />
                      {r.session.formation.centre.nom} — {r.session.formation.centre.ville}
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                      {formatDate(dateDebut)} — {formatDate(dateFin)}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                  <span className="font-bold text-white text-sm">{formatPrice(r.montant)}</span>
                  <span className="text-xs text-gray-600 font-mono">{r.numero}</span>
                  {r.status === "CONFIRMEE" && (
                    <a
                      href={`/api/convocation/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                    >
                      <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
                      Convocation PDF
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 text-center rounded-xl p-8 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-gray-400 mb-4 text-sm">Vous souhaitez réserver un nouveau stage ?</p>
        <Link href="/recherche" className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
          Rechercher un stage
        </Link>
      </div>
    </div>
  );
}
