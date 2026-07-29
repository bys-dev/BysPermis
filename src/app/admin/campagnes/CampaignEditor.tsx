"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faEye,
  faPaperPlane,
  faFloppyDisk,
  faUsers,
  faTriangleExclamation,
  faCircleCheck,
  faCode,
} from "@fortawesome/free-solid-svg-icons";

// ─── Types ───────────────────────────────────────────────

type Statut =
  | "NOUVEAU"
  | "A_CONTACTER"
  | "CONTACTE"
  | "RELANCE"
  | "INTERESSE"
  | "INSCRIT"
  | "REFUSE"
  | "INJOIGNABLE"
  | "DESABONNE";

export interface AudienceFilter {
  statuts?: Statut[];
  departements?: string[];
  sources?: string[];
  exclureDejaContactes?: boolean;
  exclureCampagneIds?: string[];
}

export interface CampagneForm {
  id?: string;
  nom: string;
  sujet: string;
  contenu: string;
  fromName: string;
  replyTo: string;
  filtre: AudienceFilter;
}

interface Variable {
  key: string;
  label: string;
  example: string;
}

interface Facettes {
  departements: { valeur: string; nb: number }[];
  sources: { valeur: string; nb: number }[];
}

// Les statuts non ciblables sont volontairement absents : un désabonné ou un
// email injoignable ne peut pas être destinataire, quel que soit le filtre.
const STATUTS_CIBLABLES: { value: Statut; label: string }[] = [
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "A_CONTACTER", label: "À contacter" },
  { value: "CONTACTE", label: "Contacté" },
  { value: "RELANCE", label: "Relancé" },
  { value: "INTERESSE", label: "Intéressé" },
  { value: "REFUSE", label: "Refusé" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500";

const MODELE_DEFAUT = `<p>{{salutation}}</p>

<p>Je me permets de vous écrire au sujet de <strong>{{nom}}</strong>{{ville| }}.</p>

<p>Nous mettons en avant les centres agréés auprès des conducteurs qui cherchent
un stage de récupération de points près de chez eux. L'inscription est gratuite :
seule une commission est prélevée sur les réservations effectivement réalisées
via la plateforme.</p>

<p>Si le principe vous intéresse, vous pouvez déposer votre demande ici :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>Bien cordialement,</p>`;

export default function CampaignEditor({
  initial,
  variables,
  onSaved,
  onCancel,
}: {
  initial?: CampagneForm;
  variables: Variable[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CampagneForm>(
    initial ?? {
      nom: "",
      sujet: "",
      contenu: MODELE_DEFAUT,
      fromName: "BYS Permis",
      replyTo: "",
      filtre: { statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
    },
  );
  const [facettes, setFacettes] = useState<Facettes>({ departements: [], sources: [] });
  const [cibles, setCibles] = useState<number | null>(null);
  const [comptage, setComptage] = useState(false);
  const [apercu, setApercu] = useState<{ sujet: string; html: string; vides: string[] } | null>(null);
  const [chargementApercu, setChargementApercu] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailTest, setEmailTest] = useState("");
  const [envoiTest, setEnvoiTest] = useState(false);

  const contenuRef = useRef<HTMLTextAreaElement>(null);

  // ── Facettes de ciblage ──
  useEffect(() => {
    fetch("/api/admin/prospects/imports")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.facettes && setFacettes(d.facettes))
      .catch(() => {});
  }, []);

  // ── Comptage du ciblage, redéclenché à chaque changement de filtre ──
  const compter = useCallback(async (filtre: AudienceFilter) => {
    setComptage(true);
    try {
      const res = await fetch("/api/admin/campagnes/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filtre }),
      });
      const data = await res.json();
      setCibles(res.ok ? (data.total ?? 0) : null);
    } catch {
      setCibles(null);
    } finally {
      setComptage(false);
    }
  }, []);

  useEffect(() => {
    // Léger délai : évite un appel par clic quand on coche plusieurs cases.
    const timer = setTimeout(() => compter(form.filtre), 400);
    return () => clearTimeout(timer);
  }, [form.filtre, compter]);

  // ── Insertion d'une variable à la position du curseur ──
  const insererVariable = (cle: string) => {
    const textarea = contenuRef.current;
    const jeton = `{{${cle}}}`;
    if (!textarea) {
      setForm((f) => ({ ...f, contenu: f.contenu + jeton }));
      return;
    }
    const debut = textarea.selectionStart ?? textarea.value.length;
    const fin = textarea.selectionEnd ?? debut;
    const suivant = form.contenu.slice(0, debut) + jeton + form.contenu.slice(fin);
    setForm((f) => ({ ...f, contenu: suivant }));
    // Replace le curseur juste après le jeton inséré.
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
      if (data.validation?.errors?.length) {
        setErreur(data.validation.errors.join(" "));
      }
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
    setMessage(null);
    try {
      const payload = {
        nom: form.nom,
        sujet: form.sujet,
        contenu: form.contenu,
        fromName: form.fromName || null,
        replyTo: form.replyTo || null,
        filtre: form.filtre,
      };
      const res = await fetch(form.id ? `/api/admin/campagnes/${form.id}` : "/api/admin/campagnes", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Enregistrement impossible.");
        return;
      }
      setForm((f) => ({ ...f, id: data.campagne?.id ?? f.id }));
      setMessage("Campagne enregistrée.");
      onSaved();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnregistrement(false);
    }
  };

  const envoyerTest = async () => {
    if (!form.id) {
      setErreur("Enregistrez la campagne avant d'envoyer un test.");
      return;
    }
    setEnvoiTest(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/campagnes/${form.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTest }),
      });
      const data = await res.json();
      setMessage(res.ok ? data.message : null);
      if (!res.ok) setErreur(data?.error ?? "Envoi du test impossible.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoiTest(false);
    }
  };

  const basculerStatut = (statut: Statut) => {
    setForm((f) => {
      const actuels = f.filtre.statuts ?? [];
      const suivants = actuels.includes(statut)
        ? actuels.filter((s) => s !== statut)
        : [...actuels, statut];
      return { ...f, filtre: { ...f.filtre, statuts: suivants } };
    });
  };

  const multiSelect = (valeurs: string[], cle: "departements" | "sources") =>
    setForm((f) => ({ ...f, filtre: { ...f.filtre, [cle]: valeurs.length ? valeurs : undefined } }));

  return (
    <div className="rounded-xl border border-white/10 p-6 space-y-6" style={{ background: "#0D1D3A" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-semibold text-lg">
            {form.id ? "Modifier la campagne" : "Nouvelle campagne"}
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Un seul message, personnalisé pour chaque centre à partir des variables.
          </p>
        </div>
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
      {message && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 flex items-start gap-2">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 mt-0.5 text-sm" />
          <p className="text-green-300 text-xs">{message}</p>
        </div>
      )}

      {/* ── Identité de la campagne ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Nom interne *</label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            placeholder="Relance Île-de-France"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Nom de l&apos;expéditeur</label>
          <input
            type="text"
            value={form.fromName}
            onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
            placeholder="BYS Permis"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Adresse de réponse <span className="text-gray-600">(recommandé)</span>
          </label>
          <input
            type="email"
            value={form.replyTo}
            onChange={(e) => setForm((f) => ({ ...f, replyTo: e.target.value }))}
            placeholder="contact@byspermis.fr"
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

      {/* ── Corps + variables ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-gray-400 text-xs">Contenu (HTML) *</label>
          <span className="text-gray-600 text-[11px]">
            <FontAwesomeIcon icon={faCode} className="mr-1" />
            Syntaxe de repli : <code className="text-gray-400">{"{{ville|votre secteur}}"}</code>
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
          rows={14}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
        />
        <p className="text-gray-600 text-[11px] mt-1.5">
          Le pied de page (identité de l&apos;expéditeur et lien de désinscription) est ajouté
          automatiquement à chaque envoi — obligatoire pour le démarchage.
        </p>
      </div>

      {/* ── Ciblage ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-white text-sm font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="text-blue-400" /> Ciblage
          </p>
          <p className="text-sm">
            {comptage ? (
              <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400" />
            ) : cibles === null ? (
              <span className="text-gray-500 text-xs">—</span>
            ) : (
              <span className="text-white font-bold">
                {cibles} <span className="text-gray-400 font-normal text-xs">destinataire(s)</span>
              </span>
            )}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-xs mb-2">Statuts inclus</p>
          <div className="flex flex-wrap gap-2">
            {STATUTS_CIBLABLES.map((s) => {
              const actif = (form.filtre.statuts ?? []).includes(s.value);
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
          <p className="text-gray-600 text-[11px] mt-2">
            Aucun statut sélectionné = tous les prospects contactables.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">
              Départements <span className="text-gray-600">(Ctrl pour plusieurs)</span>
            </label>
            <select
              multiple
              value={form.filtre.departements ?? []}
              onChange={(e) =>
                multiSelect(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                  "departements",
                )
              }
              className={`${inputClass} h-28`}
            >
              {facettes.departements.map((d) => (
                <option key={d.valeur} value={d.valeur}>
                  {d.valeur} ({d.nb})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Sources</label>
            <select
              multiple
              value={form.filtre.sources ?? []}
              onChange={(e) =>
                multiSelect(
                  Array.from(e.target.selectedOptions, (o) => o.value),
                  "sources",
                )
              }
              className={`${inputClass} h-28`}
            >
              {facettes.sources.map((s) => (
                <option key={s.valeur} value={s.valeur}>
                  {s.valeur} ({s.nb})
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.filtre.exclureDejaContactes ?? false}
            onChange={(e) =>
              setForm((f) => ({ ...f, filtre: { ...f.filtre, exclureDejaContactes: e.target.checked } }))
            }
            className="rounded border-white/20 bg-white/5"
          />
          <span className="text-gray-300 text-xs">
            N&apos;inclure que les prospects jamais contactés par email
          </span>
        </label>

        <p className="text-gray-600 text-[11px]">
          Les prospects sans email, avec une adresse invalide ou opposés au démarchage sont
          toujours exclus, quel que soit le filtre.
        </p>
      </div>

      {/* ── Aperçu ── */}
      {apercu && (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
            <p className="text-gray-400 text-[11px]">Objet</p>
            <p className="text-white text-sm font-medium">{apercu.sujet || "(vide)"}</p>
            {apercu.vides.length > 0 && (
              <p className="text-orange-300 text-[11px] mt-1">
                Variables vides pour ce prospect : {apercu.vides.map((v) => `{{${v}}}`).join(", ")} —
                pensez à une valeur de repli.
              </p>
            )}
          </div>
          <div className="bg-white p-4 max-h-96 overflow-y-auto">
            {/* Contenu généré par notre propre gabarit, valeurs déjà échappées côté serveur. */}
            <div dangerouslySetInnerHTML={{ __html: apercu.html }} />
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={enregistrer}
          disabled={enregistrement || !form.nom.trim() || !form.sujet.trim()}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {enregistrement ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faFloppyDisk} />}
          {form.id ? "Enregistrer" : "Créer la campagne"}
        </button>

        <button
          onClick={voirApercu}
          disabled={chargementApercu}
          className="px-5 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm font-semibold hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          {chargementApercu ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faEye} />}
          Aperçu
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="email"
            value={emailTest}
            onChange={(e) => setEmailTest(e.target.value)}
            placeholder="mon@email.fr"
            className={`${inputClass} w-48`}
          />
          <button
            onClick={envoyerTest}
            disabled={envoiTest || !emailTest.includes("@") || !form.id}
            title={!form.id ? "Enregistrez d'abord la campagne" : "Envoyer un exemplaire de test"}
            className="px-4 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm font-semibold hover:border-blue-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 shrink-0"
          >
            {envoiTest ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
            Test
          </button>
        </div>
      </div>
    </div>
  );
}
