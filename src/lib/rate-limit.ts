/**
 * Rate limit minimaliste par IP, en mémoire.
 *
 * Limite: sur Vercel serverless, chaque instance froide a son propre compteur,
 * donc un attaquant qui touche plusieurs instances contourne cette limite.
 * Pour une vraie protection : Upstash Redis + @upstash/ratelimit, ou Vercel Firewall.
 *
 * Utile malgré tout contre les bots basiques et les abus du même client.
 */

import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export type RateLimitOptions = {
  /** Nombre max de requêtes par fenêtre */
  max: number;
  /** Fenêtre en ms */
  windowMs: number;
  /** Identifiant du bucket (par défaut : IP). Ajouter un suffixe pour scoping par route. */
  keyPrefix?: string;
};

export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${opts.keyPrefix ?? "default"}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  if (bucket.count >= opts.max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": opts.max.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(bucket.resetAt / 1000).toString(),
        },
      },
    );
  }

  bucket.count += 1;
  return null;
}

// Nettoyage périodique (une fois par requête, probabiliste)
if (Math.random() < 0.01) {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}
