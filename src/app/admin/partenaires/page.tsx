"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandshake, faCircleCheck, faCircleXmark, faSpinner, faXmark,
  faMagnifyingGlass, faEnvelope, faPhone, faLocationDot, faAward,
  faCalendarDay, faUserTie, faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

type LeadStatut = "NOUVEAU" | "EN_COURS" | "COMPTE_CREE" | "REFUSE" | "ARCHIVE";

interface Lead {
  id: string;
  centreNom: string;
  agrementNumber: string | null;
  agrementDepartement: string | null;
  ville: string;
  telephone: string;
  email: string;
  contactNom: string;
  contactEmail: string;
  volumeMensuel: string | null;
  message: string | null;
  statut: LeadStatut;
  motifRefus: string | null;
  traiteAt: string | null;
  createdAt: string;
  traitePar: { prenom: string; nom: string; email: string } | null;
  centre: { id: string; nom: string; slug: string; statut: string } | null;
}

const TABS: { key: "A_TRAITER" | LeadStatut | "TOUS"; label: string }[] = [
  { key: "A_TRAITER", label: "À traiter" },
  { key: "COMPTE_CREE", label: "Acceptées" },
  { key: "REFUSE", label: "Refusées" },
  { key: "TOUS", label: "Toutes" },
];

const statutBadge: Record<LeadStatut, { label: string; cls: string }> = {
  NOUVEAU: { label: "Nouvelle", cls: "bg-blue-400/10 text-blue-300 border-blue-400/20" },
  EN_COURS: { label: "En cours", cls: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20" },
  COMPTE_CREE: { label: "Acceptée", cls: "bg-green-400/10 text-green-400 border-green-500/20" },
  REFUSE: { label: "Refusée", cls: "bg-red-400/10 text-red-400 border-red-500/20" },
  ARCHIVE: { label: "Archivée", cls: "bg-white/5 text-slate-300 border-white/10" },
};

const volumeLabels: Record<string, string> = {
  "1-4": "1 à 4 stages / mois",
  "5-10": "5 à 10 stages / mois",
  "10+": "Plus de 10 stages / mois",
  ne_sait_pas: "Ne sait pas encore",
};

const fieldStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 rounded-xl p-6 shadow-2xl"
        style={{ background: "#24385E", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {children}
      </div>
    </div>
  );
}

function AcceptModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: (msg: string) => void }) {
  const [agrement, setAgrement] = useState(lead.agrementNumber ?? "");
  const [dep, setDep] = useState(lead.agrementDepartement ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partenaires/${lead.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(agrement.trim() ? { agrementNumber: agrement.trim() } : {}),
          ...(dep.trim() ? { agrementDepartement: dep.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'acceptation");
      onDone(data.message ?? "Demande acceptée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleCheck} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Accepter la demande</h2>
            <p className="text-slate-300 text-xs">{lead.centreNom}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Fermer">
          <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          Un compte <strong className="text-white">propriétaire de centre</strong> sera créé pour{" "}
          <strong className="text-white">{lead.contactEmail}</strong>. Le centre sera créé hors ligne
          (en attente) et ses accès lui seront envoyés par email.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">N° d&apos;agrément</label>
            <input
              value={agrement}
              onChange={(e) => setAgrement(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white uppercase focus:outline-none focus:ring-1 focus:ring-green-600"
              style={fieldStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Département</label>
            <input
              value={dep}
              onChange={(e) => setDep(e.target.value)}
              maxLength={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white uppercase focus:outline-none focus:ring-1 focus:ring-green-600"
              style={fieldStyle}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Vérifiez le numéro auprès de la préfecture avant d&apos;accepter.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            <FontAwesomeIcon icon={loading ? faSpinner : faCircleCheck} className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Création du compte..." : "Accepter et créer le compte"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function RefuseModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: (msg: string) => void }) {
  const [motif, setMotif] = useState("");
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partenaires/${lead.id}/refuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif, notifyCentre: notify }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur lors du refus");
      onDone(notify && data.emailSent ? "Demande refusée, le centre a été prévenu." : "Demande refusée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleXmark} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Refuser la demande</h2>
            <p className="text-slate-300 text-xs">{lead.centreNom}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Fermer">
          <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Motif du refus *</label>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            required
            rows={4}
            placeholder="Ex. numéro d'agrément introuvable auprès de la préfecture."
            className="w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
            style={fieldStyle}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-red-600" />
          Prévenir le centre par email ({lead.contactEmail})
        </label>
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || motif.trim().length < 3}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            <FontAwesomeIcon icon={loading ? faSpinner : faCircleXmark} className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Envoi..." : "Refuser"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PartenairesContent() {
  const highlightId = useSearchParams().get("demande");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("A_TRAITER");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<LeadStatut, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<Lead | null>(null);
  const [refusing, setRefusing] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/partenaires?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");
      setLeads(data.leads);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchLeads, search]);

  // Lien depuis l'email : ouvre l'onglet qui contient la demande.
  useEffect(() => {
    if (!highlightId || leads.length === 0) return;
    const lead = leads.find((l) => l.id === highlightId);
    if (!lead) return;
    const target = lead.statut === "COMPTE_CREE" ? "COMPTE_CREE" : lead.statut === "REFUSE" ? "REFUSE" : "A_TRAITER";
    setTab(target);
    requestAnimationFrame(() => document.getElementById(`lead-${highlightId}`)?.scrollIntoView({ block: "center" }));
  }, [highlightId, leads]);

  const visible = leads.filter((l) => {
    if (tab === "TOUS") return true;
    if (tab === "A_TRAITER") return l.statut === "NOUVEAU" || l.statut === "EN_COURS";
    return l.statut === tab;
  });

  const tabCount = (key: (typeof TABS)[number]["key"]) => {
    if (!counts) return null;
    if (key === "A_TRAITER") return counts.NOUVEAU + counts.EN_COURS;
    if (key === "TOUS") return Object.values(counts).reduce((a, b) => a + b, 0);
    return counts[key];
  };

  function done(msg: string) {
    setAccepting(null);
    setRefusing(null);
    setFlash(msg);
    fetchLeads();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faHandshake} className="text-blue-400 w-6 h-6" />
            Demandes de partenariat
          </h1>
          <p className="text-slate-300 text-sm mt-0.5">
            Centres ayant rempli le formulaire « Devenir partenaire ». Acceptez pour créer leur compte automatiquement.
          </p>
        </div>
      </div>

      {flash && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
          <span>{flash}</span>
          <button onClick={() => setFlash(null)} aria-label="Fermer" className="text-green-300/70 hover:text-green-200">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                tab === t.key
                  ? "bg-white/10 text-white border-white/20"
                  : "text-slate-300 border-white/10 hover:text-white hover:border-white/20"
              }`}
            >
              {t.label}
              {tabCount(t.key) !== null && <span className="ml-2 text-xs opacity-60">{tabCount(t.key)}</span>}
            </button>
          ))}
        </div>
        <div className="relative lg:w-80">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Centre, ville, email, agrément..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1C2D4F] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchLeads} className="ml-3 underline hover:no-underline">Réessayer</button>
        </div>
      )}

      {loading && leads.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-white/10 bg-[#1C2D4F] text-slate-300 text-sm">
          Aucune demande dans cet onglet.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((l) => {
            const badge = statutBadge[l.statut];
            const actionable = l.statut === "NOUVEAU" || l.statut === "EN_COURS" || l.statut === "REFUSE";
            return (
              <div
                key={l.id}
                id={`lead-${l.id}`}
                className={`rounded-xl border p-5 bg-[#1C2D4F] ${
                  l.id === highlightId ? "border-blue-500/60 ring-1 ring-blue-500/40" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-white font-semibold text-lg truncate">{l.centreNom}</h2>
                    <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                      <FontAwesomeIcon icon={faCalendarDay} className="w-3 h-3" />
                      Reçue le {formatDate(l.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
                </div>

                <div className="rounded-lg bg-white/[0.04] border border-white/10 px-4 py-3 mb-4 flex items-center gap-3">
                  <FontAwesomeIcon icon={faAward} className="text-blue-400 w-4 h-4" />
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">N° d&apos;agrément préfectoral</div>
                    <div className="text-white font-mono text-sm">
                      {l.agrementNumber ?? <span className="text-yellow-300 font-sans">Non renseigné</span>}
                      {l.agrementDepartement && <span className="text-slate-300 font-sans"> · dép. {l.agrementDepartement}</span>}
                    </div>
                  </div>
                </div>

                <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300 min-w-0">
                    <FontAwesomeIcon icon={faUserTie} className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{l.contactNom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 min-w-0">
                    <FontAwesomeIcon icon={faLocationDot} className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{l.ville}</span>
                  </div>
                  <a href={`mailto:${l.contactEmail}`} className="flex items-center gap-2 text-blue-300 hover:text-blue-200 min-w-0">
                    <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{l.contactEmail}</span>
                  </a>
                  <a href={`tel:${l.telephone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-blue-300 hover:text-blue-200 min-w-0">
                    <FontAwesomeIcon icon={faPhone} className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{l.telephone}</span>
                  </a>
                </dl>

                {l.volumeMensuel && (
                  <p className="text-xs text-slate-300 mt-3">Volume estimé : {volumeLabels[l.volumeMensuel] ?? l.volumeMensuel}</p>
                )}
                {l.message && (
                  <p className="mt-3 text-sm text-gray-300 bg-white/[0.03] border-l-2 border-blue-500/50 px-3 py-2 rounded whitespace-pre-line">
                    {l.message}
                  </p>
                )}
                {l.statut === "REFUSE" && l.motifRefus && (
                  <p className="mt-3 text-sm text-red-300 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded">
                    Motif du refus : {l.motifRefus}
                  </p>
                )}
                {l.traiteAt && l.traitePar && (
                  <p className="mt-3 text-xs text-slate-400">
                    Traitée le {formatDate(l.traiteAt)} par {[l.traitePar.prenom, l.traitePar.nom].filter(Boolean).join(" ") || l.traitePar.email}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-5">
                  {actionable && (
                    <button
                      onClick={() => setAccepting(l)}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
                      Accepter
                    </button>
                  )}
                  {(l.statut === "NOUVEAU" || l.statut === "EN_COURS") && (
                    <button
                      onClick={() => setRefusing(l)}
                      className="inline-flex items-center gap-2 border border-red-500/40 text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      <FontAwesomeIcon icon={faCircleXmark} className="w-3.5 h-3.5" />
                      Refuser
                    </button>
                  )}
                  {l.centre && (
                    <Link
                      href={`/admin/centres?search=${encodeURIComponent(l.centre.nom)}`}
                      className="inline-flex items-center gap-2 border border-white/15 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
                      Voir le centre
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {accepting && <AcceptModal lead={accepting} onClose={() => setAccepting(null)} onDone={done} />}
      {refusing && <RefuseModal lead={refusing} onClose={() => setRefusing(null)} onDone={done} />}
    </div>
  );
}

export default function AdminPartenairesPage() {
  return (
    <Suspense fallback={null}>
      <PartenairesContent />
    </Suspense>
  );
}
