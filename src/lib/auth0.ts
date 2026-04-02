import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@/generated/prisma/client"

// ─── Auth0 Client v4 (reads APP_BASE_URL, AUTH0_DOMAIN, etc. from env) ───

export const auth0 = new Auth0Client()

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
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth0.getSession()
    if (!session?.user) return null

    const auth0Id = session.user.sub as string

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    })

    // Read role from Auth0 token (injected by Post-Login Action)
    const tokenRole =
      (session.user.role as string | undefined) ??
      (session.user["https://byspermis.fr/role"] as string | undefined)

    // Auto-create on first login
    if (!user) {
      const validRole = ALL_ROLES.includes(tokenRole as typeof ALL_ROLES[number])
        ? (tokenRole as typeof ALL_ROLES[number])
        : "ELEVE"

      user = await prisma.user.create({
        data: {
          auth0Id,
          email: (session.user.email as string) ?? "",
          nom: (session.user.family_name as string) ?? (session.user.name as string) ?? "",
          prenom: (session.user.given_name as string) ?? "",
          role: validRole,
        },
      })
    } else if (tokenRole && tokenRole !== user.role && ALL_ROLES.includes(tokenRole as typeof ALL_ROLES[number])) {
      // Sync role from Auth0 if it changed (e.g. admin promoted user)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: tokenRole as typeof ALL_ROLES[number] },
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
