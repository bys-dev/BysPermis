import { NextRequest, NextResponse } from "next/server"
import { Auth0Client } from "@auth0/nextjs-auth0/server"

// ─── Auth0 client for proxy layer (no Prisma import) ─────────
const auth0 = new Auth0Client()

// ─── Routes that require authentication ──────────────────────

const PROTECTED_PATTERNS = [
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

export async function proxy(request: NextRequest) {
  const authResponse = await auth0.middleware(request)

  const { pathname } = request.nextUrl

  // Public route — pass through
  if (!isProtectedRoute(pathname)) {
    return authResponse
  }

  // Protected route — check session exists
  const session = await auth0.getSession(request)

  if (!session) {
    const loginUrl = new URL("/connexion", request.url)
    loginUrl.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control is handled by the pages/API routes themselves
  // (requireAuth, requireCentre, requireAdmin helpers in lib/auth0.ts)
  return authResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
