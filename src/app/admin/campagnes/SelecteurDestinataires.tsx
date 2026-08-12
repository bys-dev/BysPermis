"use client";

/**
 * Choix nominatif des destinataires d'une campagne.
 *
 * Le ciblage par critères reste le moyen le plus rapide de toucher un segment,
 * mais il ne permet pas de dire « ces douze centres-là, et personne d'autre ».
 * Cet écran comble ce manque : on parcourt le fichier, on coche, on voit à tout
 * moment qui recevra le message.
 *
 * La sélection vit ici sous forme d'identifiants ; l'API ne renvoie que les
 * fiches réellement contactables (email valide, sans opposition), si bien qu'un
 * centre désinscrit ne peut pas être coché par inadvertance.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faListCheck,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import type { Destinataire, Facettes } from "./types";
import { inputClass, MAX_SELECTION } from "./types";

const PER_PAGE = 25;

export default function SelecteurDestinataires({
  selection,
  onChange,
  facettes,
  onApercu,
}: {
  selection: string[];
  onChange: (ids: string[]) => void;
  facettes: Facettes;
  /** Prévisualiser l'email tel que ce centre le recevra. */
  onApercu?: (prospectId: string) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const [rechercheActive, setRechercheActive] = useState("");
  const [departement, setDepartement] = useState("");
  const [source, setSource] = useState("");
  const [jamaisContactes, setJamaisContactes] = useState(false);
  const [page, setPage] = useState(1);

  const [lignes, setLignes] = useState<Destinataire[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /** Fiches sélectionnées, y compris celles absentes de la page courante. */
  const [choisis, setChoisis] = useState<Destinataire[]>([]);
  const [chargementChoisis, setChargementChoisis] = useState(false);

  const selectionSet = useMemo(() => new Set(selection), [selection]);

  // ── Parcours du fichier ──
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/campagnes/destinataires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filtre: {
            mode: "FILTRE",
            recherche: rechercheActive || undefined,
            departements: departement ? [departement] : undefined,
            sources: source ? [source] : undefined,
            exclureDejaContactes: jamaisContactes || undefined,
          },
          page,
          perPage: PER_PAGE,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Chargement impossible.");
        return;
      }
      setLignes(data.destinataires ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setChargement(false);
    }
  }, [rechercheActive, departement, source, jamaisContactes, page]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    setPage(1);
  }, [rechercheActive, departement, source, jamaisContactes]);

  // ── Récapitulatif de la sélection ──
  // Les fiches cochées puis quittées (changement de page ou de filtre) doivent
  // rester visibles : on les recharge par identifiant.
  const dernierRecap = useRef<string>("");
  useEffect(() => {
    const cle = [...selection].sort().join(",");
    if (cle === dernierRecap.current) return;
    dernierRecap.current = cle;

    if (selection.length === 0) {
      setChoisis([]);
      return;
    }
    let annule = false;
    setChargementChoisis(true);
    fetch("/api/admin/campagnes/destinataires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filtre: { mode: "SELECTION", prospectIds: selection },
        page: 1,
        perPage: 100,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (annule || !d) return;
        setChoisis(d.destinataires ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargementChoisis(false);
      });
    return () => {
      annule = true;
    };
  }, [selection]);

  /**
   * Applique une nouvelle sélection en respectant le plafond d'enregistrement :
   * mieux vaut refuser l'ajout tout de suite que laisser échouer la sauvegarde
   * de la campagne une fois le message écrit.
   */
  const appliquer = (ids: string[]) => {
    if (ids.length > MAX_SELECTION) {
      setErreur(
        `La sélection manuelle est limitée à ${MAX_SELECTION} centres. ` +
          `Au-delà, passez au ciblage par critères.`,
      );
      return;
    }
    setErreur(null);
    onChange(ids);
  };

  const basculer = (id: string) =>
    appliquer(selectionSet.has(id) ? selection.filter((x) => x !== id) : [...selection, id]);

  const pageEntiereCochee = lignes.length > 0 && lignes.every((l) => selectionSet.has(l.id));

  const basculerPage = () => {
    if (pageEntiereCochee) {
      const aRetirer = new Set(lignes.map((l) => l.id));
      appliquer(selection.filter((id) => !aRetirer.has(id)));
    } else {
      const fusion = new Set(selection);
      lignes.forEach((l) => fusion.add(l.id));
      appliquer([...fusion]);
    }
  };

  /** Ajoute d'un coup tout le résultat du filtre courant, au-delà de la page affichée. */
  const ajouterTousLesResultats = async () => {
    setChargement(true);
    try {
      const res = await fetch("/api/admin/campagnes/destinataires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filtre: {
            mode: "FILTRE",
            recherche: rechercheActive || undefined,
            departements: departement ? [departement] : undefined,
            sources: source ? [source] : undefined,
            exclureDejaContactes: jamaisContactes || undefined,
          },
          page: 1,
          perPage: 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "Ajout impossible.");
        return;
      }
      const fusion = new Set(selection);
      (data.destinataires ?? []).forEach((d: Destinataire) => fusion.add(d.id));
      appliquer([...fusion]);
      if ((data.pagination?.total ?? 0) > 100) {
        setErreur(
          `Les 100 premiers résultats ont été ajoutés (${data.pagination.total} au total). ` +
            `Affinez la recherche pour ajouter le reste, ou passez en ciblage par filtre.`,
        );
      }
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Recherche et filtres de parcours ── */}
      <div className="flex flex-wrap gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setRechercheActive(recherche.trim());
          }}
          className="flex-1 min-w-[220px] flex gap-2"
        >
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom du centre, ville, email…"
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-blue-500 transition-colors shrink-0"
            aria-label="Rechercher"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </form>

        <select
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
          className={`${inputClass} w-auto`}
        >
          <option value="">Tous départements</option>
          {facettes.departements.map((d) => (
            <option key={d.valeur} value={d.valeur}>
              {d.valeur} ({d.nb})
            </option>
          ))}
        </select>

        <select value={source} onChange={(e) => setSource(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">Toutes sources</option>
          {facettes.sources.map((s) => (
            <option key={s.valeur} value={s.valeur}>
              {s.valeur} ({s.nb})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={jamaisContactes}
            onChange={(e) => setJamaisContactes(e.target.checked)}
            className="rounded border-white/20 bg-white/5"
          />
          <span className="text-gray-300 text-xs">Uniquement les centres jamais contactés</span>
        </label>
        <span className="text-gray-600 text-[11px]">
          {total} centre(s) contactable(s) correspondent à cette recherche
        </span>
        <button
          type="button"
          onClick={ajouterTousLesResultats}
          disabled={chargement || total === 0}
          className="ml-auto px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faListCheck} /> Ajouter tous les résultats
        </button>
      </div>

      {erreur && (
        <p className="text-orange-300 text-[11px] rounded-lg border border-orange-500/30 bg-orange-500/10 p-2.5">
          {erreur}
        </p>
      )}

      {/* ── Table de sélection ── */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        {chargement && lignes.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400" />
          </div>
        ) : lignes.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-xs">
            Aucun centre contactable ne correspond à cette recherche.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 sticky top-0">
                <tr className="text-gray-400 text-left text-xs">
                  <th className="px-3 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={pageEntiereCochee}
                      onChange={basculerPage}
                      className="rounded border-white/20 bg-white/5"
                      aria-label="Sélectionner toute la page"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">Centre</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Ville</th>
                  <th className="px-3 py-2.5 font-medium">Envois</th>
                  <th className="px-3 py-2.5 font-medium text-right">Aperçu</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((d) => {
                  const coche = selectionSet.has(d.id);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => basculer(d.id)}
                      className={`border-t border-white/5 cursor-pointer transition-colors ${
                        coche ? "bg-blue-500/10" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() => basculer(d.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-white/20 bg-white/5"
                          aria-label={`Sélectionner ${d.nom}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-white text-xs font-medium">{d.nom}</p>
                        {(d.contactPrenom || d.contactNom) && (
                          <p className="text-gray-500 text-[11px]">
                            {[d.contactPrenom, d.contactNom].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-300 text-xs">{d.email}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">
                        {d.ville ?? "—"}
                        {d.departement && <span className="text-gray-600"> ({d.departement})</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{d.nbEmailsEnvoyes}</td>
                      <td className="px-3 py-2.5 text-right">
                        {onApercu && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApercu(d.id);
                            }}
                            title={`Voir l'email que recevra ${d.nom}`}
                            className="px-2 py-1 rounded-md border border-white/10 text-gray-400 text-[11px] hover:border-blue-500 hover:text-white transition-colors"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
            <p className="text-gray-500 text-[11px]">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || chargement}
                className="px-2.5 py-1 rounded-lg border border-white/15 text-gray-300 text-[11px] hover:border-blue-500 disabled:opacity-30 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || chargement}
                className="px-2.5 py-1 rounded-lg border border-white/15 text-gray-300 text-[11px] hover:border-blue-500 disabled:opacity-30 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Récapitulatif ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-xs font-semibold">
            {selection.length} centre(s) sélectionné(s)
            {chargementChoisis && <FontAwesomeIcon icon={faSpinner} spin className="ml-2 text-blue-400" />}
          </p>
          {selection.length > 0 && (
            <button
              type="button"
              onClick={() => appliquer([])}
              className="text-gray-400 text-[11px] hover:text-white transition-colors"
            >
              Tout retirer
            </button>
          )}
        </div>
        {selection.length === 0 ? (
          <p className="text-gray-500 text-[11px]">
            Cochez les centres à contacter. Chacun recevra un email nominatif, personnalisé avec ses
            propres données.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {choisis.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-200 text-[11px]"
              >
                {d.nom}
                <button
                  type="button"
                  onClick={() => basculer(d.id)}
                  aria-label={`Retirer ${d.nom}`}
                  className="text-blue-300/70 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </span>
            ))}
            {selection.length > choisis.length && !chargementChoisis && (
              <span className="text-gray-500 text-[11px] px-2 py-1">
                + {selection.length - choisis.length} autre(s)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
