"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faSpinner,
  faMagnifyingGlass,
  faFileArrowUp,
  faChevronLeft,
  faChevronRight,
  faEnvelope,
  faPhone,
  faTriangleExclamation,
  faBan,
  faUserSlash,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import ImportPanel from "./ImportPanel";

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

interface Prospect {
  id: string;
  nom: string;
  raisonSociale: string | null;
  email: string | null;
  emailValide: boolean;
  telephone: string | null;
  ville: string | null;
  codePostal: string | null;
  departement: string | null;
  agrementNumber: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  statut: Statut;
  score: number | null;
  source: string | null;
  notesInternes: string | null;
  nbEmailsEnvoyes: number;
  nbOuvertures: number;
  nbClics: number;
  lastContactedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
  owner: { id: string; prenom: string; nom: string } | null;
}

interface Facettes {
  departements: { valeur: string; nb: number }[];
  sources: { valeur: string; nb: number }[];
  commerciaux: { id: string; prenom: string; nom: string; email: string }[];
}

const STATUTS: { value: Statut; label: string; classe: string }[] = [
  { value: "NOUVEAU", label: "Nouveau", classe: "bg-gray-500/15 text-gray-300 border-gray-500/30" },
  { value: "A_CONTACTER", label: "À contacter", classe: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "CONTACTE", label: "Contacté", classe: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  { value: "RELANCE", label: "Relancé", classe: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { value: "INTERESSE", label: "Intéressé", classe: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { value: "INSCRIT", label: "Inscrit", classe: "bg-green-500/15 text-green-300 border-green-500/30" },
  { value: "REFUSE", label: "Refusé", classe: "bg-red-500/15 text-red-300 border-red-500/30" },
  { value: "INJOIGNABLE", label: "Injoignable", classe: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { value: "DESABONNE", label: "Désabonné", classe: "bg-white/5 text-gray-400 border-white/10" },
];

const statutMeta = (s: Statut) => STATUTS.find((x) => x.value === s) ?? STATUTS[0];

const inputClass =
  "px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500";

export default function AdminProspectsPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facettes, setFacettes] = useState<Facettes>({ departements: [], sources: [], commerciaux: [] });
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [recherche, setRecherche] = useState("");
  const [rechercheActive, setRechercheActive] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<Statut | "">("");
  const [filtreDepartement, setFiltreDepartement] = useState("");
  const [filtreSource, setFiltreSource] = useState("");
  const [page, setPage] = useState(1);

  // Sélection + import
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [afficherImport, setAfficherImport] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    const params = new URLSearchParams({ page: String(page), perPage: "50" });
    if (rechercheActive) params.set("search", rechercheActive);
    if (filtreStatut) params.set("statut", filtreStatut);
    if (filtreDepartement) params.set("departement", filtreDepartement);
    if (filtreSource) params.set("source", filtreSource);

    try {
      const res = await fetch(`/api/admin/prospects?${params}`);
      if (!res.ok) throw new Error("chargement");
      const data = await res.json();
      setProspects(data.prospects ?? []);
      setStats(data.stats?.parStatut ?? {});
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setErreur("Impossible de charger les prospects.");
    } finally {
      setLoading(false);
    }
  }, [page, rechercheActive, filtreStatut, filtreDepartement, filtreSource]);

  const chargerFacettes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/prospects/imports");
      if (!res.ok) return;
      const data = await res.json();
      if (data.facettes) setFacettes(data.facettes);
    } catch {
      /* les facettes sont un confort : leur absence ne bloque pas l'écran */
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    chargerFacettes();
  }, [chargerFacettes]);

  // Un changement de filtre invalide la page courante et la sélection.
  useEffect(() => {
    setPage(1);
    setSelection(new Set());
  }, [rechercheActive, filtreStatut, filtreDepartement, filtreSource]);

  const toutSelectionne = prospects.length > 0 && prospects.every((p) => selection.has(p.id));

  const basculerTout = () => {
    setSelection((s) => {
      const next = new Set(s);
      if (toutSelectionne) prospects.forEach((p) => next.delete(p.id));
      else prospects.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const basculer = (id: string) => {
    setSelection((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const actionGroupee = async (
    payload: { action: "statut"; statut: Statut } | { action: "assigner"; ownerId: string | null },
  ) => {
    if (selection.size === 0) return;
    setActionEnCours(true);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/prospects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selection], ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data?.error ?? "L'action groupée a échoué.");
        return;
      }
      setSelection(new Set());
      await charger();
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setActionEnCours(false);
    }
  };

  const changerStatut = async (id: string, statut: Statut) => {
    try {
      const res = await fetch(`/api/admin/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data?.error ?? "Mise à jour impossible.");
        return;
      }
      setProspects((list) => list.map((p) => (p.id === id ? { ...p, statut } : p)));
    } catch {
      setErreur("Impossible de contacter le serveur.");
    }
  };

  /**
   * Ouvre une campagne ciblée sur les fiches cochées.
   *
   * On transmet les identifiants plutôt qu'un filtre : le staff veut écrire à
   * *ces* centres-là. Les fiches non contactables présentes dans la sélection
   * (sans email, désabonnées) seront écartées côté serveur, et le compte affiché
   * dans l'éditeur reflète ce tri.
   */
  const contacterSelection = () => {
    if (selection.size === 0) return;
    router.push(`/admin/campagnes?selection=${[...selection].join(",")}`);
  };

  const contactables = useMemo(
    () => prospects.filter((p) => p.email && p.emailValide && !p.unsubscribedAt).length,
    [prospects],
  );

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-display font-bold text-2xl flex items-center gap-3">
            <FontAwesomeIcon icon={faBullseye} className="text-blue-400" />
            Prospects
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Fichier de centres agréés à démarcher — {total} fiche(s) au total.
          </p>
        </div>
        <button
          onClick={() => setAfficherImport((v) => !v)}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faFileArrowUp} />
          {afficherImport ? "Masquer l'import" : "Importer un fichier"}
        </button>
      </div>

      {afficherImport && (
        <ImportPanel
          onImported={() => {
            charger();
            chargerFacettes();
          }}
        />
      )}

      {/* ── Répartition par statut ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATUTS.slice(0, 5).map((s) => (
          <button
            key={s.value}
            onClick={() => setFiltreStatut((cur) => (cur === s.value ? "" : s.value))}
            className={`rounded-xl border p-4 text-left transition-all ${
              filtreStatut === s.value ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/25"
            }`}
            style={filtreStatut === s.value ? undefined : { background: "#0D1D3A" }}
          >
            <p className="text-gray-400 text-xs">{s.label}</p>
            <p className="text-white font-bold text-xl mt-1">{stats[s.value] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="rounded-xl border border-white/10 p-4" style={{ background: "#0D1D3A" }}>
        <div className="flex flex-wrap gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRechercheActive(recherche.trim());
            }}
            className="flex-1 min-w-[240px] flex gap-2"
          >
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, ville, email, SIRET…"
              className={`${inputClass} flex-1`}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-blue-500 transition-colors"
              aria-label="Rechercher"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
          </form>

          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as Statut | "")}
            className={inputClass}
          >
            <option value="">Tous les statuts</option>
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} ({stats[s.value] ?? 0})
              </option>
            ))}
          </select>

          <select
            value={filtreDepartement}
            onChange={(e) => setFiltreDepartement(e.target.value)}
            className={inputClass}
          >
            <option value="">Tous les départements</option>
            {facettes.departements.map((d) => (
              <option key={d.valeur} value={d.valeur}>
                {d.valeur} ({d.nb})
              </option>
            ))}
          </select>

          <select value={filtreSource} onChange={(e) => setFiltreSource(e.target.value)} className={inputClass}>
            <option value="">Toutes les sources</option>
            {facettes.sources.map((s) => (
              <option key={s.valeur} value={s.valeur}>
                {s.valeur} ({s.nb})
              </option>
            ))}
          </select>

          {(rechercheActive || filtreStatut || filtreDepartement || filtreSource) && (
            <button
              onClick={() => {
                setRecherche("");
                setRechercheActive("");
                setFiltreStatut("");
                setFiltreDepartement("");
                setFiltreSource("");
              }}
              className="px-3 py-2 rounded-lg text-gray-400 text-sm hover:text-white transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <p className="text-gray-500 text-[11px] mt-3">
          {contactables} des {prospects.length} fiches affichées sont contactables par email
          (adresse valide et sans opposition).
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 text-sm" />
          <p className="text-red-300 text-xs">{erreur}</p>
        </div>
      )}

      {/* ── Barre d'actions groupées ── */}
      {selection.size > 0 && (
        <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 flex flex-wrap items-center gap-3">
          <p className="text-white text-sm font-semibold">{selection.size} sélectionné(s)</p>
          <select
            onChange={(e) => {
              if (e.target.value) actionGroupee({ action: "statut", statut: e.target.value as Statut });
              e.target.value = "";
            }}
            disabled={actionEnCours}
            className={inputClass}
            defaultValue=""
          >
            <option value="">Changer le statut…</option>
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => {
              const choix = e.target.value;
              e.target.value = "";
              if (!choix) return;
              // Sentinelle distincte : sans elle, « désassigner » et le libellé
              // du sélecteur partageraient la valeur vide.
              actionGroupee({ action: "assigner", ownerId: choix === "__aucun__" ? null : choix });
            }}
            disabled={actionEnCours}
            className={inputClass}
            defaultValue=""
          >
            <option value="">Assigner à…</option>
            <option value="__aucun__">— Retirer l&apos;assignation —</option>
            {facettes.commerciaux.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
          <button
            onClick={contacterSelection}
            disabled={actionEnCours}
            title="Créer une campagne adressée uniquement à ces centres"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPaperPlane} /> Contacter la sélection
          </button>
          <button
            onClick={() => setSelection(new Set())}
            className="text-gray-300 text-sm hover:text-white transition-colors ml-auto"
          >
            Tout désélectionner
          </button>
          {actionEnCours && <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400" />}
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0D1D3A" }}>
        {loading ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 text-2xl" />
          </div>
        ) : prospects.length === 0 ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faBullseye} className="text-gray-600 text-3xl mb-3" />
            <p className="text-gray-400 text-sm">
              Aucun prospect ne correspond. Importez un fichier pour démarrer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-gray-400 text-left text-xs">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={toutSelectionne}
                      onChange={basculerTout}
                      className="rounded border-white/20 bg-white/5"
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Centre</th>
                  <th className="px-3 py-3 font-medium">Contact</th>
                  <th className="px-3 py-3 font-medium">Localisation</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 font-medium">Envois</th>
                  <th className="px-3 py-3 font-medium">Suivi</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => {
                  const meta = statutMeta(p.statut);
                  const bloque = !p.email || !p.emailValide || p.unsubscribedAt;
                  return (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selection.has(p.id)}
                          onChange={() => basculer(p.id)}
                          className="rounded border-white/20 bg-white/5"
                          aria-label={`Sélectionner ${p.nom}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-white font-medium">{p.nom}</p>
                        {p.raisonSociale && p.raisonSociale !== p.nom && (
                          <p className="text-gray-500 text-xs">{p.raisonSociale}</p>
                        )}
                        {p.source && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-[10px]">
                            {p.source}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {p.email ? (
                          <p className="text-gray-300 text-xs flex items-center gap-1.5">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className={p.emailValide ? "text-gray-500" : "text-orange-400"}
                            />
                            <span className={p.emailValide ? "" : "line-through text-gray-500"}>
                              {p.email}
                            </span>
                          </p>
                        ) : (
                          <p className="text-gray-600 text-xs italic">pas d&apos;email</p>
                        )}
                        {p.telephone && (
                          <p className="text-gray-400 text-xs flex items-center gap-1.5 mt-0.5">
                            <FontAwesomeIcon icon={faPhone} className="text-gray-600" />
                            {p.telephone}
                          </p>
                        )}
                        {(p.contactPrenom || p.contactNom) && (
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            {[p.contactPrenom, p.contactNom].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-300 text-xs">
                        {p.ville ?? "—"}
                        {p.departement && <span className="text-gray-500"> ({p.departement})</span>}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={p.statut}
                          onChange={(e) => changerStatut(p.id, e.target.value as Statut)}
                          className={`px-2 py-1 rounded-md border text-xs font-medium focus:outline-none ${meta.classe}`}
                        >
                          {STATUTS.map((s) => (
                            <option key={s.value} value={s.value} className="bg-navy-900 text-white">
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {p.unsubscribedAt && (
                          <p className="text-gray-500 text-[10px] mt-1 flex items-center gap-1">
                            <FontAwesomeIcon icon={faUserSlash} /> opposition enregistrée
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <p className="text-gray-300">{p.nbEmailsEnvoyes} envoi(s)</p>
                        {p.nbEmailsEnvoyes > 0 && (
                          <p className="text-gray-500 text-[11px]">
                            {p.nbOuvertures} ouv. · {p.nbClics} clic(s)
                          </p>
                        )}
                        {bloque && (
                          <p className="text-orange-400/80 text-[10px] mt-1 flex items-center gap-1">
                            <FontAwesomeIcon icon={faBan} /> hors campagne
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400">
                        {p.owner ? `${p.owner.prenom} ${p.owner.nom}` : <span className="text-gray-600">—</span>}
                        {p.lastContactedAt && (
                          <p className="text-gray-600 text-[11px]">
                            {new Date(p.lastContactedAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 disabled:opacity-30 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} /> Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 text-xs hover:border-blue-500 disabled:opacity-30 transition-colors"
              >
                Suivant <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
