"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

type LoadingOverlayProps = {
  /** Afficher l'overlay */
  show: boolean;
  /** Texte sous le spinner (optionnel) */
  label?: string;
  /** Couvrir tout le viewport (navigation Next.js, layouts) */
  fullScreen?: boolean;
  /** Opacité du voile (0–1) */
  backdropOpacity?: number;
  className?: string;
};

/**
 * Overlay de chargement — le contenu en dessous reste visible (légèrement atténué).
 * À placer dans un conteneur `relative`.
 */
export default function LoadingOverlay({
  show,
  label,
  fullScreen = false,
  backdropOpacity = 0.55,
  className = "",
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "Chargement en cours"}
      className={`z-50 flex items-center justify-center ${
        fullScreen ? "fixed inset-0" : "absolute inset-0 min-h-[120px]"
      } ${className}`}
      style={{ background: `rgba(10, 22, 40, ${backdropOpacity})` }}
    >
      <div
        className="flex flex-col items-center gap-3 rounded-2xl px-8 py-6 shadow-2xl border border-white/10"
        style={{
          background: "rgba(13, 29, 58, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          <FontAwesomeIcon
            icon={faSpinner}
            className="absolute inset-0 m-auto w-5 h-5 text-blue-400 animate-spin opacity-0"
            aria-hidden
          />
        </div>
        {label && <p className="text-sm text-gray-300 font-medium">{label}</p>}
      </div>
    </div>
  );
}

type LoadingContainerProps = {
  loading: boolean;
  label?: string;
  children: React.ReactNode;
  /** Hauteur minimale pendant le chargement initial */
  minHeight?: string;
  className?: string;
};

/**
 * Enveloppe une zone de page : le contenu (titres, structure) reste affiché,
 * l'overlay se superpose pendant le chargement.
 */
export function LoadingContainer({
  loading,
  label,
  children,
  minHeight = "min-h-[280px]",
  className = "",
}: LoadingContainerProps) {
  return (
    <div className={`relative ${minHeight} ${className}`}>
      <div
        className={`transition-opacity duration-200 ${
          loading ? "opacity-40 pointer-events-none select-none" : "opacity-100"
        }`}
        aria-hidden={loading}
      >
        {children}
      </div>
      <LoadingOverlay show={loading} label={label} />
    </div>
  );
}

/** Squelette discret pour titres de page pendant le chargement initial */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="h-8 w-56 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-80 max-w-full bg-slate-100 rounded" />
    </div>
  );
}

/** Grille KPI squelette (dashboards) */
export function KpiGridSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div
      className={`grid gap-4 mb-8 animate-pulse ${
        cols === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"
      }`}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-xl bg-slate-100 border border-slate-200"
        />
      ))}
    </div>
  );
}
