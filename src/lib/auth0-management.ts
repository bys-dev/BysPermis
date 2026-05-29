import { roleForDemoEmail } from "@/lib/demo-account-roles"
import {
  ALL_ROLES,
  ROLE_LEVELS,
  ROLE_NAMESPACE,
  ROLE_NAMESPACE_TYPO,
  type AppRole,
} from "@/lib/auth0-session"

function pickHighestRole(candidates: (string | undefined)[]): AppRole | undefined {
  let best: AppRole | undefined
  let bestLevel = 0
  for (const raw of candidates) {
    if (!raw || !ALL_ROLES.includes(raw as AppRole)) continue
    const role = raw as AppRole
    const level = ROLE_LEVELS[role] ?? 0
    if (level > bestLevel) {
      best = role
      bestLevel = level
    }
  }
  return best
}

function getManagementConfig() {
  const domain =
    process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, "") ??
    process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID
  const clientSecret =
    process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET
  if (!domain || !clientId || !clientSecret) return null
  return { domain, clientId, clientSecret }
}

let cachedToken: { value: string; expiresAt: number } | null = null

const AUTH0_FETCH_TIMEOUT_MS = 4_000

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AUTH0_FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function getManagementToken(): Promise<string | null> {
  const cfg = getManagementConfig()
  if (!cfg) return null

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  try {
    const res = await fetchWithTimeout(`https://${cfg.domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        audience: `https://${cfg.domain}/api/v2/`,
      }),
    })
    if (!res.ok) return null

    const data = (await res.json()) as { access_token: string; expires_in?: number }
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    }
    return data.access_token
  } catch {
    return null
  }
}

/**
 * Lit app_metadata.role + rôles natifs Auth0 (Management API).
 * Nécessaire car event.authorization.roles est souvent vide au login Google/email sans audience API.
 */
export async function fetchAuth0UserRole(auth0Id: string): Promise<AppRole | undefined> {
  const cfg = getManagementConfig()
  const token = await getManagementToken()
  if (!cfg || !token) return undefined

  const headers = { Authorization: `Bearer ${token}` }
  const encodedId = encodeURIComponent(auth0Id)

  try {
    const [userRes, rolesRes] = await Promise.all([
      fetchWithTimeout(`https://${cfg.domain}/api/v2/users/${encodedId}?fields=app_metadata`, { headers }),
      fetchWithTimeout(`https://${cfg.domain}/api/v2/users/${encodedId}/roles`, { headers }),
    ])

    let appMetadataRole: string | undefined
    if (userRes.ok) {
      const user = (await userRes.json()) as { app_metadata?: { role?: string } }
      appMetadataRole = user.app_metadata?.role
    }

    let nativeRoles: string[] = []
    if (rolesRes.ok) {
      const roles = (await rolesRes.json()) as Array<{ name: string }>
      nativeRoles = roles.map((r) => r.name)
    }

    return pickHighestRole([appMetadataRole, ...nativeRoles])
  } catch {
    return undefined
  }
}

type SessionUser = Record<string, unknown>

function roleFromTokenClaims(user: SessionUser): AppRole | undefined {
  const fromArray =
    pickHighestRoleFromList(user[ROLE_NAMESPACE + "/roles"]) ??
    pickHighestRoleFromList(user[ROLE_NAMESPACE_TYPO + "/roles"])
  if (fromArray) return fromArray

  const candidates = [
    user.appRole,
    user.role,
    user[ROLE_NAMESPACE + "/role"],
    user[ROLE_NAMESPACE_TYPO + "/role"],
  ] as (string | undefined)[]
  return pickHighestRole(candidates)
}

function pickHighestRoleFromList(value: unknown): AppRole | undefined {
  if (!Array.isArray(value)) return undefined
  return pickHighestRole(value as string[])
}

/**
 * Rôle Auth0 = source de vérité.
 * 1. Claims session / token (rapide, pas d'appel réseau)
 * 2. Comptes démo recette
 * 3. Management API (avec timeout — Auth0 peut répondre lentement)
 */
export async function resolveAuth0Role(
  auth0Id: string,
  sessionUser: SessionUser,
  email?: string | null,
): Promise<AppRole | undefined> {
  const fromSession = roleFromTokenClaims(sessionUser)
  if (fromSession) return fromSession

  const demoRole = roleForDemoEmail(email ?? (sessionUser.email as string | undefined))
  if (demoRole) return demoRole

  return fetchAuth0UserRole(auth0Id)
}
