import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes (like shadcn cn)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in euros: 230 -> "230 \u20ac", 1500.5 -> "1 500,50 \u20ac"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format date in French
 * - 'long' (default): "10 avril 2026"
 * - 'short': "10/04/2026"
 */
export function formatDate(
  date: Date | string,
  format: "long" | "short" = "long"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "short") {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Generate URL-friendly slug
 * "Stage r\u00e9cup\u00e9ration de points" -> "stage-recuperation-de-points"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
    .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "\u2026";
}

/**
 * Generate reservation number: "BYS-2026-XXXX"
 */
export function generateReservationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BYS-${year}-${random}`;
}

/**
 * Escape HTML special characters to prevent XSS in HTML email/templates.
 * Encodes: & < > " '
 *
 * Use this on any user-supplied text before injecting into raw HTML strings.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Minimal HTML sanitizer (whitelist) for user-authored email templates.
 *
 * Strips:
 *   - <script>, <style>, <iframe>, <object>, <embed>, <link>, <meta>, <form>
 *   - all event handlers (onclick=, onerror=, …)
 *   - javascript: / data: URLs (except data:image/...)
 *
 * Keeps common formatting tags emitted by TipTap.
 * NOTE: This is a server-side defensive layer; do NOT rely on this alone.
 * For maximum safety, use a proper lib (DOMPurify isomorphic) in a follow-up.
 */
export function sanitizeHtml(html: string): string {
  let out = html;
  // Remove dangerous tags entirely (with content)
  out = out.replace(/<\/?(?:script|style|iframe|object|embed|link|meta|form)[^>]*>/gi, "");
  out = out.replace(/<\/?(?:script|style|iframe|object|embed|link|meta|form)>/gi, "");
  // Remove event handlers (onclick=, onerror=, etc.)
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Remove javascript: URLs
  out = out.replace(/(href|src|action)\s*=\s*["']\s*javascript:[^"']*["']/gi, "$1=\"#\"");
  // Remove data: URLs except images
  out = out.replace(/(href|src|action)\s*=\s*["']\s*data:(?!image\/)[^"']*["']/gi, "$1=\"#\"");
  return out;
}

/**
 * Calculate commission from an amount and a rate (percentage)
 */
export function calculateCommission(
  amount: number,
  rate: number
): { commission: number; centreAmount: number } {
  const commission = Math.round(amount * (rate / 100) * 100) / 100;
  const centreAmount = Math.round((amount - commission) * 100) / 100;
  return { commission, centreAmount };
}

/**
 * Resolve the effective commission rate for a given centre.
 *
 * Order of precedence:
 *   1. centre.commissionRateOverride (per-centre negotiated rate, set by platform admin)
 *   2. process.env.COMMISSION_RATE  (global platform rate)
 *   3. 0.1 fallback                 (10%)
 *
 * Returns a fraction in [0, 1] (e.g. 0.08 for 8%).
 */
export function getCommissionRate(centre: { commissionRateOverride: number | null }): number {
  if (centre.commissionRateOverride !== null && centre.commissionRateOverride !== undefined) {
    return centre.commissionRateOverride;
  }
  return Number(process.env.COMMISSION_RATE ?? 0.1);
}
