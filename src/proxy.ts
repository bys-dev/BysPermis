import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0-client"

// ─── Routes that require authentication ──────────────────────

const PROTECTED_PATTERNS = [
  /^\/dashboard(\/|$)/,
  /^\/espace-centre(\/|$)/,
  /^\/espace-eleve(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/plateforme(\/|$)/,
  /^\/support(\/|$)/,
  /^\/reserver\/[^/]+\/donnees(\/|$)/,
  /^\/reserver\/[^/]+\/paiement(\/|$)/,
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATTERNS.some((p) => p.test(pathname))
}

// ─── Security headers ────────────────────────────────────────
// CSP : autorise Stripe (js.stripe.com, hooks.stripe.com, api.stripe.com)
// et Auth0 (*.auth0.com). 'unsafe-inline' sur script/style nécessaire pour
// Next/Tailwind/Stripe Elements (peut être resserré avec un nonce plus tard).

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.auth0.com https://*.vercel-insights.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.auth0.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.stripe.com https://*.auth0.com https://*.vercel-insights.com https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://api-adresse.data.gouv.fr",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data: https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.auth0.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(self)",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v)
  }
  return res
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip security headers + auth for webhook endpoints (Stripe needs raw response)
  // — webhooks/stripe verifies its own signature, no need for CSP on a JSON response.
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next()
  }

  const authResponse = await auth0.middleware(request)

  // Public route — pass through with security headers
  if (!isProtectedRoute(pathname)) {
    return applySecurityHeaders(authResponse)
  }

  // Protected route — check session exists
  const session = await auth0.getSession(request)

  if (!session) {
    const loginUrl = new URL("/connexion", request.url)
    loginUrl.searchParams.set("returnTo", pathname)
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // Role-based access control is handled by the pages/API routes themselves
  // (requireAuth, requireCentre, requireAdmin helpers in lib/auth0.ts)
  return applySecurityHeaders(authResponse)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/webhooks/.*).*)",
  ],
}
