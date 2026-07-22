"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
  faFileLines, faPlus, faTrash, faSpinner, faDownload, faStamp,
  faPaperPlane, faToggleOn, faToggleOff, faCircleCheck, faTriangleExclamation,
  faFileArrowUp, faFileArrowDown, faCheck, faXmark, faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" } as const;
const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" } as const;

interface Template {
  id: string;
  nom: string;
  description: string | null;
  kind: string;
  blobUrl: string | null;
  contenu: string | null;
  requiresAck: boolean;
  autoSend: boolean;
  actif: boolean;
  ordre: number;
}

interface Stagiaire { reservationId: string; numero: string; nom: string; prenom: string }
interface SessionLite { id: string; formation: string; dateDebut: string; stagiaires: Stagiaire[] }

interface DocItem {
  id: string; kind: string; direction: string; nom: string;
  blobUrl: string | null; status: string; requiresAck: boolean; acceptedAt: string | null; createdAt: string;
  verifiedAt: string | null; motifRefus: string | null; purgedAt: string | null;
}

/** Justificatifs transmis par le stagiaire, que le centre doit contrôler. */
const JUSTIFICATIF_KINDS = ["PERMIS", "PIECE_IDENTITE", "LETTRE_48N", "AUTRE"];

const KIND_OPTIONS = [
  { value: "REGLEMENT", label: "Règlement / programme" },
  { value: "BON_ACCORD", label: "Bon d'accord (à signer)" },
  { value: "AUTRE", label: "Autre" },
];

export default function CentreDocumentsPage() {
  const [tab, setTab] = useState<"modeles" | "stagiaires">("modeles");
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Documents</h1>
        <p className="text-gray-400 text-sm">Modèles envoyés automatiquement et échanges avec vos stagiaires.</p>
      </div>
      <div className="flex gap-1 p-1 rounded-lg w-fit mb-6" style={cardStyle}>
        {([["modeles", "Modèles"], ["stagiaires", "Par stagiaire"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === k ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>{label}</button>
        ))}
      </div>
      {tab === "modeles" ? <ModelesTab /> : <StagiairesTab />}
    </div>
  );
}

// ─── Onglet Modèles ──────────────────────────────────────
function ModelesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({ nom: "", kind: "REGLEMENT", contenu: "", requiresAck: false, autoSend: true });

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/centre/document-templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const f = e.currentTarget as HTMLFormElement;
    const fileInput = f.elements.namedItem("file") as HTMLInputElement;
    if (!form.nom.trim()) { setMsg({ type: "err", text: "Nom requis." }); return; }
    if (!fileInput.files?.[0] && !form.contenu.trim()) { setMsg({ type: "err", text: "Fournissez un fichier ou un texte." }); return; }
    setCreating(true); setMsg(null);
    const fd = new FormData();
    fd.append("nom", form.nom);
    fd.append("kind", form.kind);
    fd.append("contenu", form.contenu);
    fd.append("requiresAck", String(form.requiresAck));
    fd.append("autoSend", String(form.autoSend));
    if (fileInput.files?.[0]) fd.append("file", fileInput.files[0]);
    try {
      const res = await fetch("/api/centre/document-templates", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setMsg({ type: "ok", text: "Modèle créé." });
      setForm({ nom: "", kind: "REGLEMENT", contenu: "", requiresAck: false, autoSend: true });
      fileInput.value = "";
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally { setCreating(false); }
  }

  async function toggleActif(t: Template) {
    const fd = new FormData();
    fd.append("actif", String(!t.actif));
    await fetch(`/api/centre/document-templates/${t.id}`, { method: "PATCH", body: fd });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/centre/document-templates/${id}`, { method: "DELETE" });
    setTemplates((p) => p.filter((t) => t.id !== id));
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form */}
      <form onSubmit={create} className="rounded-xl p-5 space-y-3 h-fit" style={cardStyle}>
        <h2 className="font-semibold text-white text-sm flex items-center gap-2"><FontAwesomeIcon icon={faPlus} className="text-blue-400" /> Nouveau modèle</h2>
        <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom (ex : Règlement intérieur)" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none" style={inputStyle} />
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none" style={inputStyle}>
          {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value} className="bg-[#0D1D3A]">{k.label}</option>)}
        </select>
        <textarea value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} placeholder="Texte du document (pour un bon d'accord sans fichier)" rows={4} className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none" style={inputStyle} />
        <div>
          <label className="text-xs text-gray-400 block mb-1">Ou joindre un fichier (PDF / image, max 8 MB)</label>
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-600 file:text-white" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.autoSend} onChange={(e) => setForm({ ...form, autoSend: e.target.checked })} className="accent-blue-600" />
          Envoyer automatiquement à chaque nouvelle réservation
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.requiresAck} onChange={(e) => setForm({ ...form, requiresAck: e.target.checked })} className="accent-blue-600" />
          Bon d&apos;accord — l&apos;élève doit cocher « Lu et accepté » (valeur probante)
        </label>
        {msg && (
          <p className={`text-sm flex items-center gap-2 ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>
            <FontAwesomeIcon icon={msg.type === "ok" ? faCircleCheck : faTriangleExclamation} className="text-xs" />{msg.text}
          </p>
        )}
        <button type="submit" disabled={creating} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg">
          <FontAwesomeIcon icon={creating ? faSpinner : faPlus} className={creating ? "animate-spin" : ""} /> Créer le modèle
        </button>
      </form>

      {/* List */}
      <div className="relative min-h-[120px] space-y-3">
        <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
        {!loading && templates.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={cardStyle}>
            <FontAwesomeIcon icon={faFileLines} className="text-2xl text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">Aucun modèle. Créez-en un pour l&apos;envoyer automatiquement aux stagiaires.</p>
          </div>
        ) : templates.map((t) => (
          <div key={t.id} className="rounded-xl p-4" style={cardStyle}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={t.requiresAck ? faStamp : faFileLines} className={`text-xs ${t.requiresAck ? "text-amber-400" : "text-blue-400"}`} />
                  <span className="text-sm font-semibold text-white truncate">{t.nom}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.autoSend && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">Auto-envoi</span>}
                  {t.requiresAck && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">Bon d&apos;accord</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.actif ? "bg-blue-400/10 text-blue-400" : "bg-gray-400/10 text-gray-400"}`}>{t.actif ? "Actif" : "Inactif"}</span>
                  {t.blobUrl && <a href={t.blobUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300"><FontAwesomeIcon icon={faDownload} /> Fichier</a>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => toggleActif(t)} title={t.actif ? "Désactiver" : "Activer"} className="text-gray-400 hover:text-white">
                  <FontAwesomeIcon icon={t.actif ? faToggleOn : faToggleOff} className={t.actif ? "text-green-400" : ""} />
                </button>
                <button onClick={() => remove(t.id)} title="Supprimer" className="text-gray-400 hover:text-red-400"><FontAwesomeIcon icon={faTrash} className="text-xs" /></button>
              </div>
            </div>
            {t.contenu && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.contenu}</p>}
          </div>
        ))}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5" />
            ))}
          </div>
        )}
        </div>
        <LoadingOverlay show={loading} label="Chargement des modèles..." />
      </div>
    </div>
  );
}

// ─── Onglet Par stagiaire ────────────────────────────────
function StagiairesTab() {
  const [sessions, setSessions] = useState<SessionLite[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [resa, setResa] = useState<Stagiaire | null>(null);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [sendForm, setSendForm] = useState({ nom: "", requiresAck: false });
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/centre/formateur/sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: SessionLite[]) => { setSessions(Array.isArray(d) ? d : []); if (d[0]) setSessionId(d[0].id); });
  }, []);

  const session = sessions.find((s) => s.id === sessionId);

  const loadDocs = useCallback((reservationId: string) => {
    setLoadingDocs(true);
    fetch(`/api/centre/documents?reservationId=${reservationId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .finally(() => setLoadingDocs(false));
  }, []);

  function selectStagiaire(s: Stagiaire) { setResa(s); setMsg(null); loadDocs(s.reservationId); }

  // Validation / refus d'un justificatif transmis par le stagiaire.
  async function verify(doc: DocItem, decision: "ACCEPTE" | "REFUSE") {
    if (!resa) return;
    let motifRefus: string | undefined;
    if (decision === "REFUSE") {
      const saisi = window.prompt(
        `Motif du refus de « ${doc.nom} » ?\nIl sera communiqué au stagiaire pour qu'il puisse renvoyer une pièce conforme.`,
      );
      if (saisi === null) return; // annulé
      if (!saisi.trim()) { setMsg({ type: "err", text: "Le motif est obligatoire pour refuser." }); return; }
      motifRefus = saisi.trim();
    }
    setVerifyingId(doc.id); setMsg(null);
    try {
      const res = await fetch(`/api/centre/documents/${doc.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, motifRefus }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Échec de la vérification." }); return; }
      setMsg({
        type: "ok",
        text: decision === "ACCEPTE" ? "Justificatif validé, le stagiaire est prévenu." : "Justificatif refusé, le stagiaire est prévenu.",
      });
      loadDocs(resa.reservationId);
    } catch {
      setMsg({ type: "err", text: "Erreur réseau." });
    } finally {
      setVerifyingId(null);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!resa) return;
    const f = e.currentTarget as HTMLFormElement;
    const fileInput = f.elements.namedItem("file") as HTMLInputElement;
    if (!sendForm.nom.trim()) { setMsg({ type: "err", text: "Nom du document requis." }); return; }
    if (!fileInput.files?.[0]) { setMsg({ type: "err", text: "Sélectionnez un fichier." }); return; }
    setSending(true); setMsg(null);
    const fd = new FormData();
    fd.append("reservationId", resa.reservationId);
    fd.append("nom", sendForm.nom);
    fd.append("kind", sendForm.requiresAck ? "BON_ACCORD" : "AUTRE");
    fd.append("requiresAck", String(sendForm.requiresAck));
    fd.append("file", fileInput.files[0]);
    try {
      const res = await fetch("/api/centre/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setMsg({ type: "ok", text: "Document envoyé au stagiaire." });
      setSendForm({ nom: "", requiresAck: false });
      fileInput.value = "";
      loadDocs(resa.reservationId);
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally { setSending(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={sessionId} onChange={(e) => { setSessionId(e.target.value); setResa(null); setDocs([]); }} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none" style={inputStyle}>
          {sessions.length === 0 && <option className="bg-[#0D1D3A]">Aucune session</option>}
          {sessions.map((s) => <option key={s.id} value={s.id} className="bg-[#0D1D3A]">{s.formation} — {new Date(s.dateDebut).toLocaleDateString("fr-FR")}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Stagiaires */}
        <div className="rounded-xl p-4" style={cardStyle}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stagiaires</p>
          {!session || session.stagiaires.length === 0 ? (
            <p className="text-xs text-gray-500">Aucun stagiaire confirmé.</p>
          ) : (
            <div className="space-y-1.5">
              {session.stagiaires.map((s) => (
                <button key={s.reservationId} onClick={() => selectStagiaire(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${resa?.reservationId === s.reservationId ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/5"}`}>
                  {s.prenom} {s.nom}
                  <span className="block text-[10px] opacity-70">{s.numero}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documents + envoi */}
        <div className="lg:col-span-2 rounded-xl p-4" style={cardStyle}>
          {!resa ? (
            <p className="text-sm text-gray-500">Sélectionnez un stagiaire pour voir et envoyer des documents.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-white mb-3">{resa.prenom} {resa.nom}</p>
              {msg && <p className={`text-sm mb-3 flex items-center gap-2 ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}><FontAwesomeIcon icon={msg.type === "ok" ? faCircleCheck : faTriangleExclamation} className="text-xs" />{msg.text}</p>}

              <form onSubmit={send} className="flex flex-col gap-2 mb-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs font-semibold text-gray-400 flex items-center gap-2"><FontAwesomeIcon icon={faPaperPlane} className="text-blue-400" /> Envoyer un document</p>
                <input value={sendForm.nom} onChange={(e) => setSendForm({ ...sendForm, nom: e.target.value })} placeholder="Nom du document" className="px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none" style={inputStyle} />
                <input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-600 file:text-white" />
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={sendForm.requiresAck} onChange={(e) => setSendForm({ ...sendForm, requiresAck: e.target.checked })} className="accent-blue-600" />
                  Bon d&apos;accord (l&apos;élève doit accepter)
                </label>
                <button type="submit" disabled={sending} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg">
                  <FontAwesomeIcon icon={sending ? faSpinner : faPaperPlane} className={sending ? "animate-spin" : ""} /> Envoyer
                </button>
              </form>

              <div className="relative min-h-[80px]">
                <div className={loadingDocs ? "opacity-40 pointer-events-none select-none" : ""}>
                <div className="space-y-2">
                  {docs.length === 0 && <p className="text-xs text-gray-500">Aucun document échangé.</p>}
                  {docs.map((d) => {
                    const recu = d.direction === "ELEVE_VERS_CENTRE";
                    const href = d.blobUrl ?? (d.kind === "EMARGEMENT" && resa ? `/api/emargement/${resa.reservationId}` : null);
                    // Un justificatif reçu, non purgé, est à contrôler par le centre.
                    const aVerifier = recu && !d.purgedAt && JUSTIFICATIF_KINDS.includes(d.kind);
                    const enCours = verifyingId === d.id;

                    let statut: string;
                    if (d.purgedAt) statut = "supprimé (RGPD)";
                    else if (recu && d.verifiedAt && d.status === "ACCEPTE") statut = "validé";
                    else if (recu && d.verifiedAt && d.status === "REFUSE") statut = "refusé";
                    else if (recu) statut = "à vérifier";
                    else statut = d.status === "ACCEPTE" ? "envoyé · accepté" : "envoyé";

                    const statutColor = d.purgedAt
                      ? "text-gray-500"
                      : statut === "validé" ? "text-green-400"
                      : statut === "refusé" ? "text-red-400"
                      : statut === "à vérifier" ? "text-amber-400"
                      : "text-gray-500";

                    return (
                      <div key={d.id} className="p-2.5 rounded-lg" style={cardStyle}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={d.purgedAt ? faShieldHalved : recu ? faFileArrowUp : faFileArrowDown}
                              className={`text-xs shrink-0 ${d.purgedAt ? "text-gray-500" : recu ? "text-amber-400" : "text-green-400"}`}
                            />
                            <div className="min-w-0">
                              <span className="text-sm text-white truncate block">{d.nom}</span>
                              <span className={`text-[10px] ${statutColor}`}>
                                {recu ? "Reçu de l'élève" : "Envoyé"} · {statut}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {aVerifier && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => verify(d, "ACCEPTE")}
                                  disabled={enCours || d.status === "ACCEPTE"}
                                  title="Valider ce justificatif"
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-green-600/20 text-green-300 hover:bg-green-600/30 disabled:opacity-40"
                                >
                                  <FontAwesomeIcon icon={enCours ? faSpinner : faCheck} className={enCours ? "animate-spin" : ""} /> Valider
                                </button>
                                <button
                                  type="button"
                                  onClick={() => verify(d, "REFUSE")}
                                  disabled={enCours}
                                  title="Refuser ce justificatif"
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/30 disabled:opacity-40"
                                >
                                  <FontAwesomeIcon icon={faXmark} /> Refuser
                                </button>
                              </>
                            )}
                            {href && (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs px-1">
                                <FontAwesomeIcon icon={faDownload} />
                              </a>
                            )}
                          </div>
                        </div>
                        {d.motifRefus && (
                          <p className="mt-1.5 text-[11px] text-red-300/90 pl-6">Motif du refus : {d.motifRefus}</p>
                        )}
                        {d.purgedAt && (
                          <p className="mt-1.5 text-[11px] text-gray-500 pl-6">
                            Fichier détruit le {new Date(d.purgedAt).toLocaleDateString("fr-FR")} — conservation légale de 45 jours écoulée.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {loadingDocs && (
                  <div className="space-y-2 animate-pulse mt-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/5" />
                    ))}
                  </div>
                )}
                </div>
                <LoadingOverlay show={loadingDocs} label="Chargement des documents..." />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
