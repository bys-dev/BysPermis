/**
 * Synchronise le rôle DB depuis Auth0 (source de vérité) pour 1 ou plusieurs emails.
 * Utile quand un rôle a été changé côté Auth0 et qu'on ne veut pas attendre le prochain login.
 *
 * Usage : SYNC_EMAILS="user1@x.fr,user2@y.fr" npx tsx scripts/sync-role-from-auth0.ts
 *         (ou éditer DEFAULT_EMAILS ci-dessous)
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DEFAULT_EMAILS = ["alloecotransport78@gmail.com"];

const ALL_ROLES = ["ELEVE", "CENTRE_SECRETAIRE", "CENTRE_FORMATEUR", "CENTRE_ADMIN", "CENTRE_OWNER", "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"] as const;
const ROLE_LEVELS: Record<string, number> = {
  ELEVE: 10, CENTRE_SECRETAIRE: 20, CENTRE_FORMATEUR: 30, CENTRE_ADMIN: 40, CENTRE_OWNER: 50,
  SUPPORT: 60, COMPTABLE: 65, COMMERCIAL: 70, ADMIN: 90, OWNER: 100,
};

function pickHighestRole(cands: (string | undefined | null)[]): string | undefined {
  let best: string | undefined; let bestLevel = 0;
  for (const r of cands) {
    if (!r || !ALL_ROLES.includes(r as (typeof ALL_ROLES)[number])) continue;
    const lvl = ROLE_LEVELS[r] ?? 0;
    if (lvl > bestLevel) { best = r; bestLevel = lvl; }
  }
  return best;
}

function cfg() {
  const domain = (process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, "") ?? process.env.AUTH0_DOMAIN)!;
  const clientId = (process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID)!;
  const clientSecret = (process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET)!;
  return { domain, clientId, clientSecret };
}

async function getToken() {
  const { domain, clientId, clientSecret } = cfg();
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, audience: `https://${domain}/api/v2/` }),
  });
  if (!res.ok) throw new Error("M2M token KO: " + (await res.text()));
  return ((await res.json()) as { access_token: string }).access_token;
}

async function main() {
  const emails = (process.env.SYNC_EMAILS ?? DEFAULT_EMAILS.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const token = await getToken();
  const { domain } = cfg();
  const headers = { Authorization: `Bearer ${token}` };

  for (const email of emails) {
    const byEmailRes = await fetch(`https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`, { headers });
    if (!byEmailRes.ok) { console.log(`⚠ ${email}: users-by-email KO`); continue; }
    const users = (await byEmailRes.json()) as Array<{ user_id: string; app_metadata?: { role?: string } }>;
    if (!users.length) { console.log(`⚠ ${email}: aucun compte Auth0`); continue; }

    for (const u of users) {
      const rolesRes = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(u.user_id)}/roles`, { headers });
      const nativeRoles = rolesRes.ok ? ((await rolesRes.json()) as Array<{ name: string }>).map((r) => r.name) : [];
      const resolved = pickHighestRole([u.app_metadata?.role, ...nativeRoles]);
      console.log(`${email} [${u.user_id}] — app_metadata.role=${u.app_metadata?.role ?? "—"} | native=[${nativeRoles.join(",") || "—"}] → resolved=${resolved ?? "—"}`);
      if (!resolved) continue;

      const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
      if (!dbUser) { console.log("  (pas en DB)"); continue; }
      const currentLevel = ROLE_LEVELS[dbUser.role] ?? 0;
      const newLevel = ROLE_LEVELS[resolved] ?? 0;
      if (newLevel < currentLevel && currentLevel > ROLE_LEVELS.ELEVE) {
        console.log(`  ⚠ refus rétrogradation (${dbUser.role} → ${resolved})`);
        continue;
      }
      if (dbUser.role === resolved) { console.log(`  ✓ DB déjà ${resolved}`); continue; }
      await prisma.user.update({ where: { id: dbUser.id }, data: { role: resolved as (typeof ALL_ROLES)[number] } });
      console.log(`  ✅ DB ${dbUser.role} → ${resolved}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
