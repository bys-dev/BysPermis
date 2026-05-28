/**
 * Copie app_metadata.role depuis les rôles natifs Auth0 (Management API).
 * À lancer après assign-auth0-roles ou quand un compte Google a OWNER en UI mais pas dans le token.
 *
 * Usage : npx tsx scripts/sync-auth0-app-metadata.ts [email]
 */

import "dotenv/config";

const VALID_ROLES = [
  "ELEVE",
  "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
  "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
] as const;

const ROLE_LEVELS: Record<string, number> = {
  OWNER: 100, ADMIN: 90, COMPTABLE: 70, COMMERCIAL: 70, SUPPORT: 60,
  CENTRE_OWNER: 50, CENTRE_ADMIN: 40, CENTRE_FORMATEUR: 30, CENTRE_SECRETAIRE: 20, ELEVE: 10,
};

const DEFAULT_EMAILS = [
  "bysandrys95@gmail.com",
  "sebastien@bys-formation.fr",
  "admin@bys-formation.fr",
  "contact@bys-formation.fr",
];

async function getToken(domain: string, clientId: string, clientSecret: string) {
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return ((await res.json()) as { access_token: string }).access_token;
}

function pickHighest(roles: string[]): string | undefined {
  let best: string | undefined;
  let bestLevel = 0;
  for (const r of roles) {
    if (!VALID_ROLES.includes(r as (typeof VALID_ROLES)[number])) continue;
    const level = ROLE_LEVELS[r] ?? 0;
    if (level > bestLevel) {
      best = r;
      bestLevel = level;
    }
  }
  return best;
}

async function syncUser(
  domain: string,
  H: Record<string, string>,
  email: string,
): Promise<void> {
  const users = (await fetch(
    `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    { headers: H },
  ).then((r) => r.json())) as Array<{ user_id: string; app_metadata?: { role?: string } }>;

  if (!users.length) {
    console.log(`⚠️  ${email} — introuvable dans Auth0`);
    return;
  }

  for (const user of users) {
    const rolesRes = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(user.user_id)}/roles`,
      { headers: H },
    );
    const nativeRoles = rolesRes.ok
      ? ((await rolesRes.json()) as Array<{ name: string }>).map((r) => r.name)
      : [];

    const currentMeta = user.app_metadata?.role;
    const best = pickHighest([currentMeta, ...nativeRoles].filter(Boolean) as string[]);

    if (!best) {
      console.log(`⚠️  ${email} (${user.user_id}) — aucun rôle trouvé`);
      continue;
    }

    if (currentMeta === best) {
      console.log(`✓  ${email} — app_metadata.role déjà ${best}`);
      continue;
    }

    const patch = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(user.user_id)}`,
      {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ app_metadata: { role: best } }),
      },
    );

    if (patch.ok) {
      console.log(`✅ ${email} — app_metadata.role → ${best} (natif: ${nativeRoles.join(", ") || "—"})`);
    } else {
      console.log(`❌ ${email} — ${patch.status} ${await patch.text()}`);
    }
  }
}

async function main() {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET!;
  const emails = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_EMAILS;

  const token = await getToken(domain, clientId, clientSecret);
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  console.log("Sync app_metadata.role ← rôles natifs Auth0\n");
  for (const email of emails) {
    await syncUser(domain, H, email);
    await new Promise((r) => setTimeout(r, 500));
  }
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
