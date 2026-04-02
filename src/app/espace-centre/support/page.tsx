"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadset, faPlus, faChevronRight, faClock, faCircleCheck,
  faSpinner, faPaperPlane, faArrowLeft, faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

type TicketStatut = "OUVERT" | "EN_COURS" | "RESOLU";

interface Message {
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
  createdAt: string;
  messages: Message[];
}

const statutMap: Record<TicketStatut, { label: string; cls: string }> = {
  OUVERT: { label: "Ouvert", cls: "bg-red-400/10 text-red-400 border-red-500/20" },
  EN_COURS: { label: "En cours", cls: "bg-yellow-400/10 text-yellow-400 border-yellow-500/20" },
  RESOLU: { label: "Résolu", cls: "bg-green-400/10 text-green-400 border-green-500/20" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `Il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

const subjectOptions = [
  { value: "", label: "Sélectionnez un sujet" },
  { value: "validation", label: "Validation de mon centre" },
  { value: "session", label: "Problème de session" },
  { value: "paiement", label: "Paiement / Commission" },
  { value: "fiche", label: "Fiche centre" },
  { value: "stripe", label: "Compte Stripe Connect" },
  { value: "autre", label: "Autre demande" },
];

export default function CentreSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [newForm, setNewForm] = useState({ sujet: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTickets(data); })
      .catch(() => {});
  }, []);

  async function submitNewTicket() {
    if (!newForm.sujet || !newForm.message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sujet: newForm.sujet, message: newForm.message, categorie: newForm.sujet }),
      });
      if (res.ok) {
        const ticket = await res.json();
        setTickets((prev) => [ticket, ...prev]);
        setSent(true);
      }
    } catch {
      // silently fail in dev
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: reply }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        const updatedTicket = {
          ...selected,
          messages: [...selected.messages, { ...newMsg, user: { prenom: "Moi", nom: "", role: "CENTRE_OWNER" } }],
        };
        setSelected(updatedTicket);
        setTickets((prev) => prev.map((t) => t.id === selected.id ? updatedTicket : t));
        setReply("");
      }
    } catch {
      // silently fail
    } finally {
      setReplying(false);
    }
  }

  if (showNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNew(false)}
            className="p-2 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Nouveau ticket</h1>
            <p className="text-gray-400 text-sm">Décrivez votre problème, notre équipe vous répond sous 24h</p>
          </div>
        </div>

        {sent ? (
          <div className="bg-[#0A1628] rounded-xl border border-green-500/20 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Ticket créé avec succès</h3>
            <p className="text-gray-400 text-sm mb-6">Notre équipe vous répondra dans les meilleurs délais.</p>
            <button
              onClick={() => { setSent(false); setShowNew(false); setNewForm({ sujet: "", message: "" }); }}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-sm transition-colors"
            >
              Retour aux tickets
            </button>
          </div>
        ) : (
          <div className="bg-[#0A1628] rounded-xl border border-white/8 p-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Sujet *</label>
                <select
                  value={newForm.sujet}
                  onChange={(e) => setNewForm({ ...newForm, sujet: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  {subjectOptions.map((o) => (
                    <option key={o.value} value={o.value} disabled={!o.value} className="bg-[#0A1628]">{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Description *</label>
                <textarea
                  value={newForm.message}
                  onChange={(e) => setNewForm({ ...newForm, message: e.target.value })}
                  placeholder="Décrivez votre problème en détail..."
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  disabled={!newForm.sujet || !newForm.message.trim() || submitting}
                  onClick={submitNewTicket}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  {submitting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />}
                  Envoyer le ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="p-2 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-xs font-mono">{selected.id.slice(0, 8).toUpperCase()}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statutMap[selected.status as TicketStatut]?.cls ?? ""}`}>
                {statutMap[selected.status as TicketStatut]?.label ?? selected.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white">{selected.sujet}</h1>
            <p className="text-gray-500 text-xs">Ouvert {timeAgo(selected.createdAt)}</p>
          </div>
        </div>

        <div className="bg-[#0A1628] rounded-xl border border-white/8 overflow-hidden">
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {selected.messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${!m.isAdmin ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${m.isAdmin ? "bg-red-600" : "bg-blue-600/40"}`}>
                  {`${m.user.prenom[0] ?? ""}${m.user.nom[0] ?? ""}`.toUpperCase() || "?"}
                </div>
                <div>
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-lg ${m.isAdmin ? "bg-red-600/10 border border-red-500/20 text-gray-300" : "bg-white/5 border border-white/8 text-white"}`}>
                    {m.contenu}
                  </div>
                  <p className="text-gray-600 text-[11px] mt-1">{m.user.prenom} {m.user.nom} · {timeAgo(m.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
          {selected.status !== "RESOLU" && (
            <div className="p-5 border-t border-white/8">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Ajouter un message..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  disabled={!reply.trim() || replying}
                  onClick={sendReply}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {replying ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />}
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Support</h1>
          <p className="text-gray-400 text-sm mt-0.5">Vos demandes auprès de l&apos;équipe BYS Permis</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Nouveau ticket
        </button>
      </div>

      {/* Info card */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <FontAwesomeIcon icon={faEnvelope} className="text-blue-400 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-medium">Notre équipe répond sous 24h ouvrées</p>
          <p className="text-blue-400/70 text-xs mt-0.5">Lundi – Vendredi : 9h – 18h · Email : bysforma95@gmail.com</p>
        </div>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-[#0A1628] rounded-xl border border-white/8 text-gray-500">
            <FontAwesomeIcon icon={faHeadset} className="text-3xl mb-3" />
            <p className="font-medium text-white mb-1">Aucun ticket</p>
            <p className="text-sm">Vous n&apos;avez aucune demande en cours.</p>
          </div>
        ) : tickets.map((t) => {
          const st = statutMap[t.status as TicketStatut] ?? { label: t.status, cls: "" };
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="w-full bg-[#0A1628] rounded-xl border border-white/8 p-4 hover:border-white/15 transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-gray-500 text-xs font-mono">{t.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                      {t.status === "OUVERT" ? <FontAwesomeIcon icon={faHeadset} className="text-[9px]" /> : t.status === "EN_COURS" ? <FontAwesomeIcon icon={faSpinner} className="text-[9px]" /> : <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />}
                      {st.label}
                    </span>
                  </div>
                  <p className="text-white font-medium">{t.sujet}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.messages.length} message(s) · Ouvert {timeAgo(t.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
