"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadset,
  faPaperPlane,
  faPlus,
  faSpinner,
  faTriangleExclamation,
  faInbox,
  faChevronLeft,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

// ─── Types ────────────────────────────────────────────────

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
  priorite: string;
  categorie: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

const statusConfig = {
  OUVERT:   { label: "Ouvert",   color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-500/20" },
  EN_COURS: { label: "En cours", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-500/20" },
  RESOLU:   { label: "Résolu",   color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-500/20" },
  FERME:    { label: "Fermé",    color: "text-gray-400",   bg: "bg-gray-400/10",   border: "border-gray-500/20" },
} as const;

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // New ticket form
  const [newSujet, setNewSujet] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);

  // Reply form
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  // ─── Fetch tickets ─────────────────────────────────────
  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages.length]);

  async function fetchTickets() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  // ─── Create ticket ────────────────────────────────────
  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSujet.trim() || !newMessage.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sujet: newSujet, message: newMessage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur lors de la création");
      }
      setNewSujet("");
      setNewMessage("");
      setShowNewForm(false);
      await fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  // ─── Reply to ticket ──────────────────────────────────
  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setReplying(true);
      const res = await fetch(`/api/tickets/${selectedTicketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: replyText }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur lors de l'envoi");
      }
      setReplyText("");
      await fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setReplying(false);
    }
  }

  // ─── Format date ───────────────────────────────────────
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Support</h1>
          <p className="text-gray-500 text-sm">Besoin d&apos;aide ? Ouvrez un ticket et nous vous répondrons rapidement.</p>
        </div>
        <button
          onClick={() => { setShowNewForm(true); setSelectedTicketId(null); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
          Nouveau ticket
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
          <p className="text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={fetchTickets} className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all">
            Réessayer
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "500px" }}>
          {/* ─── Left: Ticket list ─── */}
          <div className={`w-full lg:w-[360px] shrink-0 space-y-2 ${selectedTicketId ? "hidden lg:block" : ""}`}>
            {showNewForm && !selectedTicketId ? (
              /* ─── New ticket form ─── */
              <div className="rounded-xl p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white text-sm">Nouveau ticket</h2>
                  <button onClick={() => setShowNewForm(false)} className="text-gray-500 hover:text-white text-xs">
                    Annuler
                  </button>
                </div>
                <form onSubmit={handleCreateTicket} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Sujet</label>
                    <input
                      type="text"
                      value={newSujet}
                      onChange={(e) => setNewSujet(e.target.value)}
                      placeholder="Ex: Problème avec ma réservation"
                      required
                      minLength={5}
                      maxLength={200}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-blue-500 transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Message</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Décrivez votre problème en détail..."
                      required
                      minLength={10}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                    )}
                    Envoyer
                  </button>
                </form>
              </div>
            ) : null}

            {tickets.length === 0 && !showNewForm ? (
              <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                <FontAwesomeIcon icon={faHeadset} className="text-3xl text-gray-600 mb-3" />
                <p className="text-white font-medium mb-1">Aucun ticket</p>
                <p className="text-gray-500 text-sm">Vous n&apos;avez pas encore ouvert de ticket de support.</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const s = statusConfig[ticket.status];
                const isSelected = ticket.id === selectedTicketId;
                const lastMessage = ticket.messages[ticket.messages.length - 1];
                return (
                  <button
                    key={ticket.id}
                    onClick={() => { setSelectedTicketId(ticket.id); setShowNewForm(false); }}
                    className={`w-full text-left rounded-xl p-4 border transition-all ${
                      isSelected
                        ? "border-blue-500/40"
                        : "hover:border-white/10"
                    }`}
                    style={{
                      background: isSelected ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.04)",
                      borderColor: isSelected ? undefined : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-white text-sm truncate flex-1">{ticket.sujet}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${s.color} ${s.bg} ${s.border}`}>
                        <FontAwesomeIcon icon={faCircle} className="w-1.5 h-1.5" />
                        {s.label}
                      </span>
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-gray-500 truncate mb-2">
                        {lastMessage.isAdmin ? "Support : " : "Vous : "}
                        {lastMessage.contenu}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-600">{fmtDate(ticket.updatedAt)}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* ─── Right: Ticket detail ─── */}
          <div className={`flex-1 min-w-0 ${!selectedTicketId ? "hidden lg:flex" : "flex"} flex-col`}>
            {!selectedTicket ? (
              <div className="flex-1 flex items-center justify-center rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-center">
                  <FontAwesomeIcon icon={faInbox} className="text-3xl text-gray-600 mb-3" />
                  <p className="text-gray-500 text-sm">Sélectionnez un ticket pour voir la conversation</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col rounded-xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="lg:hidden text-gray-400 hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white text-sm truncate">{selectedTicket.sujet}</h2>
                    <p className="text-[10px] text-gray-500">Créé le {fmtDate(selectedTicket.createdAt)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusConfig[selectedTicket.status].color} ${statusConfig[selectedTicket.status].bg} ${statusConfig[selectedTicket.status].border}`}>
                    <FontAwesomeIcon icon={faCircle} className="w-1.5 h-1.5" />
                    {statusConfig[selectedTicket.status].label}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: "400px" }}>
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          msg.isAdmin
                            ? "rounded-tl-sm"
                            : "rounded-tr-sm"
                        }`}
                        style={{
                          background: msg.isAdmin
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(59,130,246,0.15)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium ${msg.isAdmin ? "text-blue-400" : "text-gray-400"}`}>
                            {msg.isAdmin ? `${msg.user.prenom} (Support)` : "Vous"}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {fmtDate(msg.createdAt)} {fmtTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.contenu}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply form */}
                {selectedTicket.status !== "FERME" && (
                  <form
                    onSubmit={handleReply}
                    className="px-5 py-4 border-t flex gap-3"
                    style={{ borderColor: "rgba(255,255,255,0.07)" }}
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Écrire un message..."
                      required
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-blue-500 transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
                    />
                    <button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {replying ? (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                      )}
                    </button>
                  </form>
                )}

                {selectedTicket.status === "FERME" && (
                  <div className="px-5 py-3 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <p className="text-xs text-gray-500">Ce ticket est fermé. Vous ne pouvez plus y répondre.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
