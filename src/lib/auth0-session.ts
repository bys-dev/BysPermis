import type { SessionData } from "@auth0/nextjs-auth0/types"

export const ROLE_NAMESPACE = "https://byspermis.fr"
/** Ancienne typo parfois encore déployée dans l'Action Auth0 dashboard */
export const ROLE_NAMESPACE_TYPO = "https://bypermis.fr"

export const ALL_ROLES = [
  "ELEVE",
  "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
  "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
] as const

export type AppRole = (typeof ALL_ROLES)[number]

export const ROLE_LEVELS: Record<string, number> = {
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

function parseIdTokenClaims(idToken: string | undefined | null): Record<string, unknown> | null {
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

function roleFromRolesArrayClaim(claims: Record<string, unknown>, key: string): AppRole | undefined {
  const roles = claims[key]
  if (!Array.isArray(roles)) return undefined
  let best: AppRole | undefined
  let bestLevel = 0
  for (const raw of roles) {
    if (typeof raw !== "string" || !ALL_ROLES.includes(raw as AppRole)) continue
    const level = ROLE_LEVELS[raw] ?? 0
    if (level > bestLevel) {
      best = raw as AppRole
      bestLevel = level
    }
  }
  return best
}

export function roleFromClaims(claims: Record<string, unknown> | null): AppRole | undefined {
  if (!claims) return undefined
  const fromArray =
    roleFromRolesArrayClaim(claims, ROLE_NAMESPACE + "/roles") ??
    roleFromRolesArrayClaim(claims, ROLE_NAMESPACE_TYPO + "/roles")
  if (fromArray) return fromArray
  const raw =
    (claims[ROLE_NAMESPACE + "/role"] as string | undefined) ??
    (claims[ROLE_NAMESPACE_TYPO + "/role"] as string | undefined) ??
    (claims["role"] as string | undefined)
  if (raw && ALL_ROLES.includes(raw as AppRole)) {
    return raw as AppRole
  }
  return undefined
}

function roleFromSessionUser(user: Record<string, unknown>): AppRole | undefined {
  const fromArray =
    roleFromRolesArrayClaim(user, ROLE_NAMESPACE + "/roles") ??
    roleFromRolesArrayClaim(user, ROLE_NAMESPACE_TYPO + "/roles")
  if (fromArray) return fromArray
  const candidates = [
    user.appRole,
    user.role,
    user[ROLE_NAMESPACE + "/role"],
    user[ROLE_NAMESPACE_TYPO + "/role"],
  ] as (string | undefined)[]
  for (const raw of candidates) {
    if (raw && ALL_ROLES.includes(raw as AppRole)) {
      return raw as AppRole
    }
  }
  return undefined
}

/** Copie le rôle Auth0 dans la session (utilisé par le client Auth0 partagé proxy + routes). */
export async function enrichSessionWithRole(
  session: SessionData,
  idToken: string | null,
): Promise<SessionData> {
  const claims = parseIdTokenClaims(idToken ?? undefined)
  const roleFromToken = roleFromClaims(claims) ?? roleFromSessionUser(session.user)

  if (roleFromToken) {
    session.user.appRole = roleFromToken
    session.user[ROLE_NAMESPACE + "/role"] = roleFromToken
    session.user.role = roleFromToken
  }

  return session
}
