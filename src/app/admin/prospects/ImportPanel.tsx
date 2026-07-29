"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileArrowUp,
  faSpinner,
  faCircleCheck,
  faTriangleExclamation,
  faTableColumns,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface ChampDisponible {
  key: string;
  label: string;
}

interface Rapport {
  importId: string | null;
  totalRows: number;
  nbCrees: number;
  nbMisAJour: number;
  nbIgnores: number;
  nbErreurs: number;
  nbDoublonsFichier: number;
  erreurs: { ligne: number; motif: string }[];
  warnings: { ligne: number; motif: string }[];
}

interface AnalyseResponse {
  dryRun: boolean;
  format: string;
  filename: string;
  headers: string[];
  mapping: Record<string, string | null>;
  champsDisponibles: ChampDisponible[];
  apercu: Record<string, unknown>[];
  rapport: Rapport;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500";

/**
 * Import d'un fichier de prospects, en deux temps.
 *
 * L'analyse (« dry run ») n'écrit rien : elle sert à valider le mappage des
 * colonnes et à montrer ce qui sera créé, mis à jour ou rejeté. L'écriture ne
 * part qu'au second clic — importer 4 000 lignes mal mappées serait bien plus
 * coûteux à défaire qu'à vérifier.
 */
export default function ImportPanel({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [analyse, setAnalyse] = useState<AnalyseResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<"analyse" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [succes, setSucces] = useState<Rapport | null>(null);

  const reset = () => {
    setFile(null);
    setAnalyse(null);
    setMapping({});
    setError(null);
    setSucces(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const envoyer = async (dryRun: boolean) => {
    if (!file) {
      setError("Sélectionnez un fichier .xlsx, .csv ou .json.");
      return;
    }
    setBusy(dryRun ? "analyse" : "import");
    setError(null);

    const body = new FormData();
    body.append("file", file);
    body.append("dryRun", dryRun ? "true" : "false");
    body.append("overwrite", overwrite ? "true" : "false");
    if (source.trim()) body.append("source", source.trim());
    // Au second appel on renvoie le mappage éventuellement corrigé à l'écran.
    if (!dryRun || analyse) body.append("mapping", JSON.stringify(mapping));

    try {
      const res = await fetch("/api/admin/prospects/import", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "L'import a échoué.");
        if (data?.mapping) {
          setMapping(data.mapping);
        }
        return;
      }

      if (dryRun) {
        setAnalyse(data as AnalyseResponse);
        setMapping((data as AnalyseResponse).mapping);
      } else {
        setSucces((data as AnalyseResponse).rapport);
        setAnalyse(null);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        onImported();
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setBusy(null);
    }
  };

  const champs = analyse?.champsDisponibles ?? [];
  const colonnesMappees = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-white/10 p-6" style={{ background: "#0D1D3A" }}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faFileArrowUp} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold">Importer un fichier de prospects</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Excel (.xlsx), CSV ou JSON — 10 Mo et 50 000 lignes maximum. Les colonnes sont
            reconnues automatiquement, vous pouvez les corriger avant de valider.
          </p>
        </div>
      </div>

      {/* ── Résultat d'un import validé ── */}
      {succes && (
        <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-300 font-semibold text-sm">Import terminé</p>
              <p className="text-gray-300 text-xs mt-1">
                {succes.nbCrees} prospect(s) créé(s), {succes.nbMisAJour} mis à jour,{" "}
                {succes.nbIgnores} ignoré(s), {succes.nbErreurs} ligne(s) rejetée(s).
              </p>
            </div>
            <button onClick={() => setSucces(null)} className="text-gray-500 hover:text-white">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      )}

      {/* ── Choix du fichier ── */}
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className="block text-gray-400 text-xs mb-1.5">Fichier</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm,.csv,.json,text/csv,application/json"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setAnalyse(null);
              setError(null);
            }}
            className="w-full text-sm text-gray-300 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-semibold hover:file:bg-blue-700 file:cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Source <span className="text-gray-600">(étiquette)</span>
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="liste-prefecture-2026"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
          className="rounded border-white/20 bg-white/5"
        />
        <span className="text-gray-300 text-xs">
          Écraser les données existantes
          <span className="text-gray-500">
            {" "}
            — par défaut, seuls les champs vides sont complétés
          </span>
        </span>
      </label>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 mt-0.5 text-sm" />
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      {!analyse && (
        <button
          onClick={() => envoyer(true)}
          disabled={!file || busy !== null}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {busy === "analyse" ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Analyse…
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTableColumns} /> Analyser le fichier
            </>
          )}
        </button>
      )}

      {/* ── Prévisualisation ── */}
      {analyse && (
        <div className="space-y-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <span className="text-gray-400">
                Format <span className="text-white font-semibold">{analyse.format}</span>
              </span>
              <span className="text-gray-400">
                Lignes lues <span className="text-white font-semibold">{analyse.rapport.totalRows}</span>
              </span>
              <span className="text-gray-400">
                À créer <span className="text-green-400 font-semibold">{analyse.rapport.nbCrees}</span>
              </span>
              <span className="text-gray-400">
                À enrichir <span className="text-blue-400 font-semibold">{analyse.rapport.nbMisAJour}</span>
              </span>
              <span className="text-gray-400">
                Ignorées <span className="text-gray-300 font-semibold">{analyse.rapport.nbIgnores}</span>
              </span>
              <span className="text-gray-400">
                Rejetées <span className="text-orange-400 font-semibold">{analyse.rapport.nbErreurs}</span>
              </span>
            </div>
            {analyse.rapport.nbDoublonsFichier > 0 && (
              <p className="text-gray-500 text-[11px] mt-2">
                {analyse.rapport.nbDoublonsFichier} doublon(s) interne(s) au fichier — seule la
                première occurrence est retenue.
              </p>
            )}
          </div>

          {/* Mappage des colonnes */}
          <div>
            <p className="text-white text-sm font-semibold mb-1">
              Correspondance des colonnes{" "}
              <span className="text-gray-500 font-normal text-xs">
                ({colonnesMappees}/{analyse.headers.length} associée(s))
              </span>
            </p>
            <p className="text-gray-500 text-[11px] mb-3">
              Les colonnes laissées sur « Ignorer » ne sont pas importées.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {analyse.headers.map((header) => (
                <div key={header} className="flex items-center gap-2">
                  <span
                    className="text-gray-300 text-xs truncate flex-1 min-w-0"
                    title={header}
                  >
                    {header}
                  </span>
                  <select
                    value={mapping[header] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [header]: e.target.value || null }))
                    }
                    className="w-40 shrink-0 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Ignorer</option>
                    {champs.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu des lignes */}
          {analyse.apercu.length > 0 && (
            <div>
              <p className="text-white text-sm font-semibold mb-2">Aperçu des premières lignes</p>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-xs">
                  <thead className="bg-white/5">
                    <tr className="text-gray-400 text-left">
                      <th className="px-3 py-2 font-medium">Nom</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Téléphone</th>
                      <th className="px-3 py-2 font-medium">Ville</th>
                      <th className="px-3 py-2 font-medium">Dép.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyse.apercu.map((row, i) => (
                      <tr key={i} className="border-t border-white/5 text-gray-300">
                        <td className="px-3 py-2">{String(row.nom ?? "—")}</td>
                        <td className="px-3 py-2">{String(row.email ?? "—")}</td>
                        <td className="px-3 py-2">{String(row.telephone ?? "—")}</td>
                        <td className="px-3 py-2">{String(row.ville ?? "—")}</td>
                        <td className="px-3 py-2">{String(row.departement ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lignes rejetées */}
          {analyse.rapport.erreurs.length > 0 && (
            <details className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-3">
              <summary className="text-orange-300 text-xs font-semibold cursor-pointer">
                {analyse.rapport.nbErreurs} ligne(s) rejetée(s) — voir le détail
              </summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {analyse.rapport.erreurs.map((e, i) => (
                  <li key={i} className="text-gray-400 text-[11px]">
                    Ligne {e.ligne} — {e.motif}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {analyse.rapport.warnings.length > 0 && (
            <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <summary className="text-gray-300 text-xs font-semibold cursor-pointer">
                {analyse.rapport.warnings.length} avertissement(s) non bloquant(s)
              </summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {analyse.rapport.warnings.map((w, i) => (
                  <li key={i} className="text-gray-400 text-[11px]">
                    Ligne {w.ligne} — {w.motif}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => envoyer(false)}
              disabled={busy !== null || (analyse.rapport.nbCrees === 0 && analyse.rapport.nbMisAJour === 0)}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {busy === "import" ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Import…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCircleCheck} /> Confirmer l&apos;import
                </>
              )}
            </button>
            <button
              onClick={() => envoyer(true)}
              disabled={busy !== null}
              className="px-5 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm font-semibold hover:border-blue-500 hover:text-white disabled:opacity-40 transition-colors"
            >
              Réanalyser avec ce mappage
            </button>
            <button
              onClick={reset}
              disabled={busy !== null}
              className="px-5 py-2.5 rounded-lg text-gray-400 text-sm hover:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
