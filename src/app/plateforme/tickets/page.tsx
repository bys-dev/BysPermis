"use client";

import { useState, useEffect, useCallback } from "react";
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
  faPaperPlane,
  faCheckCircle,
  faXmarkCircle,
  faUser,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

interface TicketMessage {
  id: string;
  contenu: string;
  isAdmin: boolean;
  createdAt: string;
  user: { prenom: string; nom: string; role: string };
}

interface Ticket {
  id: string;
  sujet: string;
  status: "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";
  priorite: "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";
  createdAt: string;
  updatedAt: string;
  user: { prenom: string; nom: string; email: string; role: string };
  messages: TicketMessage[];
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

export default function PlateformeTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("TOUS");
  const [filterPriorite, setFilterPriorite] = useState<string>("TOUTES");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reponse, setReponse] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/tickets");
      if (!res.ok) throw new Error("Erreur lors du chargement des tickets");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Donnees invalides");
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Keep selectedTicket in sync with tickets list
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets, selectedTicket]);

  const handleSendReply = async () => {
    if (!selectedTicket || !reponse.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: reponse.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? "Erreur lors de l'envoi");
      }
      setReponse("");
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSendingReply(false);
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: "RESOLU" | "FERME") => {
    setActionLoading(`${newStatus}-${ticketId}`);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur lors du changement de statut");
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

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
            {tickets.filter((t) => t.status === "OUVERT" || t.status === "EN_COURS").length} ouverts
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <FontAwesomeIcon icon={faXmarkCircle} className="text-sm" />
          </button>
        </div>
      )}

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
              <p className="text-gray-500 text-sm">
                {tickets.length === 0 ? "Aucun ticket" : "Aucun ticket ne correspond aux filtres"}
              </p>
            </div>
          ) : (
            filtered.map((t) => {
              const sc = statusConfig[t.status] ?? statusConfig.OUVERT;
              const pc = prioriteConfig[t.priorite] ?? prioriteConfig.NORMALE;
              const isSelected = selectedTicket?.id === t.id;
              const auteur = `${t.user.prenom} ${t.user.nom}`;
              const lastMessage = t.messages.length > 0
                ? t.messages[t.messages.length - 1]
                : null;
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTicket(t); setReponse(""); }}
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
                        <span className="text-gray-500 text-xs font-mono">{t.id.slice(0, 8)}</span>
                        {t.priorite === "URGENTE" && (
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-xs" />
                        )}
                      </div>
                      <p className="text-white text-sm font-medium truncate">{t.sujet}</p>
                      <p className="text-gray-500 text-xs mt-1">{auteur}</p>
                      {lastMessage && (
                        <p className="text-gray-600 text-[11px] mt-0.5 truncate">
                          {lastMessage.isAdmin ? "Staff" : auteur}: {lastMessage.contenu}
                        </p>
                      )}
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
                    <span className="text-gray-500 text-xs font-mono">{selectedTicket.id.slice(0, 8)}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig[selectedTicket.status]?.cls}`}>
                      {statusConfig[selectedTicket.status]?.label}
                    </span>
                  </div>
                  <h2 className="text-white font-semibold text-lg">{selectedTicket.sujet}</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Par {selectedTicket.user.prenom} {selectedTicket.user.nom} &mdash; {selectedTicket.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-white/8 pt-4">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Priorite</p>
                  <span className={`text-sm font-medium ${prioriteConfig[selectedTicket.priorite]?.cls}`}>
                    {prioriteConfig[selectedTicket.priorite]?.label}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Cree le</p>
                  <p className="text-gray-300 text-sm">
                    {new Date(selectedTicket.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Messages</p>
                  <p className="text-gray-300 text-sm">{selectedTicket.messages.length}</p>
                </div>
              </div>

              {/* Messages thread */}
              {selectedTicket.messages.length > 0 && (
                <div className="border-t border-white/8 pt-4 space-y-3 max-h-80 overflow-y-auto">
                  <p className="text-gray-500 text-xs font-medium">Conversation</p>
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg border ${
                        msg.isAdmin
                          ? "bg-blue-600/5 border-blue-500/15 ml-4"
                          : "bg-white/3 border-white/5 mr-4"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon
                          icon={msg.isAdmin ? faUserShield : faUser}
                          className={`text-[10px] ${msg.isAdmin ? "text-blue-400" : "text-gray-500"}`}
                        />
                        <span className={`text-xs font-medium ${msg.isAdmin ? "text-blue-400" : "text-gray-400"}`}>
                          {msg.user.prenom} {msg.user.nom}
                          {msg.isAdmin && " (Staff)"}
                        </span>
                        <span className="text-gray-600 text-[10px] ml-auto">
                          {new Date(msg.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{msg.contenu}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reponse */}
              {selectedTicket.status !== "FERME" && (
                <div className="border-t border-white/8 pt-4">
                  <label className="block text-gray-400 text-xs mb-2">Repondre au ticket</label>
                  <textarea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    rows={4}
                    placeholder="Saisissez votre reponse..."
                    className="w-full bg-[#060E1A] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-gray-600"
                    disabled={sendingReply}
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={handleSendReply}
                      disabled={sendingReply || !reponse.trim()}
                    >
                      {sendingReply ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                      ) : (
                        <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                      )}
                      Envoyer la reponse
                    </button>
                    {selectedTicket.status !== "RESOLU" && (
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/15 text-green-400 text-sm font-medium border border-green-500/20 hover:bg-green-600/25 transition-colors disabled:opacity-50"
                        onClick={() => handleChangeStatus(selectedTicket.id, "RESOLU")}
                        disabled={actionLoading === `RESOLU-${selectedTicket.id}`}
                      >
                        {actionLoading === `RESOLU-${selectedTicket.id}` ? (
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                        ) : (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                        )}
                        Resoudre
                      </button>
                    )}
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600/15 text-gray-400 text-sm font-medium border border-gray-500/20 hover:bg-gray-600/25 transition-colors disabled:opacity-50"
                      onClick={() => handleChangeStatus(selectedTicket.id, "FERME")}
                      disabled={actionLoading === `FERME-${selectedTicket.id}`}
                    >
                      {actionLoading === `FERME-${selectedTicket.id}` ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                      ) : (
                        <FontAwesomeIcon icon={faXmarkCircle} className="text-xs" />
                      )}
                      Fermer
                    </button>
                  </div>
                </div>
              )}

              {selectedTicket.status === "FERME" && (
                <div className="border-t border-white/8 pt-4 text-center">
                  <p className="text-gray-500 text-sm">Ce ticket est ferme.</p>
                </div>
              )}
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
