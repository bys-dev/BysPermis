"use client";

/**
 * Aperçu visuel, en direct, de l'email de campagne.
 *
 * Le rendu est fait par le serveur (`/api/admin/campagnes/apercu`), avec le même
 * moteur et le même gabarit que l'envoi réel : ce qui s'affiche ici est
 * exactement ce que reçoit le centre — variables résolues, logo, pied de page
 * et lien de désinscription compris. Le document est isolé dans une iframe
 * `sandbox` pour que ses styles ne débordent pas sur l'admin (et inversement).
 */

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faDesktop,
  faMobileScreen,
  faAlignLeft,
  faXmark,
  faTriangleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

type Affichage = "bureau" | "mobile" | "texte";
type Source = "exemple" | "reel";

const LARGEURS: Record<Exclude<Affichage, "texte">, number> = { bureau: 600, mobile: 375 };
/** Hauteur visible du cadre, en pixels. */
const HAUTEUR = 640;
/** Délai après la dernière frappe avant de relancer le rendu. */
const DEBOUNCE_MS = 450;

interface Rendu {
  sujet: string;
  html: string;
  text: string;
  inconnues: string[];
  vides: string[];
  erreurs: string[];
  centre: string | null;
  exemple: boolean;
}

/** Les liens de l'aperçu s'ouvrent dans un nouvel onglet plutôt que dans le cadre. */
function avecCibleExterne(html: string): string {
  return html.replace(/<head>/i, '<head><base target="_blank">');
}

export default function ApercuEmail({
  sujet,
  contenu,
  fromName,
  prospectId,
  onEffacerProspect,
}: {
  sujet: string;
  contenu: string;
  fromName: string;
  /** Destinataire précis à utiliser (clic « aperçu » sur une ligne). */
  prospectId?: string | null;
  onEffacerProspect?: () => void;
}) {
  const [affichage, setAffichage] = useState<Affichage>("bureau");
  const [source, setSource] = useState<Source>("exemple");
  const [rendu, setRendu] = useState<Rendu | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [largeurDispo, setLargeurDispo] = useState(600);

  const cadreRef = useRef<HTMLDivElement>(null);

  // ── Largeur disponible : le cadre 600 px est réduit à l'échelle s'il déborde ──
  useEffect(() => {
    const el = cadreRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entree]) => setLargeurDispo(entree.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Rendu serveur, relancé après une courte pause de frappe ──
  useEffect(() => {
    const controleur = new AbortController();
    const minuteur = setTimeout(async () => {
      setChargement(true);
      try {
        const res = await fetch("/api/admin/campagnes/apercu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controleur.signal,
          body: JSON.stringify({
            sujet,
            contenu,
            fromName: fromName || null,
            ...(prospectId ? { prospectId } : source === "exemple" ? { exemple: true } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErreur(data?.error ?? "Aperçu impossible.");
          return;
        }
        setErreur(null);
        setRendu({
          sujet: data.sujet ?? "",
          html: data.html ?? "",
          text: data.text ?? "",
          inconnues: data.variablesInconnues ?? [],
          vides: data.variablesVides ?? [],
          erreurs: data.validation?.errors ?? [],
          centre: data.prospectUtilise?.nom ?? null,
          exemple: !!data.exemple,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setErreur("Impossible de générer l'aperçu.");
      } finally {
        if (!controleur.signal.aborted) setChargement(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(minuteur);
      controleur.abort();
    };
  }, [sujet, contenu, fromName, prospectId, source]);

  const largeur = affichage === "texte" ? 0 : LARGEURS[affichage];
  const echelle = largeur ? Math.min(1, largeurDispo / largeur) : 1;

  const boutonAffichage = (valeur: Affichage, icone: typeof faDesktop, libelle: string) => (
    <button
      type="button"
      onClick={() => setAffichage(valeur)}
      aria-pressed={affichage === valeur}
      title={libelle}
      className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors ${
        affichage === valeur ? "bg-blue-500/25 text-blue-100" : "text-slate-300 hover:text-white"
      }`}
    >
      <FontAwesomeIcon icon={icone} />
      <span className="hidden sm:inline">{libelle}</span>
    </button>
  );

  const messageVides =
    rendu && rendu.vides.length > 0
      ? `Vide pour ce destinataire : ${rendu.vides.map((v) => `{{${v}}}`).join(", ")} — ajoutez une valeur de repli, ex. {{ville|votre secteur}}.`
      : null;
  const aSignaler = !!erreur || (rendu?.erreurs.length ?? 0) > 0 || !!messageVides;

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden" style={{ background: "#1C2D4F" }}>
      {/* ── Barre d'outils ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-white text-xs font-semibold">
          Aperçu du rendu
          {chargement && <FontAwesomeIcon icon={faSpinner} spin className="text-blue-300" />}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/5 border border-white/10 p-0.5">
          {boutonAffichage("bureau", faDesktop, "Bureau")}
          {boutonAffichage("mobile", faMobileScreen, "Mobile")}
          {boutonAffichage("texte", faAlignLeft, "Texte")}
        </div>
      </div>

      {/* ── Destinataire utilisé pour la personnalisation ── */}
      <div className="px-3 py-2 border-b border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-400">Données :</span>
        {prospectId ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-100">
            {rendu?.centre ?? "Destinataire choisi"}
            {onEffacerProspect && (
              <button
                type="button"
                onClick={onEffacerProspect}
                title="Revenir à l'aperçu général"
                className="text-blue-200 hover:text-white"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </span>
        ) : (
          <>
            {(["exemple", "reel"] as Source[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`px-2 py-1 rounded-md border transition-colors ${
                  source === s
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-100"
                    : "bg-white/5 border-white/10 text-slate-300 hover:border-white/25"
                }`}
              >
                {s === "exemple" ? "Centre fictif" : "Vrai prospect"}
              </button>
            ))}
            {source === "reel" && rendu && (
              <span className="text-slate-400">
                {rendu.exemple ? "(fichier vide — centre fictif)" : rendu.centre}
              </span>
            )}
          </>
        )}
      </div>

      {/* ── En-tête du message, comme dans une boîte de réception ── */}
      <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 space-y-0.5">
        <p className="text-[11px] text-slate-400">
          De : <span className="text-slate-200">{fromName.trim() || "BYS Permis"}</span>
        </p>
        <p className="text-sm text-white font-medium break-words">
          {rendu?.sujet || <span className="text-slate-400 font-normal">(objet vide)</span>}
        </p>
      </div>

      {aSignaler && (
        <div className="px-3 py-2 border-b border-white/10 space-y-1">
          {erreur && (
            <p className="text-red-300 text-[11px] flex items-start gap-1.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> {erreur}
            </p>
          )}
          {rendu?.erreurs.map((e) => (
            <p key={e} className="text-red-300 text-[11px] flex items-start gap-1.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" /> {e}
            </p>
          ))}
          {messageVides && (
            <p className="text-slate-300 text-[11px] flex items-start gap-1.5">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 text-blue-300" />
              {messageVides}
            </p>
          )}
        </div>
      )}

      {/* ── Cadre de rendu ── */}
      <div ref={cadreRef} className="bg-[#F1F5F9]" style={{ height: HAUTEUR }}>
        {!rendu ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Génération de l&apos;aperçu…
          </div>
        ) : affichage === "texte" ? (
          <pre className="h-full overflow-auto p-4 bg-white text-slate-800 text-xs leading-relaxed whitespace-pre-wrap break-words font-mono">
            {rendu.text}
          </pre>
        ) : (
          <div className="mx-auto overflow-hidden" style={{ width: largeur * echelle, height: HAUTEUR }}>
            <iframe
              title="Aperçu de l'email"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              srcDoc={avecCibleExterne(rendu.html)}
              style={{
                width: largeur,
                height: HAUTEUR / echelle,
                transform: `scale(${echelle})`,
                transformOrigin: "top left",
                border: 0,
                background: "#F1F5F9",
                display: "block",
              }}
            />
          </div>
        )}
      </div>
      {affichage !== "texte" && echelle < 1 && (
        <p className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-white/10">
          Largeur {largeur} px affichée à {Math.round(echelle * 100)} %.
        </p>
      )}
    </div>
  );
}
