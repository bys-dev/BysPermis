"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
  faUpload, faSpinner, faTrash, faDownload, faCircleCheck,
  faFileArrowUp, faFileArrowDown, faStamp, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

interface ReservationLite {
  id: string;
  numero: string;
  session: { formation: { titre: string } };
}

interface DocItem {
  id: string;
  kind: string;
  direction: "CENTRE_VERS_ELEVE" | "ELEVE_VERS_CENTRE";
  nom: string;
  blobUrl: string | null;
  contenu: string | null;
  status: "ENVOYE" | "LU" | "ACCEPTE" | "REFUSE";
  requiresAck: boolean;
  acceptedAt: string | null;
  acceptedNom: string | null;
  createdAt: string;
  /** Contrôle du justificatif par le centre (documents ELEVE_VERS_CENTRE). */
  verifiedAt: string | null;
  motifRefus: string | null;
  /** Purge RGPD : fichier détruit 45 jours après la fin du stage. */
  purgedAt: string | null;
}

const ELEVE_KINDS = [
  { value: "PERMIS", label: "Permis de conduire" },
  { value: "PIECE_IDENTITE", label: "Pièce d'identité" },
  { value: "LETTRE_48N", label: "Lettre 48N" },
  { value: "AUTRE", label: "Autre document" },
];

export default function EleveDocumentExchange({ reservations }: { reservations: ReservationLite[] }) {
  const [selectedId, setSelectedId] = useState<string>(reservations[0]?.id ?? "");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState("PERMIS");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [ackName, setAckName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/eleve/documents?reservationId=${selectedId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) { setMsg({ type: "err", text: "Sélectionnez un fichier." }); return; }
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("reservationId", selectedId);
    fd.append("kind", kind);
    try {
      const res = await fetch("/api/eleve/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi");
      setMsg({ type: "ok", text: "Document envoyé au centre." });
      fileInput.value = "";
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/eleve/documents/${id}`, { method: "DELETE" });
      if (res.ok) setDocs((p) => p.filter((d) => d.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAccept(id: string) {
    if (ackName.trim().length < 2) { setMsg({ type: "err", text: "Saisissez votre nom pour accepter." }); return; }
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/eleve/documents/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: ackName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setMsg({ type: "ok", text: "Document accepté. Une copie PDF vous a été envoyée." });
      setAckName("");
      load();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusyId(null);
    }
  }

  const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" };
  const recus = docs.filter((d) => d.direction === "CENTRE_VERS_ELEVE");
  const envois = docs.filter((d) => d.direction === "ELEVE_VERS_CENTRE");

  if (reservations.length === 0) return null;

  return (
    <div className="mb-10 rounded-xl p-5 sm:p-6" style={cardStyle}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="font-semibold text-white text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faStamp} className="text-blue-400" />
          Échange de documents avec le centre
        </h2>
        {reservations.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
            style={cardStyle}
          >
            {reservations.map((r) => (
              <option key={r.id} value={r.id} className="bg-[#0D1D3A]">
                {r.session.formation.titre} — {r.numero}
              </option>
            ))}
          </select>
        )}
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === "ok" ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
          <FontAwesomeIcon icon={msg.type === "ok" ? faCircleCheck : faTriangleExclamation} className="text-xs" />
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mes envois */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faFileArrowUp} className="text-blue-400" /> Documents à transmettre
          </p>
          <form onSubmit={handleUpload} className="flex flex-col gap-2 mb-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none" style={cardStyle}>
              {ELEVE_KINDS.map((k) => <option key={k.value} value={k.value} className="bg-[#0D1D3A]">{k.label}</option>)}
            </select>
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-600 file:text-white" />
            <button type="submit" disabled={uploading} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
              <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} className={uploading ? "animate-spin" : ""} />
              {uploading ? "Envoi…" : "Envoyer au centre"}
            </button>
            <p className="text-[11px] text-gray-500">JPEG, PNG, WEBP ou PDF — max 8 MB. Ex : photo recto/verso de votre permis.</p>
          </form>

          <div className="space-y-2">
            {envois.length === 0 && <p className="text-xs text-gray-500">Aucun document transmis.</p>}
            {envois.map((d) => {
              const valide = d.verifiedAt && d.status === "ACCEPTE";
              const refuse = d.verifiedAt && d.status === "REFUSE";
              return (
                <div key={d.id} className="p-2.5 rounded-lg" style={cardStyle}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileArrowUp} className="text-gray-400 text-xs shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-white truncate block">{d.nom}</span>
                        <span
                          className={`text-[10px] ${
                            d.purgedAt ? "text-gray-500"
                              : valide ? "text-green-400"
                              : refuse ? "text-red-400"
                              : "text-amber-400"
                          }`}
                        >
                          {d.purgedAt ? "Supprimé (délai légal écoulé)"
                            : valide ? "Validé par le centre"
                            : refuse ? "Refusé — à renvoyer"
                            : "En attente de vérification"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.blobUrl && <a href={d.blobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs"><FontAwesomeIcon icon={faDownload} /></a>}
                      {/* Un justificatif déjà validé ou purgé ne doit plus être supprimé par l'élève. */}
                      {!valide && !d.purgedAt && (
                        <button onClick={() => handleDelete(d.id)} disabled={busyId === d.id} className="text-gray-400 hover:text-red-400 text-xs">
                          <FontAwesomeIcon icon={busyId === d.id ? faSpinner : faTrash} className={busyId === d.id ? "animate-spin" : ""} />
                        </button>
                      )}
                    </div>
                  </div>
                  {refuse && d.motifRefus && (
                    <p className="mt-1.5 text-[11px] text-red-300/90 pl-6">Motif : {d.motifRefus}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents reçus */}
        <div className="relative min-h-[80px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faFileArrowDown} className="text-green-400" /> Documents reçus du centre
          </p>
          <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
          {!loading && recus.length === 0 ? (
            <p className="text-xs text-gray-500">Aucun document reçu pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recus.map((d) => {
                const isEmargement = d.kind === "EMARGEMENT";
                const href = d.blobUrl ?? (isEmargement ? `/api/emargement/${selectedId}` : null);
                const needsAck = d.requiresAck && d.status !== "ACCEPTE";
                return (
                  <div key={d.id} className="p-3 rounded-lg" style={cardStyle}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <FontAwesomeIcon icon={d.requiresAck ? faStamp : faFileArrowDown} className={`text-xs shrink-0 ${d.requiresAck ? "text-amber-400" : "text-green-400"}`} />
                        <span className="text-sm text-white truncate">{d.nom}</span>
                      </div>
                      {href && (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs shrink-0">
                          <FontAwesomeIcon icon={faDownload} /> PDF
                        </a>
                      )}
                    </div>
                    {d.contenu && <p className="text-xs text-gray-400 mt-2 whitespace-pre-line line-clamp-4">{d.contenu}</p>}
                    {d.status === "ACCEPTE" && (
                      <p className="text-[11px] text-green-400 mt-2 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCircleCheck} /> Accepté{d.acceptedAt ? ` le ${new Date(d.acceptedAt).toLocaleDateString("fr-FR")}` : ""}
                      </p>
                    )}
                    {needsAck && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <p className="text-[11px] text-amber-300 mb-2">Document à valider — saisissez votre nom puis cliquez sur « Lu et accepté ».</p>
                        <div className="flex gap-2">
                          <input
                            value={ackName}
                            onChange={(e) => setAckName(e.target.value)}
                            placeholder="Nom Prénom"
                            className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none"
                            style={cardStyle}
                          />
                          <button onClick={() => handleAccept(d.id)} disabled={busyId === d.id} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
                            <FontAwesomeIcon icon={busyId === d.id ? faSpinner : faCircleCheck} className={busyId === d.id ? "animate-spin" : ""} />
                            Lu et accepté
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {loading && (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5" />
              ))}
            </div>
          )}
          </div>
          <LoadingOverlay show={loading} label="Chargement des documents..." />
        </div>
      </div>
    </div>
  );
}
