const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

/** Logo plateforme BYS (footer / mentions, pas en-tête centre). */
export const PLATFORM_LOGO_URL = `${APP_URL}/colored-logo.png`;

export function toAbsoluteUrl(u: string | null | undefined): string | undefined {
  if (!u?.trim()) return undefined;
  const trimmed = u.trim();
  if (trimmed.startsWith("http")) return trimmed;
  return `${APP_URL}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/**
 * react-pdf ne gère pas les SVG — PNG/JPEG/WebP uniquement.
 * Les URLs Vercel Blob sans extension sont acceptées (upload centre).
 */
export function isPdfSafeImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes(".svg")) return false;
  if (/\.(png|jpe?g|webp)(\?|$)/i.test(url)) return true;
  if (lower.includes("blob.vercel-storage.com")) return true;
  if (lower.includes("/uploads/centres/")) return true;
  return false;
}

/** URL absolue du logo centre utilisable dans un PDF, ou undefined. */
export function resolveCentreLogoUrl(logo: string | null | undefined): string | undefined {
  const absolute = toAbsoluteUrl(logo);
  if (!absolute || !isPdfSafeImageUrl(absolute)) return undefined;
  return absolute;
}

/** URL absolue du cachet / signature numérique centre pour les PDF, ou undefined. */
export function resolveCentreSealUrl(seal: string | null | undefined): string | undefined {
  const absolute = toAbsoluteUrl(seal);
  if (!absolute || !isPdfSafeImageUrl(absolute)) return undefined;
  return absolute;
}

/** Initiales pour l'en-tête quand le centre n'a pas de logo compatible PDF. */
export function centreInitials(displayName: string): string {
  const cleaned = displayName.replace(/^TEST\s*[—-]\s*/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return cleaned.slice(0, 3).toUpperCase();
}
