"use client";

/**
 * Édition d'un modèle de la bibliothèque.
 *
 * Même moteur de variables et même aperçu que l'éditeur de campagne : ce qu'on
 * voit ici est exactement ce que produira la campagne construite à partir du
 * modèle, habillage et pied de page compris.
 */

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faFloppyDisk,
  faEye,
  faCode,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { STATUTS_CIBLABLES, inputClass, type Modele, type Statut, type Variable } from "../types";

export interface ModeleForm {
  id?: string;
  nom: string;
  moment: string;
  objectif: string;
  sujet: string;
  contenu: string;
  fromName: string;
  replyTo: string;
  statuts: Statut[];
  exclureDejaContactes: boolean;
  delaiJours: string;
}

export function formDepuisModele(m: Modele): ModeleForm {
  return {
    id: m.id,
    nom: m.nom,
    moment: m.moment ?? "",
    objectif: m.objectif ?? "",
    sujet: m.sujet,
    contenu: m.contenu,
    fromName: m.fromName ?? "",
    replyTo: m.replyTo ?? "",
    statuts: (m.filtreSuggere?.statuts ?? []) as Statut[],
    exclureDejaContactes: m.filtreSuggere?.exclureDejaContactes ?? false,
    delaiJours: m.delaiJours != null ? String(m.delaiJours) : "",
  };
}

export const FORM_VIDE: ModeleForm = {
  nom: "",
  moment: "",
  objectif: "",
  sujet: "",
  contenu: "<p>{{salutation}}</p>\n\n<p></p>\n\n<p>Bien cordialement,</p>",
  fromName: "",
  replyTo: "",
  statuts: [],
  exclureDejaContactes: false,
  delaiJours: "",
};

export default function ModeleEditor({
  initial,
  variables,
  onSaved,
  onCancel,
}: {
  initial: ModeleForm;
  variables: Variable[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ModeleForm>(initial);
  const [enregistrement, setEnregistrement] = useState(false);
  const [apercu, setApercu] = useState<{ sujet: string; html: string; vides: string[] } | null>(null);
  const [chargementApercu, setChargementApercu] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const contenuRef = useRef<HTMLTextAreaElement>(null);

  const insererVariable = (cle: string) => {
    const textarea = contenuRef.current;
    const jeton = `{{${cle}}}`;
    if (!textarea) {
      setForm((f) => ({ ...f, contenu: f.contenu + jeton }));
      return;
    }
    const debut = textarea.selectionStart ?? textarea.value.length;
    const fin = textarea.selectionEnd ?? debut;
    setForm((f) => ({ ...f, contenu: f.contenu.slice(0, debut) + jeton + f.contenu.slice(fin) }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(debut + jeton.length, debut + jeton.length);
    });
  };

  const voirApercu = async () => {
    setChargementApercu(true);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/campagnes/apercu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sujet: form.sujet, contenu: form.contenu, fromName: form.fromName || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Aperçu impossible.");
        return;
      }
      if (data.validation?.errors?.length) setErreur(data.validation.errors.join(" "));
      setApercu({ sujet: data.sujet, html: data.html, vides: data.variablesVides ?? [] });
    } catch {
      setErreur("Impossible de générer l'aperçu.");
    } finally {
      setChargementApercu(false);
    }
  };

  const enregistrer = async () => {
    setEnregistrement(true);
    setErreur(null);
    try {
      const filtreSuggere =
        form.statuts.length || form.exclureDejaContactes
          ? {
              statuts: form.statuts.length ? form.statuts : undefined,
              exclureDejaContactes: form.exclureDejaContactes || undefined,
            }
          : null;

      const payload = {
        nom: form.nom,
        moment: form.moment || null,
        objectif: form.objectif || null,
        sujet: form.sujet,
        contenu: form.contenu,
        fromName: form.fromName || null,
        replyTo: form.replyTo || null,
        filtreSuggere,
        delaiJours: form.delaiJours ? Number(form.delaiJours) : null,
      };

      const res = await fetch(
        form.id ? `/api/admin/prospects/modeles/${form.id}` : "/api/admin/prospects/modeles",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Enregistrement impossible.");
        return;
      }
      onSaved();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnregistrement(false);
    }
  };

  const basculerStatut = (statut: Statut) =>
    setForm((f) => ({
      ...f,
      statuts: f.statuts.includes(statut) ? f.statuts.filter((s) => s !== statut) : [...f.statuts, statut],
    }));

  return (
    <div className="rounded-xl border border-white/10 p-6 space-y-5" style={{ background: "#0D1D3A" }}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-white font-semibold text-lg">
          {form.id ? "Modifier le modèle" : "Nouveau modèle"}
        </h2>
        <button onClick={onCancel} className="text-gray-400 text-sm hover:text-white transition-colors">
          Fermer
        </button>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 mt-0.5 text-sm" />
          <p className="text-red-300 text-xs">{erreur}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Nom du modèle *</label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            placeholder="Relance J+7"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Moment de la séquence <span className="text-gray-600">(indicatif)</span>
          </label>
          <input
            type="text"
            value={form.moment}
            onChange={(e) => setForm((f) => ({ ...f, moment: e.target.value }))}
            placeholder="Étape 2 — 7 jours après le premier contact"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Objectif du message</label>
        <input
          type="text"
          value={form.objectif}
          onChange={(e) => setForm((f) => ({ ...f, objectif: e.target.value }))}
          placeholder="Rappeler l'offre en trois lignes et obtenir une réponse."
          className={inputClass}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Expéditeur par défaut</label>
          <input
            type="text"
            value={form.fromName}
            onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
            placeholder="BYS Permis"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Adresse de réponse</label>
          <input
            type="email"
            value={form.replyTo}
            onChange={(e) => setForm((f) => ({ ...f, replyTo: e.target.value }))}
            placeholder="contact@byspermis.fr"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Délai conseillé <span className="text-gray-600">(jours)</span>
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={form.delaiJours}
            onChange={(e) => setForm((f) => ({ ...f, delaiJours: e.target.value }))}
            placeholder="7"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Objet de l&apos;email *</label>
        <input
          type="text"
          value={form.sujet}
          onChange={(e) => setForm((f) => ({ ...f, sujet: e.target.value }))}
          placeholder="{{nom}} — remplissez vos stages de récupération de points"
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-gray-400 text-xs">Contenu (HTML) *</label>
          <span className="text-gray-600 text-[11px]">
            <FontAwesomeIcon icon={faCode} className="mr-1" />
            Repli : <code className="text-gray-400">{"{{ville|votre secteur}}"}</code>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {variables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insererVariable(v.key)}
              title={`${v.label} — ex. ${v.example}`}
              className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[11px] hover:border-blue-500 hover:text-white transition-colors"
            >
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
        <textarea
          ref={contenuRef}
          value={form.contenu}
          onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))}
          rows={16}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
        />
      </div>

      {/* ── Ciblage conseillé ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <p className="text-white text-sm font-semibold">Ciblage conseillé</p>
        <p className="text-gray-500 text-[11px]">
          Pré-rempli quand on charge le modèle dans une campagne — jamais imposé.
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUTS_CIBLABLES.map((s) => {
            const actif = form.statuts.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => basculerStatut(s.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  actif
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.exclureDejaContactes}
            onChange={(e) => setForm((f) => ({ ...f, exclureDejaContactes: e.target.checked }))}
            className="rounded border-white/20 bg-white/5"
          />
          <span className="text-gray-300 text-xs">Réserver aux centres jamais contactés</span>
        </label>
      </div>

      {apercu && (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
            <p className="text-gray-400 text-[11px]">Objet</p>
            <p className="text-white text-sm font-medium">{apercu.sujet || "(vide)"}</p>
            {apercu.vides.length > 0 && (
              <p className="text-orange-300 text-[11px] mt-1">
                Variables vides pour ce prospect : {apercu.vides.map((v) => `{{${v}}}`).join(", ")}.
              </p>
            )}
          </div>
          <div className="bg-white p-4 max-h-96 overflow-y-auto">
            {/* Habillage produit par notre gabarit, valeurs échappées côté serveur. */}
            <div dangerouslySetInnerHTML={{ __html: apercu.html }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={enregistrer}
          disabled={enregistrement || !form.nom.trim() || !form.sujet.trim() || !form.contenu.trim()}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {enregistrement ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faFloppyDisk} />}
          {form.id ? "Enregistrer" : "Créer le modèle"}
        </button>
        <button
          onClick={voirApercu}
          disabled={chargementApercu}
          className="px-5 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm font-semibold hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          {chargementApercu ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faEye} />}
          Aperçu
        </button>
      </div>
    </div>
  );
}
