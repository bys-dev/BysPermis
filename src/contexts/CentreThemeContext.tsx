"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CENTRE_THEME_UPDATE_EVENT,
  resolveCentreTheme,
  type CentreBranding,
} from "@/lib/centre-theme";

type CentreThemeContextValue = ReturnType<typeof resolveCentreTheme> & {
  loading: boolean;
  refresh: () => void;
};

const CentreThemeContext = createContext<CentreThemeContextValue | null>(null);

export function CentreThemeProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<CentreBranding | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/centre/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) {
          setBranding({
            nom: data.nom,
            logo: data.logo,
            bannerImage: data.bannerImage,
            couleurPrimaire: data.couleurPrimaire,
            couleurSecondaire: data.couleurSecondaire,
          });
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CentreBranding>).detail;
      if (detail) {
        setBranding((prev) => ({ ...prev, ...detail }));
        return;
      }
      refresh();
    };
    window.addEventListener(CENTRE_THEME_UPDATE_EVENT, handler);
    return () => window.removeEventListener(CENTRE_THEME_UPDATE_EVENT, handler);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...resolveCentreTheme(branding),
      loading,
      refresh,
    }),
    [branding, loading, refresh],
  );

  return (
    <CentreThemeContext.Provider value={value}>{children}</CentreThemeContext.Provider>
  );
}

export function useCentreTheme() {
  const ctx = useContext(CentreThemeContext);
  if (!ctx) {
    throw new Error("useCentreTheme must be used within CentreThemeProvider");
  }
  return ctx;
}

/** Preview live depuis l'onglet Design (profil centre) */
export function dispatchCentreThemePreview(branding: CentreBranding) {
  window.dispatchEvent(
    new CustomEvent(CENTRE_THEME_UPDATE_EVENT, { detail: branding }),
  );
}

export function notifyCentreThemeSaved() {
  window.dispatchEvent(new Event(CENTRE_THEME_UPDATE_EVENT));
}
