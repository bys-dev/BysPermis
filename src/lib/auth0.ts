import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchAuth0UserRole } from "@/lib/auth0-management"
import type { User } from "@/generated/prisma/client"

// ─── Namespace for custom claims injected by Auth0 Post-Login Action ───
const ROLE_NAMESPACE = "https://byspermis.fr"

/** All valid role values */
const ALL_ROLES = [
  "ELEVE",
  "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
  "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
] as const

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

type AppRole = (typeof ALL_ROLES)[number]

function normalizeEmail(email: string | undefined | null): string {
  return (email ?? "").trim().toLowerCase()
}

function parseIdTokenClaims(idToken: string | undefined): Record<string, unknown> | null {
  if (!idToken) return null
  try {
    const base64Url = idToken.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Rôle explicite depuis le JWT / claims Auth0 (jamais de défaut ELEVE ici). */
function roleFromClaims(claims: Record<string, unknown> | null): AppRole | undefined {
  if (!claims) return undefined
  const raw =
    (claims[ROLE_NAMESPACE + "/role"] as string | undefined) ??
    (claims["role"] as string | undefined)
  if (raw && ALL_ROLES.includes(raw as AppRole)) {
    return raw as AppRole
  }
  return undefined
}

function roleFromSessionUser(user: Record<string, unknown>): AppRole | undefined {
  const candidates = [
    user.appRole,
    user.role,
    user[ROLE_NAMESPACE + "/role"],
  ] as (string | undefined)[]
  for (const raw of candidates) {
    if (raw && ALL_ROLES.includes(raw as AppRole)) {
      return raw as AppRole
    }
  }
  return undefined
}

/**
 * URL du tableau de bord selon le rôle Prisma (source de vérité après login).
 */
export function getDashboardPathForRole(role: string): string {
  if (role === "OWNER" || role === "ADMIN") return "/admin/dashboard"
  if (role.startsWith("CENTRE_")) return "/espace-centre/dashboard"
  if (["SUPPORT", "COMPTABLE", "COMMERCIAL"].includes(role)) return "/plateforme/dashboard"
  return "/espace-eleve"
}

// ─── Auth0 Client v4 with beforeSessionSaved hook ───────────────────

export const auth0 = new Auth0Client({
  async beforeSessionSaved(session, idToken) {
    const claims = parseIdTokenClaims(idToken ?? undefined)
    const roleFromToken = roleFromClaims(claims) ?? roleFromSessionUser(session.user)

    // Ne jamais forcer ELEVE ici : un défaut fausse la sync DB et envoie les admins vers l'espace élève.
    if (roleFromToken) {
      session.user.appRole = roleFromToken
    }

    return session
  },
})

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
 * Auto-creates user in DB on first login (upsert pattern).
 * Reads appRole from beforeSessionSaved hook, falls back to direct claims.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth0.getSession()
    if (!session?.user) return null

    const auth0Id = session.user.sub as string
    const email = normalizeEmail(session.user.email as string | undefined)

    // Rôle Auth0 explicite depuis le token (ELEVE = souvent le défaut de l'Action, pas fiable seul)
    let tokenRole = roleFromSessionUser(session.user as Record<string, unknown>)

    if (!tokenRole || tokenRole === "ELEVE") {
      const auth0Role = await fetchAuth0UserRole(auth0Id)
      if (auth0Role && (!tokenRole || ROLE_LEVELS[auth0Role] > ROLE_LEVELS[tokenRole])) {
        tokenRole = auth0Role
      }
    }

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
          data: { auth0Id },
        })
      } else {
        const validRole = tokenRole ?? "ELEVE"
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
    } else if (tokenRole && tokenRole !== user.role) {
      const tokenLevel = ROLE_LEVELS[tokenRole] ?? 0
      const dbLevel = ROLE_LEVELS[user.role] ?? 0
      // Promotion Auth0 → DB (OWNER natif Google, etc.)
      if (tokenLevel > dbLevel) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: tokenRole },
        })
      }
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
