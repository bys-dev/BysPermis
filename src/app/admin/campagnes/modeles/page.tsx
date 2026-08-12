"use client";

/**
 * Bibliothèque de modèles d'email de prospection.
 *
 * Le staff y crée, retouche, duplique et archive librement ses messages types.
 * Aucune campagne n'est affectée par ces modifications : un modèle est copié
 * dans la campagne au moment où on le charge, et la campagne vit ensuite seule.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faPlus,
  faSpinner,
  faPenToSquare,
  faCopy,
  faBoxArchive,
  faBoxOpen,
  faTrash,
  faTriangleExclamation,
  faCircleCheck,
  faRotateLeft,
  faArrowLeft,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import ModeleEditor, { FORM_VIDE, formDepuisModele, type ModeleForm } from "./ModeleEditor";
import type { Modele, Variable } from "../types";

export default function AdminModelesPage() {
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [avecArchives, setAvecArchives] = useState(false);
  const [editeur, setEditeur] = useState<ModeleForm | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/prospects/modeles${avecArchives ? "?archives=1" : ""}`);
      if (!res.ok) throw new Error("chargement");
      const data = await res.json();
      setModeles(data.modeles ?? []);
      setVariables(data.variables ?? []);
    } catch {
      setErreur("Impossible de charger la bibliothèque.");
    } finally {
      setLoading(false);
    }
  }, [avecArchives]);

  useEffect(() => {
    charger();
  }, [charger]);

  const agir = async (
    id: string,
    requete: { url: string; method: string; body?: unknown },
    succes: string,
  ) => {
    setActionId(id);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(requete.url, {
        method: requete.method,
        ...(requete.body !== undefined
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(requete.body) }
          : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data?.error ?? "Action impossible.");
        return;
      }
      setMessage(data?.message ?? succes);
      await charger();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setActionId(null);
    }
  };

  const archiver = (m: Modele) =>
    agir(
      m.id,
      { url: `/api/admin/prospects/modeles/${m.id}`, method: "PATCH", body: { isArchive: !m.isArchive } },
      m.isArchive ? "Modèle réactivé." : "Modèle archivé.",
    );

  const dupliquer = (m: Modele) =>
    agir(m.id, { url: `/api/admin/prospects/modeles/${m.id}/dupliquer`, method: "POST" }, "Copie créée.");

  const supprimer = (m: Modele) => {
    if (!window.confirm(`Supprimer définitivement le modèle « ${m.nom} » ?`)) return;
    return agir(m.id, { url: `/api/admin/prospects/modeles/${m.id}`, method: "DELETE" }, "Modèle supprimé.");
  };

  const restaurerBase = () =>
    agir("__base__", { url: "/api/admin/prospects/modeles", method: "PUT" }, "Catalogue restauré.");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/campagnes"
            className="text-gray-400 text-xs hover:text-white transition-colors inline-flex items-center gap-1.5 mb-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Retour aux campagnes
          </Link>
          <h1 className="text-white font-display font-bold text-2xl flex items-center gap-3">
            <FontAwesomeIcon icon={faLayerGroup} className="text-blue-400" />
            Modèles d&apos;email
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Messages types réutilisables. Charger un modèle remplit la campagne — le texte reste
            ensuite modifiable sans toucher au modèle.
          </p>
        </div>
        {!editeur && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={restaurerBase}
              disabled={actionId === "__base__"}
              title="Réinstalle les modèles livrés avec la plateforme qui auraient été supprimés"
              className="px-4 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm font-semibold hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors inline-flex items-center gap-2"
            >
              {actionId === "__base__" ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faRotateLeft} />
              )}
              Restaurer les modèles de base
            </button>
            <button
              onClick={() => setEditeur(FORM_VIDE)}
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Nouveau modèle
            </button>
          </div>
        )}
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
        <ModeleEditor
          initial={editeur}
          variables={variables}
          onSaved={() => {
            setEditeur(null);
            setMessage("Modèle enregistré.");
            charger();
          }}
          onCancel={() => setEditeur(null)}
        />
      )}

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={avecArchives}
          onChange={(e) => setAvecArchives(e.target.checked)}
          className="rounded border-white/20 bg-white/5"
        />
        <span className="text-gray-300 text-xs">Afficher aussi les modèles archivés</span>
      </label>

      {loading ? (
        <div className="p-12 text-center rounded-xl border border-white/10" style={{ background: "#0D1D3A" }}>
          <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 text-2xl" />
        </div>
      ) : modeles.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-white/10" style={{ background: "#0D1D3A" }}>
          <FontAwesomeIcon icon={faLayerGroup} className="text-gray-600 text-3xl mb-3" />
          <p className="text-gray-400 text-sm">
            Aucun modèle. Créez-en un, ou restaurez le catalogue livré avec la plateforme.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modeles.map((m) => {
            const occupe = actionId === m.id;
            return (
              <div
                key={m.id}
                className={`rounded-xl border p-4 flex flex-col gap-3 ${
                  m.isArchive ? "border-white/5 opacity-60" : "border-white/10"
                }`}
                style={{ background: "#0D1D3A" }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-semibold text-sm">{m.nom}</p>
                    {occupe && <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 text-xs mt-1" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {m.slug && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px]">
                        livré
                      </span>
                    )}
                    {m.isArchive && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-500 text-[10px]">
                        archivé
                      </span>
                    )}
                    {m.delaiJours != null && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} /> J+{m.delaiJours}
                      </span>
                    )}
                  </div>
                  {m.moment && <p className="text-gray-500 text-[11px] mt-1.5">{m.moment}</p>}
                </div>

                {m.objectif && <p className="text-gray-400 text-xs leading-relaxed">{m.objectif}</p>}

                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wide">Objet</p>
                  <p className="text-gray-300 text-[11px] mt-0.5 break-words">{m.sujet}</p>
                </div>

                <div className="flex items-center gap-1.5 mt-auto pt-1">
                  <button
                    onClick={() => setEditeur(formDepuisModele(m))}
                    disabled={occupe}
                    title="Modifier"
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    onClick={() => dupliquer(m)}
                    disabled={occupe}
                    title="Dupliquer"
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </button>
                  <button
                    onClick={() => archiver(m)}
                    disabled={occupe}
                    title={m.isArchive ? "Réactiver" : "Archiver"}
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={m.isArchive ? faBoxOpen : faBoxArchive} />
                  </button>
                  <button
                    onClick={() => supprimer(m)}
                    disabled={occupe}
                    title="Supprimer"
                    className="ml-auto px-2.5 py-1.5 rounded-lg border border-white/15 text-gray-400 text-xs hover:border-red-500 hover:text-red-300 disabled:opacity-40 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
