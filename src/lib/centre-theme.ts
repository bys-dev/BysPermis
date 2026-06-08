export type CentreBranding = {
  nom?: string | null;
  logo?: string | null;
  bannerImage?: string | null;
  couleurPrimaire?: string | null;
  couleurSecondaire?: string | null;
};

export const DEFAULT_CENTRE_PRIMARY = "#3B82F6";
export const DEFAULT_CENTRE_SECONDARY = "#1E40AF";

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

export function resolveCentreTheme(branding: CentreBranding | null | undefined) {
  const primary = branding?.couleurPrimaire || DEFAULT_CENTRE_PRIMARY;
  const secondary = branding?.couleurSecondaire || DEFAULT_CENTRE_SECONDARY;
  const primaryRgb = hexToRgb(primary) ?? [59, 130, 246];
  const secondaryRgb = hexToRgb(secondary) ?? [30, 64, 175];

  return {
    primary,
    secondary,
    primaryRgb: primaryRgb.join(", "),
    secondaryRgb: secondaryRgb.join(", "),
    logo: branding?.logo ?? null,
    bannerImage: branding?.bannerImage ?? null,
    nom: branding?.nom ?? null,
  };
}

/** CSS custom properties injectées sur le conteneur espace-centre */
export function centreThemeCssVars(
  branding: CentreBranding | null | undefined,
): Record<string, string> {
  const theme = resolveCentreTheme(branding);
  return {
    ["--centre-primary" as string]: theme.primary,
    ["--centre-secondary" as string]: theme.secondary,
    ["--centre-primary-rgb" as string]: theme.primaryRgb,
    ["--centre-secondary-rgb" as string]: theme.secondaryRgb,
  };
}

export const CENTRE_THEME_UPDATE_EVENT = "centre-theme-update";
