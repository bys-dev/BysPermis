import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@/generated/prisma/client"

// ─── Auth0 Client v4 (reads APP_BASE_URL, AUTH0_DOMAIN, etc. from env) ───

export const auth0 = new Auth0Client()

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

    // Auto-create on first login
    if (!user) {
      user = await prisma.user.create({
        data: {
          auth0Id,
          email: (session.user.email as string) ?? "",
          nom: (session.user.family_name as string) ?? (session.user.name as string) ?? "",
          prenom: (session.user.given_name as string) ?? "",
        },
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
export async function requireRole(allowedRoles: string[]): Promise<User> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Non autorisé")
  }
  return user
}

/** Shortcut: require CENTRE or ADMIN role. */
export async function requireCentre(): Promise<User> {
  return requireRole(["CENTRE", "ADMIN"])
}

/** Shortcut: require ADMIN role. */
export async function requireAdmin(): Promise<User> {
  return requireRole(["ADMIN"])
}
