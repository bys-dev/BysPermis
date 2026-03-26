import { NextRequest, NextResponse } from "next/server"
import { Auth0Client } from "@auth0/nextjs-auth0/server"

// ─── Auth0 client for proxy layer (no Prisma import) ─────────
const auth0 = new Auth0Client()

// ─── Role-based route protection rules ────────────────────────────

type RoleRule = {
  pattern: RegExp
  allowedRoles?: string[]
}

const PROTECTED_ROUTES: RoleRule[] = [
  { pattern: /^\/espace-centre(\/|$)/, allowedRoles: ["CENTRE", "ADMIN"] },
  { pattern: /^\/admin(\/|$)/, allowedRoles: ["ADMIN"] },
  { pattern: /^\/espace-eleve(\/|$)/, allowedRoles: ["ELEVE", "CENTRE", "ADMIN"] },
  { pattern: /^\/support(\/|$)/ },
  { pattern: /^\/reserver\/[^/]+\/donnees(\/|$)/ },
  { pattern: /^\/reserver\/[^/]+\/paiement(\/|$)/ },
]

function findRouteRule(pathname: string): RoleRule | null {
  for (const rule of PROTECTED_ROUTES) {
    if (rule.pattern.test(pathname)) {
      return rule
    }
  }
  return null
}

export async function proxy(request: NextRequest) {
  const authResponse = await auth0.middleware(request)

  const { pathname } = request.nextUrl

  // Check if this route needs protection
  const rule = findRouteRule(pathname)

  // Public route — pass through
  if (!rule) {
    return authResponse
  }

  // Protected route — check session
  const session = await auth0.getSession(request)

  if (!session) {
    const loginUrl = new URL("/connexion", request.url)
    loginUrl.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If the rule requires specific roles, verify from token claims
  if (rule.allowedRoles) {
    const userRole =
      (session.user.role as string | undefined) ??
      (session.user["https://byspermis.fr/role"] as string | undefined)

    if (!userRole || !rule.allowedRoles.includes(userRole)) {
      const unauthorizedUrl = new URL("/unauthorized", request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

  return authResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
