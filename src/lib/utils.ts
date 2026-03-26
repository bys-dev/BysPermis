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
