"use client";

/**
 * Ajout d'adresses email à la main, en complément du ciblage.
 *
 * Chaque adresse est rattachée côté serveur à une fiche prospect (retrouvée
 * par email, sinon créée avec la source « manuel ») : elle profite ainsi du
 * même pipeline que les autres destinataires — suivi, désinscription,
 * exclusions. Une adresse désinscrite est refusée et signalée.
 */

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAt,
  faEye,
  faPlus,
  faSpinner,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { analyserAdresses } from "@/lib/prospects/adresses";
import { inputClass, type AudienceFilter } from "./types";

interface AdresseManuelle {
  id: string | null;
  email: string;
  nom: string;
  creee: boolean;
  bloque: string | null;
  dejaCiblee: boolean;
}

interface Retour {
  invalides: string[];
  doublons: string[];
  refusees: { email: string; motif: string }[];
  ajoutees: number;
}

export default function AjoutsManuels({
  ids,
  onChange,
  filtre,
  onApercu,
}: {
  /** Fiches déjà ajoutées à la main (`filtre.ajoutsManuels`). */
  ids: string[];
  onChange: (ids: string[]) => void;
  /** Ciblage courant, pour repérer les doublons avec la sélection. */
  filtre: AudienceFilter;
  onApercu?: (prospectId: string) => void;
}) {
  const [saisie, setSaisie] = useState("");
  const [details, setDetails] = useState<Record<string, AdresseManuelle>>({});
  const [chargement, setChargement] = useState(false);
  const [retour, setRetour] = useState<Retour | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const selection = useMemo(
    () => new Set((filtre.mode ?? "FILTRE") === "SELECTION" ? (filtre.prospectIds ?? []) : []),
    [filtre.mode, filtre.prospectIds],
  );

  // ── Réouverture d'une campagne : on récupère le détail des fiches déjà ajoutées ──
  const manquants = ids.filter((id) => !details[id]);
  const cleManquants = manquants.join(",");
  useEffect(() => {
    if (!cleManquants) return;
    const controleur = new AbortController();
    fetch("/api/admin/campagnes/ajouts-manuels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controleur.signal,
      body: JSON.stringify({ ids: cleManquants.split(",") }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { adresses?: AdresseManuelle[] } | null) => {
        if (!d?.adresses) return;
        setDetails((prev) => {
          const suivant = { ...prev };
          for (const a of d.adresses ?? []) if (a.id) suivant[a.id] = a;
          return suivant;
        });
      })
      .catch(() => {});
    return () => controleur.abort();
  }, [cleManquants]);

  const emailsPresents = ids.flatMap((id) => (details[id] ? [details[id].email] : []));
  const apercuLocal = saisie.trim() ? analyserAdresses(saisie, emailsPresents) : null;

  const ajouter = async () => {
    if (!apercuLocal) return;
    setErreur(null);
    const { valides, invalides, doublons } = apercuLocal;
    if (valides.length === 0) {
      setRetour({ invalides, doublons, refusees: [], ajoutees: 0 });
      return;
    }

    setChargement(true);
    try {
      // Ciblage hors ajouts manuels : sert à signaler les adresses qu'il contient déjà.
      const ciblage: AudienceFilter = { ...filtre, ajoutsManuels: undefined };
      const res = await fetch("/api/admin/campagnes/ajouts-manuels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: valides, filtre: ciblage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Ajout impossible.");
        return;
      }

      const refusees: Retour["refusees"] = [];
      const nouveauxDoublons = [...doublons];
      const nouveauxIds: string[] = [];
      const nouveauxDetails: Record<string, AdresseManuelle> = {};
      for (const a of (data.adresses ?? []) as AdresseManuelle[]) {
        if (a.bloque || !a.id) {
          refusees.push({ email: a.email, motif: a.bloque ?? "Adresse refusée" });
        } else if (ids.includes(a.id) || nouveauxIds.includes(a.id) || selection.has(a.id)) {
          // Même fiche déjà présente (autre casse, ou déjà cochée dans la liste).
          nouveauxDoublons.push(a.email);
        } else {
          nouveauxIds.push(a.id);
          nouveauxDetails[a.id] = a;
        }
      }

      setDetails((prev) => ({ ...prev, ...nouveauxDetails }));
      if (nouveauxIds.length) onChange([...ids, ...nouveauxIds]);
      setRetour({
        invalides: [...invalides, ...((data.invalides ?? []) as string[])],
        doublons: nouveauxDoublons,
        refusees,
        ajoutees: nouveauxIds.length,
      });
      setSaisie("");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setChargement(false);
    }
  };

  const retirer = (id: string) => onChange(ids.filter((x) => x !== id));

  const nbExclues = ids.filter((id) => details[id]?.bloque).length;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-white text-xs font-semibold flex items-center gap-2">
          <FontAwesomeIcon icon={faAt} className="text-blue-400" /> Adresses ajoutées à la main
        </p>
        <span className="text-slate-300 text-[11px]">
          <span className="text-white font-semibold">{ids.length - nbExclues}</span> adresse(s)
          {nbExclues > 0 && <span className="text-red-300"> · {nbExclues} exclue(s)</span>}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void ajouter();
            }
          }}
          rows={2}
          placeholder="contact@centre-a.fr, gerant@centre-b.fr — une ou plusieurs adresses (virgule, point-virgule, espace ou retour à la ligne)"
          className={`${inputClass} text-xs resize-y`}
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={chargement || !apercuLocal || apercuLocal.valides.length === 0}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 shrink-0 sm:self-start"
        >
          {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlus} />}
          Ajouter{apercuLocal && apercuLocal.valides.length > 0 ? ` (${apercuLocal.valides.length})` : ""}
        </button>
      </div>

      {apercuLocal && apercuLocal.invalides.length > 0 && (
        <p className="text-red-300 text-[11px]">
          Format invalide : {apercuLocal.invalides.join(", ")}
        </p>
      )}

      {erreur && (
        <p className="text-red-300 text-[11px] flex items-start gap-1.5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> {erreur}
        </p>
      )}

      {retour && (
        <div className="text-[11px] space-y-1">
          {retour.ajoutees > 0 && <p className="text-blue-200">{retour.ajoutees} adresse(s) ajoutée(s).</p>}
          {retour.doublons.length > 0 && (
            <p className="text-slate-300">Déjà présentes, ignorées : {retour.doublons.join(", ")}</p>
          )}
          {retour.invalides.length > 0 && (
            <p className="text-red-300">Format invalide, ignorées : {retour.invalides.join(", ")}</p>
          )}
          {retour.refusees.map((r) => (
            <p key={r.email} className="text-red-300 flex items-start gap-1.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
              <span>
                <span className="font-semibold">{r.email}</span> — {r.motif}. Adresse non ajoutée.
              </span>
            </p>
          ))}
        </div>
      )}

      {ids.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {ids.map((id) => {
            const d = details[id];
            const bloque = d?.bloque;
            return (
              <li
                key={id}
                title={bloque ?? (d?.dejaCiblee ? "Fait déjà partie du ciblage par critères" : d?.email)}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border text-[11px] ${
                  bloque
                    ? "bg-red-500/10 border-red-500/40 text-red-200 line-through decoration-red-300/60"
                    : "bg-white/5 border-white/15 text-slate-100"
                }`}
              >
                <span className="max-w-[220px] truncate">{d?.email ?? "…"}</span>
                {d?.dejaCiblee && !bloque && (
                  <span className="px-1.5 rounded bg-blue-500/20 text-blue-200 text-[10px]">déjà ciblé</span>
                )}
                {onApercu && !bloque && (
                  <button
                    type="button"
                    onClick={() => onApercu(id)}
                    title="Voir l'email que recevra cette adresse"
                    className="w-5 h-5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 inline-flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => retirer(id)}
                  aria-label={`Retirer ${d?.email ?? "cette adresse"}`}
                  className="w-5 h-5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 inline-flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-slate-400 text-[11px] leading-relaxed">
        Une adresse absente du fichier de prospects n&apos;a ni nom de centre ni ville : <code className="text-slate-300">{"{{nom}}"}</code>{" "}
        devient « votre centre » et les autres variables restent vides — prévoyez un repli, ex.{" "}
        <code className="text-slate-300">{"{{ville|votre secteur}}"}</code>. Les adresses désinscrites ne
        reçoivent jamais l&apos;email.
      </p>
    </div>
  );
}
