"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadset,
  faSpinner,
  faFilter,
  faEnvelope,
  faEnvelopeOpen,
  faCircle,
  faChevronRight,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

interface Ticket {
  id: string;
  sujet: string;
  auteur: string;
  email: string;
  status: "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";
  priorite: "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";
  createdAt: string;
  derniereReponse?: string;
}

const statusConfig: Record<string, { cls: string; label: string }> = {
  OUVERT: { cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20", label: "Ouvert" },
  EN_COURS: { cls: "bg-blue-400/10 text-blue-400 border-blue-500/20", label: "En cours" },
  RESOLU: { cls: "bg-green-400/10 text-green-400 border-green-500/20", label: "Resolu" },
  FERME: { cls: "bg-gray-400/10 text-gray-400 border-gray-500/20", label: "Ferme" },
};

const prioriteConfig: Record<string, { cls: string; label: string }> = {
  BASSE: { cls: "text-gray-400", label: "Basse" },
  NORMALE: { cls: "text-blue-400", label: "Normale" },
  HAUTE: { cls: "text-orange-400", label: "Haute" },
  URGENTE: { cls: "text-red-400", label: "Urgente" },
};

const MOCK_TICKETS: Ticket[] = [
  { id: "TKT-127", sujet: "Probleme de paiement sur ma reservation", auteur: "Jean Dupont", email: "jean.dupont@email.com", status: "OUVERT", priorite: "HAUTE", createdAt: "2026-03-30T10:30:00Z" },
  { id: "TKT-126", sujet: "Impossible de se connecter a mon espace", auteur: "Marie Martin", email: "marie.martin@email.com", status: "EN_COURS", priorite: "NORMALE", createdAt: "2026-03-29T14:00:00Z", derniereReponse: "2026-03-30T09:00:00Z" },
  { id: "TKT-125", sujet: "Demande de remboursement stage annule", auteur: "Lucas Bernard", email: "lucas.b@email.com", status: "OUVERT", priorite: "URGENTE", createdAt: "2026-03-29T08:00:00Z" },
  { id: "TKT-124", sujet: "Question sur les formations disponibles", auteur: "Sophie Leroy", email: "sophie.l@email.com", status: "RESOLU", priorite: "BASSE", createdAt: "2026-03-28T16:00:00Z", derniereReponse: "2026-03-29T11:00:00Z" },
  { id: "TKT-123", sujet: "Bug affichage sur mobile", auteur: "Pierre Durand", email: "pierre.d@email.com", status: "FERME", priorite: "NORMALE", createdAt: "2026-03-27T09:00:00Z", derniereReponse: "2026-03-28T15:00:00Z" },
];

export default function PlateformeTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("TOUS");
  const [filterPriorite, setFilterPriorite] = useState<string>("TOUTES");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reponse, setReponse] = useState("");

  useEffect(() => {
    fetch("/api/admin/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTickets(data);
        else setTickets(MOCK_TICKETS);
      })
      .catch(() => setTickets(MOCK_TICKETS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    if (filterStatus !== "TOUS" && t.status !== filterStatus) return false;
    if (filterPriorite !== "TOUTES" && t.priorite !== filterPriorite) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets support</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gerer les demandes d&apos;assistance des utilisateurs
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20">
          <FontAwesomeIcon icon={faHeadset} className="text-yellow-400 text-xs" />
          <span className="text-yellow-400 text-xs font-medium">
            {tickets.filter((t) => t.status === "OUVERT").length} ouverts
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500 text-xs" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0A1628] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="OUVERT">Ouvert</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Resolu</option>
            <option value="FERME">Ferme</option>
          </select>
        </div>
        <div>
          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
            className="bg-[#0A1628] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
          >
            <option value="TOUTES">Toutes les priorites</option>
            <option value="BASSE">Basse</option>
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Liste des tickets */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faHeadset} className="text-gray-600 text-3xl mb-3" />
              <p className="text-gray-500 text-sm">Aucun ticket trouve</p>
            </div>
          ) : (
            filtered.map((t) => {
              const sc = statusConfig[t.status] ?? statusConfig.OUVERT;
              const pc = prioriteConfig[t.priorite] ?? prioriteConfig.NORMALE;
              const isSelected = selectedTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500/30"
                      : "bg-[#0A1628] border-white/8 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon
                          icon={t.status === "OUVERT" || t.status === "EN_COURS" ? faEnvelope : faEnvelopeOpen}
                          className={`text-xs ${t.status === "OUVERT" ? "text-yellow-400" : "text-gray-500"}`}
                        />
                        <span className="text-gray-500 text-xs font-mono">{t.id}</span>
                        {t.priorite === "URGENTE" && (
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-xs" />
                        )}
                      </div>
                      <p className="text-white text-sm font-medium truncate">{t.sujet}</p>
                      <p className="text-gray-500 text-xs mt-1">{t.auteur}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>
                        {sc.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <FontAwesomeIcon icon={faCircle} className={`text-[6px] ${pc.cls}`} />
                        <span className={pc.cls}>{pc.label}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail du ticket */}
        <div className="lg:col-span-3">
          {selectedTicket ? (
            <div className="bg-[#0A1628] rounded-xl border border-white/8 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-xs font-mono">{selectedTicket.id}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig[selectedTicket.status]?.cls}`}>
                      {statusConfig[selectedTicket.status]?.label}
                    </span>
                  </div>
                  <h2 className="text-white font-semibold text-lg">{selectedTicket.sujet}</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Par {selectedTicket.auteur} &mdash; {selectedTicket.email}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/8 pt-4">
                <p className="text-gray-500 text-xs mb-1">Priorite</p>
                <span className={`text-sm font-medium ${prioriteConfig[selectedTicket.priorite]?.cls}`}>
                  {prioriteConfig[selectedTicket.priorite]?.label}
                </span>
              </div>

              <div className="border-t border-white/8 pt-4">
                <p className="text-gray-500 text-xs mb-1">Cree le</p>
                <p className="text-gray-300 text-sm">
                  {new Date(selectedTicket.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Reponse */}
              <div className="border-t border-white/8 pt-4">
                <label className="block text-gray-400 text-xs mb-2">Repondre au ticket</label>
                <textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  rows={4}
                  placeholder="Saisissez votre reponse..."
                  className="w-full bg-[#060E1A] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-gray-600"
                />
                <div className="flex items-center gap-3 mt-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      // Placeholder - envoyer la reponse via API
                      setReponse("");
                    }}
                  >
                    Envoyer la reponse
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-green-600/15 text-green-400 text-sm font-medium border border-green-500/20 hover:bg-green-600/25 transition-colors"
                    onClick={() => {
                      // Placeholder - marquer comme resolu
                      setSelectedTicket({ ...selectedTicket, status: "RESOLU" });
                      setTickets((prev) =>
                        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: "RESOLU" } : t))
                      );
                    }}
                  >
                    Marquer resolu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0A1628] rounded-xl border border-white/8 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-2xl mb-3" />
              <p className="text-gray-500 text-sm">Selectionnez un ticket pour voir les details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
