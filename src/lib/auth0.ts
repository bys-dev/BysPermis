import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveAuth0Role } from "@/lib/auth0-management"
import { auth0 } from "@/lib/auth0-client"
import {
  ALL_ROLES,
  ROLE_LEVELS,
  type AppRole,
} from "@/lib/auth0-session"
import type { User } from "@/generated/prisma/client"

export { auth0 }

/**
 * Check if `userRole` meets or exceeds `requiredRole` in the hierarchy.
 * Example: hasRole("ADMIN", "SUPPORT") → true (90 >= 60)
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? 0)
}

function normalizeEmail(email: string | undefined | null): string {
  return (email ?? "").trim().toLowerCase()
}

export function getDashboardPathForRole(role: string): string {
  if (role === "OWNER" || role === "ADMIN") return "/admin/dashboard"
  if (role.startsWith("CENTRE_")) return "/espace-centre/dashboard"
  if (["SUPPORT", "COMPTABLE", "COMMERCIAL"].includes(role)) return "/plateforme/dashboard"
  return "/espace-eleve"
}

async function syncDbRoleFromAuth0(userId: string, auth0Role: AppRole | undefined, currentRole: string) {
  if (!auth0Role || auth0Role === currentRole) return null
  const currentLevel = ROLE_LEVELS[currentRole] ?? 0
  const newLevel = ROLE_LEVELS[auth0Role] ?? 0
  // Ne pas rétrograder un compte staff depuis un claim token stale (ex. ELEVE fantôme).
  if (newLevel < currentLevel && currentLevel > (ROLE_LEVELS.ELEVE ?? 0)) {
    return null
  }
  return prisma.user.update({
    where: { id: userId },
    data: { role: auth0Role },
  })
}

// ─── Role groups ─────────────────────────────────────────

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
 * Le rôle est lu depuis Auth0 (API Management + token) puis synchronisé en base.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth0.getSession()
    if (!session?.user) return null

    const auth0Id = session.user.sub as string
    const email = normalizeEmail(session.user.email as string | undefined)

    // Source de vérité : Auth0 (app_metadata, rôles natifs, claims JWT)
    const auth0Role = await resolveAuth0Role(auth0Id, session.user as Record<string, unknown>, email)

    let user = await prisma.user.findUnique({
      where: { auth0Id },
    })

    // auth0Id lié à un autre email (ex. 1er login Google perso) → rattacher le compte seed par email
    if (user && email && normalizeEmail(user.email) !== email) {
      const userByEmail = await prisma.user.findUnique({ where: { email } })
      if (userByEmail && userByEmail.id !== user.id) {
        const staleUserId = user.id
        await prisma.$transaction([
          prisma.user.update({
            where: { id: staleUserId },
            data: { auth0Id: `unlinked:${staleUserId}` },
          }),
          prisma.user.update({
            where: { id: userByEmail.id },
            data: { auth0Id },
          }),
        ])
        user = await prisma.user.findUnique({ where: { id: userByEmail.id } })
      }
    }

    // Auto-create or link on first login
    if (!user) {
      const existingByEmail = email ? await prisma.user.findUnique({ where: { email } }) : null

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            auth0Id,
            ...(auth0Role ? { role: auth0Role } : {}),
          },
        })
      } else {
        const validRole = auth0Role ?? "ELEVE"
        const prenom = (session.user.given_name as string) ?? ""
        const referralCode = `BYS-${prenom.toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "X")}${Math.floor(Math.random() * 100)}`

        user = await prisma.user.create({
          data: {
            auth0Id,
            email: email || ((session.user.email as string) ?? ""),
            nom: (session.user.family_name as string) ?? (session.user.name as string) ?? "",
            prenom,
            role: validRole,
            referralCode,
          },
        })
      }
    } else {
      const updated = await syncDbRoleFromAuth0(user.id, auth0Role, user.role)
      if (updated) user = updated
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

/** Any platform staff (SUPPORT, COMPTABLE, COMMERCIAL, ADMIN, OWNER) */
export async function requirePlatformStaff(): Promise<User> {
  return requireRole(PLATFORM_ROLES)
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

/** Map auth errors thrown by requireAuth/requireRole to HTTP responses. */
export function mapAuthError(err: unknown): NextResponse | null {
  if (err instanceof Error) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    if (err.message === "Non autorisé") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
  }
  return null
}
