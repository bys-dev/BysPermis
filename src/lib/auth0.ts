import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@/generated/prisma/client"

// ─── Namespace for custom claims injected by Auth0 Post-Login Action ───
const ROLE_NAMESPACE = "https://byspermis.fr"

// ─── Role hierarchy levels (higher = more privileged) ────────────────
const ROLE_LEVELS: Record<string, number> = {
  OWNER: 100,
  ADMIN: 90,
  COMPTABLE: 70,
  COMMERCIAL: 70,
  SUPPORT: 60,
  CENTRE_OWNER: 50,
  CENTRE_ADMIN: 40,
  CENTRE_FORMATEUR: 30,
  CENTRE_SECRETAIRE: 20,
  ELEVE: 10,
}

/**
 * Check if `userRole` meets or exceeds `requiredRole` in the hierarchy.
 * Example: hasRole("ADMIN", "SUPPORT") → true (90 >= 60)
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? 0)
}

// ─── Auth0 Client v4 with beforeSessionSaved hook ───────────────────

export const auth0 = new Auth0Client({
  async beforeSessionSaved(session, idToken) {
    // 1. Try to extract role from the idToken (JWT string)
    if (idToken) {
      let tokenClaims: Record<string, unknown> = {}
      try {
        const base64Url = idToken.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
        tokenClaims = JSON.parse(jsonPayload)
      } catch {
        // Failed to parse JWT — fall through to other sources
      }

      // Read role from custom claim namespace (e.g. "https://byspermis.fr/role")
      const roleFromToken =
        (tokenClaims[ROLE_NAMESPACE + "/role"] as string | undefined) ??
        (tokenClaims["role"] as string | undefined)

      if (roleFromToken) {
        session.user.appRole = roleFromToken
      }
    }

    // 2. Also check session.user claims directly (Auth0 may inject them there)
    if (!session.user.appRole) {
      session.user.appRole =
        (session.user.role as string | undefined) ??
        (session.user[ROLE_NAMESPACE + "/role"] as string | undefined) ??
        "ELEVE"
    }

    return session
  },
})

// ─── Role groups ─────────────────────────────────────────

/** All valid role values */
const ALL_ROLES = [
  "ELEVE",
  "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
  "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
] as const

/** Roles that belong to a centre (owner + staff) */
const CENTRE_ROLES = ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"] as const

/** Roles that can manage formations & sessions */
const CENTRE_MANAGEMENT_ROLES = ["CENTRE_OWNER", "CENTRE_ADMIN"] as const

/** Roles that can view centre finances (Stripe, abonnement) */
const CENTRE_FINANCE_ROLES = ["CENTRE_OWNER"] as const

/** Platform staff roles */
const PLATFORM_ROLES = ["SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"] as const

/** Platform admin roles */
const PLATFORM_ADMIN_ROLES = ["ADMIN", "OWNER"] as const

// Export for use in API routes
export { ALL_ROLES, CENTRE_ROLES, CENTRE_MANAGEMENT_ROLES, CENTRE_FINANCE_ROLES, PLATFORM_ROLES, PLATFORM_ADMIN_ROLES }

// ─── Helpers ─────────────────────────────────────────────

/**
 * Get current user from session.
 * Auto-creates user in DB on first login (upsert pattern).
 * Reads appRole from beforeSessionSaved hook, falls back to direct claims.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth0.getSession()
    if (!session?.user) return null

    const auth0Id = session.user.sub as string

    // Read role from session (set by beforeSessionSaved hook) or fallback to direct claims
    const tokenRole =
      (session.user.appRole as string | undefined) ??
      (session.user.role as string | undefined) ??
      (session.user[ROLE_NAMESPACE + "/role"] as string | undefined)

    // Try to find existing user by auth0Id first, then by email
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    })

    // Auto-create or link on first login
    if (!user) {
      const email = (session.user.email as string) ?? ""

      // Check if user was pre-created by admin (via register/invite) with a different auth0Id
      const existingByEmail = email ? await prisma.user.findUnique({ where: { email } }) : null

      if (existingByEmail) {
        // Link existing user to this Auth0 account (admin pre-created this user)
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { auth0Id },
        })
      } else {
        // Brand new user — determine role from token or default to ELEVE
        const validRole = ALL_ROLES.includes(tokenRole as typeof ALL_ROLES[number])
          ? (tokenRole as typeof ALL_ROLES[number])
          : "ELEVE"

        const prenom = (session.user.given_name as string) ?? ""
        const referralCode = `BYS-${prenom.toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "X")}${Math.floor(Math.random() * 100)}`

        user = await prisma.user.create({
          data: {
            auth0Id,
            email,
            nom: (session.user.family_name as string) ?? (session.user.name as string) ?? "",
            prenom,
            role: validRole,
            referralCode,
          },
        })
      }
    } else if (tokenRole && tokenRole !== user.role && ALL_ROLES.includes(tokenRole as typeof ALL_ROLES[number])) {
      // Sync role from Auth0 if it changed (e.g. admin promoted user via Auth0 dashboard)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: tokenRole as typeof ALL_ROLES[number] },
      })
    }

    // Sync emailVerified from Auth0 session
    const isVerified = (session.user.email_verified as boolean) ?? false
    if (user.emailVerified !== isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: isVerified },
      })
    }

    return user
  } catch {
    return null
  }
}

/**
 * Require authentication - returns the Prisma User or throws.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Non authentifié")
  }
  return user
}

/**
 * Require specific role - throws if the user does not have one of the allowed roles.
 */
export async function requireRole(allowedRoles: readonly string[]): Promise<User> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Non autorisé")
  }
  return user
}

// ─── Shortcut helpers ────────────────────────────────────

/** Any centre member (owner, admin, formateur, secrétaire) or platform admin */
export async function requireCentreStaff(): Promise<User> {
  return requireRole([...CENTRE_ROLES, ...PLATFORM_ADMIN_ROLES])
}

/** Centre owner or admin (can manage formations/sessions) */
export async function requireCentreManagement(): Promise<User> {
  return requireRole([...CENTRE_MANAGEMENT_ROLES, ...PLATFORM_ADMIN_ROLES])
}

/** Centre owner only (finances, Stripe, abonnement) */
export async function requireCentreOwner(): Promise<User> {
  return requireRole([...CENTRE_FINANCE_ROLES, ...PLATFORM_ADMIN_ROLES])
}

/** Platform support agent */
export async function requireSupport(): Promise<User> {
  return requireRole(["SUPPORT", "ADMIN", "OWNER"])
}

/** Platform comptable */
export async function requireComptable(): Promise<User> {
  return requireRole(["COMPTABLE", "ADMIN", "OWNER"])
}

/** Platform admin (ADMIN or OWNER) */
export async function requireAdmin(): Promise<User> {
  return requireRole(PLATFORM_ADMIN_ROLES)
}

/** Platform owner only */
export async function requireOwner(): Promise<User> {
  return requireRole(["OWNER"])
}

// ─── Legacy aliases (backward compat) ────────────────────

/** @deprecated Use requireCentreStaff or requireCentreManagement */
export async function requireCentre(): Promise<User> {
  return requireCentreStaff()
}
