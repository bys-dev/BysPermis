"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faPlus,
  faSpinner,
  faPause,
  faPlay,
  faTrash,
  faPenToSquare,
  faTriangleExclamation,
  faCircleCheck,
  faEnvelopeOpenText,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import CampaignEditor, { nouvelleCampagne } from "./CampaignEditor";
import type { CampagneForm, Variable } from "./types";

type CampagneStatut = "BROUILLON" | "PROGRAMMEE" | "EN_COURS" | "ENVOYEE" | "PAUSEE" | "ANNULEE";

interface Campagne {
  id: string;
  nom: string;
  sujet: string;
  statut: CampagneStatut;
  totalCibles: number;
  nbEnvoyes: number;
  nbEchecs: number;
  nbOuvertures: number;
  nbClics: number;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  createdBy: { prenom: string; nom: string } | null;
}

const STATUT_BADGE: Record<CampagneStatut, string> = {
  BROUILLON: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  PROGRAMMEE: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  EN_COURS: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ENVOYEE: "bg-green-500/15 text-green-300 border-green-500/30",
  PAUSEE: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  ANNULEE: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUT_LABEL: Record<CampagneStatut, string> = {
  BROUILLON: "Brouillon",
  PROGRAMMEE: "Programmée",
  EN_COURS: "Envoi en cours",
  ENVOYEE: "Terminée",
  PAUSEE: "En pause",
  ANNULEE: "Annulée",
};

export default function AdminCampagnesPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editeur, setEditeur] = useState<CampagneForm | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campagnes");
      if (!res.ok) throw new Error("chargement");
      const data = await res.json();
      setCampagnes(data.campagnes ?? []);
      setVariables(data.variables ?? []);
    } catch {
      setErreur("Impossible de charger les campagnes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  /**
   * Reprise d'une sélection venue de l'écran Prospects (« Contacter la
   * sélection ») : les fiches cochées arrivent en paramètre d'URL et ouvrent
   * directement une campagne en ciblage nominatif.
   */
  useEffect(() => {
    const ids = new URLSearchParams(window.location.search)
      .get("selection")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids?.length) return;
    setEditeur(nouvelleCampagne({ mode: "SELECTION", prospectIds: ids }));
    // Nettoyage de l'URL : un rafraîchissement ne doit pas rouvrir l'éditeur.
    window.history.replaceState({}, "", "/admin/campagnes");
  }, []);

  /**
   * Lancement de l'envoi.
   *
   * Le serveur répond 409 + `confirmationRequise` au premier appel : on affiche
   * alors la volumétrie réelle et on ne relance qu'après accord explicite.
   * C'est le garde-fou contre un envoi massif déclenché par un clic malheureux.
   */
  const envoyer = async (campagne: Campagne, confirmer = false) => {
    setActionId(campagne.id);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/campagnes/${campagne.id}/envoyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmer }),
      });
      const data = await res.json();

      if (res.status === 409 && data?.confirmationRequise) {
        const ok = window.confirm(
          `${data.totalCibles} centre(s) vont recevoir « ${campagne.nom} ».\n\n` +
            `Les emails partent par lots et ne peuvent pas être rappelés. Confirmer l'envoi ?`,
        );
        if (ok) await envoyer(campagne, true);
        return;
      }

      if (!res.ok) {
        setErreur(data?.error ?? "L'envoi a échoué.");
        return;
      }
      setMessage(data.message ?? "Envoi lancé.");
      await charger();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setActionId(null);
    }
  };

  const piloter = async (id: string, action: "pause" | "reprendre" | "annuler") => {
    if (action === "annuler" && !window.confirm("Annuler cette campagne ? Les envois restants ne partiront pas.")) {
      return;
    }
    setActionId(id);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/campagnes/${id}/statut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Action impossible.");
        return;
      }
      setMessage(data.message ?? null);
      await charger();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setActionId(null);
    }
  };

  const supprimer = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette campagne et son historique d'envois ?")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/campagnes/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data?.error ?? "Suppression impossible.");
        return;
      }
      await charger();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setActionId(null);
    }
  };

  const modifier = async (id: string) => {
    setErreur(null);
    try {
      const res = await fetch(`/api/admin/campagnes/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Chargement impossible.");
        return;
      }
      const c = data.campagne;
      setEditeur({
        id: c.id,
        nom: c.nom,
        sujet: c.sujet,
        contenu: c.contenu,
        fromName: c.fromName ?? "",
        replyTo: c.replyTo ?? "",
        filtre: c.filtre ?? {},
      });
    } catch {
      setErreur("Impossible de contacter le serveur.");
    }
  };

  const tauxOuverture = (c: Campagne) =>
    c.nbEnvoyes > 0 ? Math.round((c.nbOuvertures / c.nbEnvoyes) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-display font-bold text-2xl flex items-center gap-3">
            <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-blue-400" />
            Campagnes de prospection
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Emails personnalisés envoyés aux centres du fichier de prospects.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/campagnes/modeles"
            className="px-4 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm font-semibold hover:border-blue-500 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faLayerGroup} /> Modèles d&apos;email
          </Link>
          {!editeur && (
            <button
              onClick={() => setEditeur(nouvelleCampagne())}
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Nouvelle campagne
            </button>
          )}
        </div>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 mt-0.5 text-sm" />
          <p className="text-red-300 text-xs">{erreur}</p>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 flex items-start gap-2">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 mt-0.5 text-sm" />
          <p className="text-green-300 text-xs">{message}</p>
        </div>
      )}

      {editeur && (
        <CampaignEditor
          initial={editeur}
          variables={variables}
          onSaved={charger}
          onCancel={() => setEditeur(null)}
        />
      )}

      {/* ── Liste ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0D1D3A" }}>
        {loading ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 text-2xl" />
          </div>
        ) : campagnes.length === 0 ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-gray-600 text-3xl mb-3" />
            <p className="text-gray-400 text-sm">
              Aucune campagne. Créez-en une pour démarcher les centres importés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-gray-400 text-left text-xs">
                  <th className="px-4 py-3 font-medium">Campagne</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Progression</th>
                  <th className="px-4 py-3 font-medium">Résultats</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campagnes.map((c) => {
                  const occupe = actionId === c.id;
                  return (
                    <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{c.nom}</p>
                        <p className="text-gray-500 text-xs truncate max-w-xs" title={c.sujet}>
                          {c.sujet}
                        </p>
                        {c.createdBy && (
                          <p className="text-gray-600 text-[11px] mt-0.5">
                            {c.createdBy.prenom} {c.createdBy.nom} ·{" "}
                            {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-md border text-xs font-medium ${STATUT_BADGE[c.statut]}`}
                        >
                          {STATUT_LABEL[c.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-xs">
                          {c.nbEnvoyes} / {c.totalCibles} envoyé(s)
                        </p>
                        {c.totalCibles > 0 && (
                          <div className="w-28 h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.round((c.nbEnvoyes / c.totalCibles) * 100))}%`,
                              }}
                            />
                          </div>
                        )}
                        {c.nbEchecs > 0 && (
                          <p className="text-orange-400 text-[11px] mt-1">{c.nbEchecs} échec(s)</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="text-gray-300">
                          {c.nbOuvertures} ouverture(s)
                          {c.nbEnvoyes > 0 && (
                            <span className="text-gray-500"> · {tauxOuverture(c)} %</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-[11px]">{c.nbClics} clic(s)</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {occupe && <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 mr-1" />}

                          {(c.statut === "BROUILLON" || c.statut === "PROGRAMMEE" || c.statut === "EN_COURS") && (
                            <button
                              onClick={() => envoyer(c)}
                              disabled={occupe}
                              title={c.statut === "EN_COURS" ? "Envoyer le lot suivant" : "Lancer l'envoi"}
                              className="px-2.5 py-1.5 rounded-lg bg-green-600/20 border border-green-500/40 text-green-300 text-xs hover:bg-green-600/30 disabled:opacity-40 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                          )}

                          {(c.statut === "EN_COURS" || c.statut === "PROGRAMMEE") && (
                            <button
                              onClick={() => piloter(c.id, "pause")}
                              disabled={occupe}
                              title="Mettre en pause"
                              className="px-2.5 py-1.5 rounded-lg bg-orange-600/20 border border-orange-500/40 text-orange-300 text-xs hover:bg-orange-600/30 disabled:opacity-40 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPause} />
                            </button>
                          )}

                          {c.statut === "PAUSEE" && (
                            <button
                              onClick={() => piloter(c.id, "reprendre")}
                              disabled={occupe}
                              title="Reprendre"
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs hover:bg-blue-600/30 disabled:opacity-40 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPlay} />
                            </button>
                          )}

                          {["BROUILLON", "PROGRAMMEE", "PAUSEE"].includes(c.statut) && (
                            <button
                              onClick={() => modifier(c.id)}
                              disabled={occupe}
                              title="Modifier"
                              className="px-2.5 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                          )}

                          {c.statut !== "EN_COURS" && (
                            <button
                              onClick={() => supprimer(c.id)}
                              disabled={occupe}
                              title="Supprimer"
                              className="px-2.5 py-1.5 rounded-lg border border-white/15 text-gray-400 text-xs hover:border-red-500 hover:text-red-300 disabled:opacity-40 transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-[11px]">
        Chaque centre reçoit un message qui lui est propre — aucune adresse n&apos;est en copie.
        Les envois sont étalés par lots de 100 : une campagne volumineuse se poursuit
        automatiquement en tâche de fond (cron toutes les 5 minutes) pour préserver la
        délivrabilité du domaine.
      </p>
    </div>
  );
}
