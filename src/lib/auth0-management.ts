const ALL_ROLES = [
  "ELEVE",
  "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
  "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
] as const

type AppRole = (typeof ALL_ROLES)[number]

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

async function getManagementToken(): Promise<string | null> {
  const cfg = getManagementConfig()
  if (!cfg) return null

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  const res = await fetch(`https://${cfg.domain}/oauth/token`, {
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

  const [userRes, rolesRes] = await Promise.all([
    fetch(`https://${cfg.domain}/api/v2/users/${encodedId}?fields=app_metadata`, { headers }),
    fetch(`https://${cfg.domain}/api/v2/users/${encodedId}/roles`, { headers }),
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
}
