"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faHeadset, faChevronRight,
  faClock, faCircleCheck, faSpinner, faUserGraduate, faBuilding,
  faEnvelope, faPaperPlane, faArrowLeft, faExclamationTriangle,
  faLockOpen, faLock, faRefresh,
} from "@fortawesome/free-solid-svg-icons";

type TicketStatut = "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";
type TicketPriorite = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";

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
  status: TicketStatut;
  priorite: TicketPriorite;
  categorie?: string;
  createdAt: string;
  user: { prenom: string; nom: string; email: string; role: string };
  messages: TicketMessage[];
}

const statutMap: Record<TicketStatut, { label: string; cls: string }> = {
  OUVERT:   { label: "Ouvert",    cls: "bg-red-400/10 text-red-400 border-red-500/20"       },
  EN_COURS: { label: "En cours",  cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20" },
  RESOLU:   { label: "Resolu",    cls: "bg-green-400/10 text-green-400 border-green-500/20"  },
  FERME:    { label: "Ferme",     cls: "bg-gray-400/10 text-gray-400 border-gray-500/20"     },
};

const prioriteMap: Record<TicketPriorite, { label: string; cls: string }> = {
  BASSE:    { label: "Basse",    cls: "text-gray-400" },
  NORMALE:  { label: "Normale",  cls: "text-blue-400" },
  HAUTE:    { label: "Haute",    cls: "text-orange-400" },
  URGENTE:  { label: "Urgente",  cls: "text-red-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)} jour(s)`;
}

const CENTRE_ROLE_VALUES = ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<"tous" | TicketStatut>("tous");
  const [filterPriorite, setFilterPriorite] = useState<"tous" | TicketPriorite>("tous");
  const [filterRole, setFilterRole] = useState<"tous" | "eleves" | "centres">("tous");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterStatut !== "tous") params.set("status", filterStatut);
    if (search) params.set("search", search);

    fetch(`/api/admin/tickets?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur lors du chargement des tickets");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setTickets(data);
        else setTickets([]);
      })
      .catch((err) => {
        setError(err.message);
        setTickets([]);
      })
      .finally(() => setLoading(false));
  }, [filterStatut, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchTickets, 300);
    return () => clearTimeout(timeout);
  }, [fetchTickets]);

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: reply }),
      });

      if (res.ok) {
        const msg = await res.json();
        const updatedMessages = [...selected.messages, {
          id: msg.id,
          contenu: msg.contenu,
          isAdmin: msg.isAdmin,
          createdAt: msg.createdAt,
          user: { prenom: "Admin", nom: "BYS", role: "ADMIN" },
        }];
        const updatedTicket = { ...selected, messages: updatedMessages, status: "EN_COURS" as TicketStatut };
        setSelected(updatedTicket);
        setTickets((prev) => prev.map((t) => t.id === selected.id ? updatedTicket : t));
        setReply("");
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: TicketStatut) {
    if (!selected) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = { ...selected, status };
        setSelected(updated);
        setTickets((prev) => prev.map((t) => t.id === selected.id ? updated : t));
      }
    } catch {
      // silently fail
    } finally {
      setChangingStatus(false);
    }
  }

  const filtered = tickets.filter((t) => {
    const matchPriorite = filterPriorite === "tous" || t.priorite === filterPriorite;
    const matchRole = filterRole === "tous" ||
      (filterRole === "eleves" && t.user.role === "ELEVE") ||
      (filterRole === "centres" && CENTRE_ROLE_VALUES.includes(t.user.role));
    return matchPriorite && matchRole;
  });

  const counts = {
    tous: tickets.length,
    OUVERT: tickets.filter((t) => t.status === "OUVERT").length,
    EN_COURS: tickets.filter((t) => t.status === "EN_COURS").length,
    RESOLU: tickets.filter((t) => t.status === "RESOLU").length,
    FERME: tickets.filter((t) => t.status === "FERME").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {loading ? "Chargement..." : `${counts.OUVERT} ticket(s) ouvert(s) · ${counts.EN_COURS} en cours`}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
          {error}
          <button onClick={fetchTickets} className="ml-2 underline hover:no-underline">Reessayer</button>
        </div>
      )}

      {selected ? (
        /* ── Vue detail ticket ── */
        <div className="bg-[#0A1628] rounded-xl border border-white/8 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-white/8">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors mt-0.5"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-gray-500 text-xs font-mono">{selected.id.slice(0, 12)}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statutMap[selected.status].cls}`}>
                    {statutMap[selected.status].label}
                  </span>
                  {selected.priorite && selected.priorite !== "NORMALE" && (
                    <span className={`text-[11px] font-semibold ${prioriteMap[selected.priorite]?.cls ?? "text-gray-400"}`}>
                      {prioriteMap[selected.priorite]?.label ?? selected.priorite}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${selected.user.role === "ELEVE" ? "bg-blue-400/10 text-blue-400 border-blue-500/20" : "bg-purple-400/10 text-purple-400 border-purple-500/20"}`}>
                    <FontAwesomeIcon icon={selected.user.role === "ELEVE" ? faUserGraduate : faBuilding} className="text-[9px]" />
                    {selected.user.role === "ELEVE" ? "Eleve" : CENTRE_ROLE_VALUES.includes(selected.user.role) ? "Centre" : "Plateforme"}
                  </span>
                </div>
                <h2 className="text-white font-semibold">{selected.sujet}</h2>
                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faEnvelope} className="text-[9px]" />
                  {selected.user.prenom} {selected.user.nom} · {selected.user.email} · {timeAgo(selected.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {selected.status === "OUVERT" && (
                <button
                  onClick={() => changeStatus("EN_COURS")}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
                >
                  Prendre en charge
                </button>
              )}
              {selected.status !== "RESOLU" && selected.status !== "FERME" && (
                <button
                  onClick={() => changeStatus("RESOLU")}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-400/20 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-1 text-[10px]" />
                  Resoudre
                </button>
              )}
              {selected.status === "RESOLU" && (
                <>
                  <button
                    onClick={() => changeStatus("FERME")}
                    disabled={changingStatus}
                    className="px-3 py-1.5 rounded-lg bg-gray-400/10 border border-gray-500/20 text-gray-400 text-xs font-medium hover:bg-gray-400/20 transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faLock} className="mr-1 text-[10px]" />
                    Fermer
                  </button>
                  <button
                    onClick={() => changeStatus("OUVERT")}
                    disabled={changingStatus}
                    className="px-3 py-1.5 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faLockOpen} className="mr-1 text-[10px]" />
                    Rouvrir
                  </button>
                </>
              )}
              {selected.status === "FERME" && (
                <button
                  onClick={() => changeStatus("OUVERT")}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg bg-red-400/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faLockOpen} className="mr-1 text-[10px]" />
                  Rouvrir
                </button>
              )}
              {changingStatus && (
                <FontAwesomeIcon icon={faSpinner} className="text-gray-500 animate-spin text-xs mt-1.5" />
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {selected.messages.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Aucun message</p>
            ) : (
              selected.messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.isAdmin ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${m.isAdmin ? "bg-red-600" : "bg-blue-600/40"}`}>
                    {`${m.user.prenom[0]}${m.user.nom[0]}`.toUpperCase()}
                  </div>
                  <div className={`max-w-lg ${m.isAdmin ? "items-end" : ""}`}>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${m.isAdmin ? "bg-red-600/15 border border-red-500/20 text-white" : "bg-white/5 border border-white/8 text-gray-300"}`}>
                      {m.contenu}
                    </div>
                    <p className="text-gray-600 text-[11px] mt-1">
                      {m.user.prenom} {m.user.nom} · {timeAgo(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply */}
          {selected.status !== "FERME" && (
            <div className="p-5 border-t border-white/8">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">A</div>
                <div className="flex-1">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Repondre au ticket..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim() || sending}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {sending
                        ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                        : <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                      }
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Liste tickets ── */
        <>
          {/* Tabs statut */}
          <div className="flex flex-wrap gap-2">
            {(["tous", "OUVERT", "EN_COURS", "RESOLU", "FERME"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border
                  ${filterStatut === s
                    ? "bg-white/10 text-white border-white/20"
                    : "text-gray-400 border-white/8 hover:text-white hover:border-white/20"
                  }`}
              >
                {s === "tous" ? "Tous" : statutMap[s].label}
                {!loading && <span className="ml-2 text-xs opacity-60">{counts[s]}</span>}
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                placeholder="Rechercher un ticket, un nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-2">
              {/* Role filter */}
              {([
                { key: "tous", label: "Tous", icon: faHeadset },
                { key: "eleves", label: "Eleves", icon: faUserGraduate },
                { key: "centres", label: "Centres", icon: faBuilding },
              ] as const).map((r) => (
                <button
                  key={r.key}
                  onClick={() => setFilterRole(r.key)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors
                    ${filterRole === r.key ? "bg-white/10 text-white border-white/20" : "text-gray-400 border-white/8 hover:text-white"}`}
                >
                  <FontAwesomeIcon icon={r.icon} className="mr-1" />{r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {/* Priority filter */}
              <select
                value={filterPriorite}
                onChange={(e) => setFilterPriorite(e.target.value as "tous" | TicketPriorite)}
                className="px-3 py-2.5 rounded-lg text-xs font-medium border border-white/8 bg-[#0A1628] text-gray-400 focus:outline-none focus:border-blue-500/50"
              >
                <option value="tous">Toutes priorites</option>
                <option value="BASSE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          {/* Tickets list */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span className="text-sm">Chargement des tickets...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => {
                const st = statutMap[t.status];
                const pr = prioriteMap[t.priorite] ?? prioriteMap.NORMALE;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="w-full bg-[#0A1628] rounded-xl border border-white/8 p-4 hover:border-white/15 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-gray-500 text-xs font-mono">{t.id.slice(0, 12)}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                              {st.label}
                            </span>
                            <span className={`text-[11px] font-medium ${pr.cls}`}>
                              {pr.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${t.user.role === "ELEVE" ? "bg-blue-400/10 text-blue-400 border-blue-500/20" : CENTRE_ROLE_VALUES.includes(t.user.role) ? "bg-purple-400/10 text-purple-400 border-purple-500/20" : "bg-orange-400/10 text-orange-400 border-orange-500/20"}`}>
                              <FontAwesomeIcon icon={t.user.role === "ELEVE" ? faUserGraduate : CENTRE_ROLE_VALUES.includes(t.user.role) ? faBuilding : faHeadset} className="text-[9px]" />
                              {t.user.role === "ELEVE" ? "Eleve" : CENTRE_ROLE_VALUES.includes(t.user.role) ? "Centre" : "Plateforme"}
                            </span>
                          </div>
                          <p className="text-white font-medium truncate">{t.sujet}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            De {t.user.prenom} {t.user.nom} · {t.messages.length} message(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                          {timeAgo(t.createdAt)}
                        </p>
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-xs group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && !loading && (
                <div className="text-center py-12 bg-[#0A1628] rounded-xl border border-white/8 text-gray-500">
                  <FontAwesomeIcon icon={faHeadset} className="text-2xl mb-2" />
                  <p className="text-sm">Aucun ticket trouve</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
