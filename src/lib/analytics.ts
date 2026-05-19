/**
 * BYS Formation - Couche analytics / ads / tracking
 *
 * Centralise l'instrumentation Google Analytics 4, Google Tag Manager,
 * Google Ads (conversion + remarketing) et Meta Pixel.
 *
 * Le chargement réel des scripts est conditionné par le consentement RGPD
 * (voir components/analytics/ConsentBanner.tsx + Consent Mode v2 Google).
 *
 * Toutes les fonctions sont safe-by-default : si la clé n'est pas configurée
 * ou si on tourne côté serveur, elles ne font rien.
 */

// ─── Types ─────────────────────────────────────────────────────────

type ConsentValue = "granted" | "denied";

export interface ConsentState {
  ad_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  analytics_storage: ConsentValue;
  functionality_storage: ConsentValue;
  personalization_storage: ConsentValue;
  security_storage: ConsentValue;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
    _fbq?: unknown;
  }
}

// ─── Identifiants (lus depuis les env vars publiques) ──────────────

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
export const GOOGLE_ADS_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ?? "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export const hasGA4 = () => Boolean(GA4_ID);
export const hasGTM = () => Boolean(GTM_ID);
export const hasGoogleAds = () => Boolean(GOOGLE_ADS_ID);
export const hasMetaPixel = () => Boolean(META_PIXEL_ID);
export const hasAnyTracking = () =>
  hasGA4() || hasGTM() || hasGoogleAds() || hasMetaPixel();

// ─── Consent Mode v2 — état par défaut (avant choix utilisateur) ───

export const DEFAULT_CONSENT_DENIED: ConsentState = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  personalization_storage: "denied",
  security_storage: "granted",
};

export const CONSENT_ALL_GRANTED: ConsentState = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  functionality_storage: "granted",
  personalization_storage: "granted",
  security_storage: "granted",
};

export const CONSENT_STORAGE_KEY = "bys_consent_v1";

// ─── Helpers de base ───────────────────────────────────────────────

function safeGtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  } else {
    window.dataLayer.push(args as unknown as Record<string, unknown>);
  }
}

function safeFbq(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    (window.fbq as (...a: unknown[]) => void)(...args);
  }
}

// ─── Consent ───────────────────────────────────────────────────────

export function updateConsent(state: Partial<ConsentState>) {
  safeGtag("consent", "update", state);
  // Meta Pixel : revoke/grant cookies
  if (hasMetaPixel() && typeof window !== "undefined") {
    if (state.ad_storage === "denied") {
      safeFbq("consent", "revoke");
    } else if (state.ad_storage === "granted") {
      safeFbq("consent", "grant");
    }
  }
}

export function loadConsentFromStorage(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function saveConsentToStorage(state: ConsentState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponible (mode privé Safari, etc.)
  }
}

// ─── Page view ─────────────────────────────────────────────────────

export function trackPageView(url: string, title?: string) {
  if (hasGA4()) {
    safeGtag("event", "page_view", {
      page_path: url,
      page_title: title,
      page_location: typeof window !== "undefined" ? window.location.href : url,
    });
  }
  if (hasMetaPixel()) {
    safeFbq("track", "PageView");
  }
}

// ─── Events génériques ─────────────────────────────────────────────

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
) {
  if (hasGA4() || hasGTM()) {
    safeGtag("event", name, params ?? {});
  }
}

// ─── Conversions e-commerce (réservation stage) ────────────────────

export interface BeginCheckoutPayload {
  sessionId: string;
  formationSlug: string;
  formationTitle: string;
  price: number;
  centreVille?: string;
}

export function trackBeginCheckout(p: BeginCheckoutPayload) {
  // GA4 ecommerce
  trackEvent("begin_checkout", {
    currency: "EUR",
    value: p.price,
    items: [
      {
        item_id: p.sessionId,
        item_name: p.formationTitle,
        item_category: "stage-recuperation-points",
        item_variant: p.centreVille,
        price: p.price,
        quantity: 1,
      },
    ],
  });
  // Meta Pixel
  if (hasMetaPixel()) {
    safeFbq("track", "InitiateCheckout", {
      content_ids: [p.sessionId],
      content_name: p.formationTitle,
      content_category: "stage-recuperation-points",
      currency: "EUR",
      value: p.price,
    });
  }
}

export interface PurchasePayload {
  reservationId: string;
  sessionId: string;
  formationTitle: string;
  price: number;
  centreVille?: string;
  email?: string;
}

/**
 * À appeler sur la page de confirmation de réservation.
 * Déclenche GA4 purchase, Meta Pixel Purchase et la conversion Google Ads.
 */
export function trackPurchase(p: PurchasePayload) {
  // GA4
  trackEvent("purchase", {
    transaction_id: p.reservationId,
    currency: "EUR",
    value: p.price,
    items: [
      {
        item_id: p.sessionId,
        item_name: p.formationTitle,
        item_category: "stage-recuperation-points",
        item_variant: p.centreVille,
        price: p.price,
        quantity: 1,
      },
    ],
  });

  // Google Ads conversion
  if (hasGoogleAds() && GOOGLE_ADS_CONVERSION_LABEL) {
    safeGtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
      value: p.price,
      currency: "EUR",
      transaction_id: p.reservationId,
    });
  }

  // Meta Pixel
  if (hasMetaPixel()) {
    safeFbq("track", "Purchase", {
      content_ids: [p.sessionId],
      content_name: p.formationTitle,
      content_type: "product",
      currency: "EUR",
      value: p.price,
    });
  }
}

// ─── Leads (formulaire contact, demande info) ──────────────────────

export function trackLead(source: string, extra?: Record<string, unknown>) {
  trackEvent("generate_lead", { source, ...extra });
  if (hasMetaPixel()) {
    safeFbq("track", "Lead", { source, ...extra });
  }
}

// ─── Recherche ─────────────────────────────────────────────────────

export function trackSearch(query: string, resultsCount?: number) {
  trackEvent("search", { search_term: query, results: resultsCount });
  if (hasMetaPixel()) {
    safeFbq("track", "Search", { search_string: query });
  }
}

// ─── View item (consultation d'une fiche formation) ────────────────

export function trackViewItem(
  itemId: string,
  itemName: string,
  price?: number,
) {
  trackEvent("view_item", {
    currency: "EUR",
    value: price,
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        item_category: "stage-recuperation-points",
        price,
        quantity: 1,
      },
    ],
  });
  if (hasMetaPixel()) {
    safeFbq("track", "ViewContent", {
      content_ids: [itemId],
      content_name: itemName,
      content_type: "product",
      currency: "EUR",
      value: price,
    });
  }
}
