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
  faFilter,
  faListCheck,
  faBookmark,
  faUserLock,
} from "@fortawesome/free-solid-svg-icons";
import BibliothequeModeles from "./BibliothequeModeles";
import SelecteurDestinataires from "./SelecteurDestinataires";
import {
  STATUTS_CIBLABLES,
  inputClass,
  type AudienceFilter,
  type CampagneForm,
  type Facettes,
  type Modele,
  type ModeCiblage,
  type Statut,
  type Variable,
} from "./types";

export type { CampagneForm } from "./types";

interface ImportFichier {
  id: string;
  filename: string;
  createdAt: string;
  _count?: { prospects: number };
}

const MODELE_DEFAUT = `<p>{{salutation}}</p>

<p>Je me permets de vous écrire au sujet de <strong>{{nom}}</strong>{{ville| }}.</p>

<p>Nous mettons en avant les centres agréés auprès des conducteurs qui cherchent
un stage de récupération de points près de chez eux. L'inscription est gratuite :
seule une commission est prélevée sur les réservations effectivement réalisées
via la plateforme.</p>

<p>Si le principe vous intéresse, vous pouvez déposer votre demande ici :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>Bien cordialement,</p>`;

/**
 * Formulaire d'une campagne vierge. Le ciblage par défaut vise les fiches
 * jamais travaillées ; passer un filtre permet d'ouvrir directement l'éditeur
 * sur une sélection venue d'un autre écran.
 */
export function nouvelleCampagne(filtre?: AudienceFilter): CampagneForm {
  return {
    nom: "",
    sujet: "",
    contenu: MODELE_DEFAUT,
    fromName: "BYS Permis",
    replyTo: "",
    filtre: filtre ?? { mode: "FILTRE", statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
  };
}

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
      filtre: { mode: "FILTRE", statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
    },
  );
  const [facettes, setFacettes] = useState<Facettes>({ departements: [], sources: [] });
  const [imports, setImports] = useState<ImportFichier[]>([]);
  const [cibles, setCibles] = useState<number | null>(null);
  const [comptage, setComptage] = useState(false);
  const [apercu, setApercu] = useState<{ sujet: string; html: string; vides: string[]; centre: string | null } | null>(
    null,
  );
  const [chargementApercu, setChargementApercu] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [sauvegardeModele, setSauvegardeModele] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailTest, setEmailTest] = useState("");
  const [envoiTest, setEnvoiTest] = useState(false);

  const contenuRef = useRef<HTMLTextAreaElement>(null);

  const mode: ModeCiblage = form.filtre.mode ?? "FILTRE";
  const selection = form.filtre.prospectIds ?? [];

  // ── Facettes de ciblage et historique d'imports ──
  useEffect(() => {
    fetch("/api/admin/prospects/imports")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.facettes) setFacettes(d.facettes);
        if (d?.imports) setImports(d.imports);
      })
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

  /**
   * Applique un modèle au formulaire.
   *
   * Le ciblage conseillé n'écrase jamais une sélection nominative en cours :
   * on ne fait pas perdre au staff les centres qu'il vient de cocher un par un.
   */
  const appliquerModele = (m: Modele) => {
    setErreur(null);
    setForm((f) => ({
      ...f,
      nom: f.nom.trim() || m.nom,
      sujet: m.sujet,
      contenu: m.contenu,
      fromName: m.fromName ?? f.fromName,
      replyTo: m.replyTo ?? f.replyTo,
      filtre:
        (f.filtre.mode ?? "FILTRE") === "SELECTION" || !m.filtreSuggere
          ? f.filtre
          : { mode: "FILTRE", ...m.filtreSuggere },
    }));
    setApercu(null);
    setMessage(`Modèle « ${m.nom} » chargé — le texte reste librement modifiable.`);
  };

  const enregistrerCommeModele = async () => {
    if (!form.sujet.trim() || !form.contenu.trim()) {
      setErreur("Renseignez l'objet et le contenu avant d'en faire un modèle.");
      return;
    }
    setSauvegardeModele(true);
    setErreur(null);
    setMessage(null);
    try {
      // Un modèle est réutilisable : ni la sélection nominative ni le fichier
      // d'import du moment n'y ont leur place, seuls les critères durables.
      const criteres: AudienceFilter = {};
      if (form.filtre.statuts?.length) criteres.statuts = form.filtre.statuts;
      if (form.filtre.departements?.length) criteres.departements = form.filtre.departements;
      if (form.filtre.sources?.length) criteres.sources = form.filtre.sources;
      if (form.filtre.exclureDejaContactes) criteres.exclureDejaContactes = true;

      const res = await fetch("/api/admin/prospects/modeles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim() || form.sujet.trim().slice(0, 80),
          sujet: form.sujet,
          contenu: form.contenu,
          fromName: form.fromName || null,
          replyTo: form.replyTo || null,
          filtreSuggere: Object.keys(criteres).length ? criteres : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Enregistrement du modèle impossible.");
        return;
      }
      setMessage("Modèle ajouté à la bibliothèque.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setSauvegardeModele(false);
    }
  };

  const voirApercu = async (prospectId?: string) => {
    setChargementApercu(true);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/campagnes/apercu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sujet: form.sujet,
          contenu: form.contenu,
          fromName: form.fromName || null,
          prospectId: prospectId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Aperçu impossible.");
        return;
      }
      if (data.validation?.errors?.length) {
        setErreur(data.validation.errors.join(" "));
      }
      setApercu({
        sujet: data.sujet,
        html: data.html,
        vides: data.variablesVides ?? [],
        centre: data.prospectUtilise?.nom ?? null,
      });
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

  const multiSelect = (valeurs: string[], cle: "departements" | "sources" | "importIds") =>
    setForm((f) => ({ ...f, filtre: { ...f.filtre, [cle]: valeurs.length ? valeurs : undefined } }));

  const changerMode = (nouveau: ModeCiblage) =>
    setForm((f) => ({ ...f, filtre: { ...f.filtre, mode: nouveau } }));

  const changerSelection = (ids: string[]) =>
    setForm((f) => ({ ...f, filtre: { ...f.filtre, mode: "SELECTION", prospectIds: ids } }));

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

      <BibliothequeModeles onChoisir={appliquerModele} ouvertParDefaut={!form.id} />

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
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1.5">
          <p className="text-gray-600 text-[11px] flex-1 min-w-[240px]">
            Le pied de page (identité de l&apos;expéditeur et lien de désinscription) est ajouté
            automatiquement à chaque envoi — obligatoire pour le démarchage.
          </p>
          <button
            type="button"
            onClick={enregistrerCommeModele}
            disabled={sauvegardeModele}
            className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors inline-flex items-center gap-2 shrink-0"
          >
            {sauvegardeModele ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faBookmark} />
            )}
            Enregistrer comme modèle
          </button>
        </div>
      </div>

      {/* ── Ciblage ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-white text-sm font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="text-blue-400" /> Destinataires
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

        {/* Choix du mode */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changerMode("FILTRE")}
            className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 ${
              mode === "FILTRE"
                ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"
            }`}
          >
            <FontAwesomeIcon icon={faFilter} /> Par critères
          </button>
          <button
            type="button"
            onClick={() => changerMode("SELECTION")}
            className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors inline-flex items-center justify-center gap-2 ${
              mode === "SELECTION"
                ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"
            }`}
          >
            <FontAwesomeIcon icon={faListCheck} /> Liste choisie à la main
            {selection.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-100 text-[10px]">
                {selection.length}
              </span>
            )}
          </button>
        </div>

        {mode === "SELECTION" ? (
          <SelecteurDestinataires
            selection={selection}
            onChange={changerSelection}
            facettes={facettes}
            onApercu={(prospectId) => voirApercu(prospectId)}
          />
        ) : (
          <>
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

            <div className="grid sm:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Fichiers importés</label>
                <select
                  multiple
                  value={form.filtre.importIds ?? []}
                  onChange={(e) =>
                    multiSelect(
                      Array.from(e.target.selectedOptions, (o) => o.value),
                      "importIds",
                    )
                  }
                  className={`${inputClass} h-28`}
                >
                  {imports.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.filename} ({i._count?.prospects ?? 0})
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
          </>
        )}

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex items-start gap-2.5">
          <FontAwesomeIcon icon={faUserLock} className="text-blue-400 mt-0.5 text-sm" />
          <p className="text-gray-400 text-[11px] leading-relaxed">
            <span className="text-gray-200">Chaque centre reçoit son propre email</span>, adressé à lui
            seul et personnalisé avec ses données. Aucun destinataire n&apos;est en copie et personne ne
            voit les autres adresses.
            <br />
            Les prospects sans email, avec une adresse invalide ou opposés au démarchage sont toujours
            exclus, quel que soit le ciblage.
          </p>
        </div>
      </div>

      {/* ── Aperçu ── */}
      {apercu && (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
            <p className="text-gray-400 text-[11px]">
              Objet {apercu.centre && <span className="text-gray-500">— aperçu pour {apercu.centre}</span>}
            </p>
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
          onClick={() => voirApercu()}
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
