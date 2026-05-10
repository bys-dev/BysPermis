/**
 * Rate limit avec deux backends :
 *   1. Upstash Redis (@upstash/ratelimit) si UPSTASH_REDIS_REST_URL +
 *      UPSTASH_REDIS_REST_TOKEN sont définis. Production-grade : compteur
 *      partagé entre instances serverless.
 *   2. Fallback in-memory : utile en dev, mais NON SÛR en production
 *      multi-instance (chaque cold start a son propre compteur).
 *
 * Pour activer Upstash :
 *   1. npm install @upstash/ratelimit @upstash/redis
 *   2. Définir UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
 */

import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const HAS_UPSTASH = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Lazy-loaded Upstash limiters (instancié à la première utilisation)
type UpstashLimiter = {
  limit: (key: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
};

const upstashLimiterCache = new Map<string, UpstashLimiter>();

async function getUpstashLimiter(opts: RateLimitOptions): Promise<UpstashLimiter | null> {
  if (!HAS_UPSTASH) return null;
  const cacheKey = `${opts.max}:${opts.windowMs}:${opts.keyPrefix ?? "default"}`;
  const cached = upstashLimiterCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Imports dynamiques par variable string pour éviter la résolution TS
    // si les libs ne sont pas installées. À installer via :
    //   npm install @upstash/ratelimit @upstash/redis
    const rlName = "@upstash/" + "ratelimit";
    const redisName = "@upstash/" + "redis";
    const [rlMod, redisMod] = await Promise.all([
      import(rlName),
      import(redisName),
    ]);
    const { Ratelimit } = rlMod as {
      Ratelimit: (new (config: unknown) => UpstashLimiter) & {
        slidingWindow: (max: number, window: string) => unknown;
      };
    };
    const { Redis } = redisMod as {
      Redis: new (config: { url: string; token: string }) => unknown;
    };
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.max, `${opts.windowMs} ms`),
      analytics: false,
      prefix: `bys:${opts.keyPrefix ?? "default"}`,
    });
    const wrapper: UpstashLimiter = {
      limit: async (key: string) => limiter.limit(key),
    };
    upstashLimiterCache.set(cacheKey, wrapper);
    return wrapper;
  } catch (err) {
    console.warn(
      "[rate-limit] @upstash/ratelimit non installé — fallback in-memory.",
      err instanceof Error ? err.message : ""
    );
    return null;
  }
}

let WARNED_INMEMORY = false;
function warnInMemoryOnce() {
  if (WARNED_INMEMORY) return;
  WARNED_INMEMORY = true;
  if (process.env.NODE_ENV === "production" && !HAS_UPSTASH) {
    console.warn(
      "[rate-limit] WARNING: in-memory fallback en production. " +
        "Définir UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN pour un rate-limit fiable."
    );
  }
}

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

/**
 * Limite synchrone : compatible avec l'usage existant `if (limited) return limited`.
 * Fallback in-memory uniquement (Upstash est asynchrone).
 * Pour Upstash, utiliser rateLimitAsync().
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): NextResponse | null {
  warnInMemoryOnce();

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

/**
 * Version asynchrone qui utilise Upstash si configuré, sinon in-memory.
 * À utiliser sur les endpoints sensibles en production.
 */
export async function rateLimitAsync(
  req: NextRequest,
  opts: RateLimitOptions,
): Promise<NextResponse | null> {
  if (HAS_UPSTASH) {
    const limiter = await getUpstashLimiter(opts);
    if (limiter) {
      const ip = getClientIp(req);
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Trop de requêtes. Réessayez plus tard." },
          {
            status: 429,
            headers: {
              "Retry-After": retryAfter.toString(),
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
            },
          },
        );
      }
      return null;
    }
  }
  return rateLimit(req, opts);
}

// Nettoyage périodique (une fois par requête, probabiliste)
if (Math.random() < 0.01) {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}
