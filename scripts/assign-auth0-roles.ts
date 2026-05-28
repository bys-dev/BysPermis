/**
 * Assigne chaque compte démo à son Role natif Auth0 (User Management → Roles).
 * Complémentaire à app_metadata.role : peuple l'onglet "Users" de chaque Role.
 *
 * Lancement : npx tsx scripts/assign-auth0-roles.ts
 */

import "dotenv/config";

const USER_ROLE: Record<string, string> = {
  "sebastien@bys-formation.fr": "OWNER",
  "admin@bys-formation.fr": "ADMIN",
  "support@bys-formation.fr": "SUPPORT",
  "comptabilite@bys-formation.fr": "COMPTABLE",
  "commercial@bys-formation.fr": "COMMERCIAL",
  "contact@bys-formation.fr": "CENTRE_OWNER",
  "gestion@bys-formation.fr": "CENTRE_ADMIN",
  "formateur@bys-formation.fr": "CENTRE_FORMATEUR",
  "secretariat@autoecole-conduite-plus.fr": "CENTRE_SECRETAIRE",
  "marie.durand@outlook.fr": "ELEVE",
};

async function main() {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!;

  const tok = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  }).then((r) => r.json());
  const token = (tok as { access_token: string }).access_token;
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 1. Map nom de rôle → role_id
  const roles = (await fetch(`https://${domain}/api/v2/roles?per_page=50`, { headers: H }).then((r) =>
    r.json(),
  )) as Array<{ id: string; name: string }>;
  const roleId = new Map(roles.map((r) => [r.name, r.id]));

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let assigned = 0;
  for (const [email, role] of Object.entries(USER_ROLE)) {
    await sleep(1500); // éviter le rate limit Auth0 (429)
    const rid = roleId.get(role);
    if (!rid) {
      console.log(`⚠️  Rôle natif "${role}" introuvable — ignoré`);
      continue;
    }

    // 2. user_id Auth0 depuis l'email
    const users = (await fetch(
      `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
      { headers: H },
    ).then((r) => r.json())) as Array<{ user_id: string }>;
    const userId = users[0]?.user_id;
    if (!userId) {
      console.log(`⚠️  ${email} introuvable dans Auth0 — ignoré`);
      continue;
    }

    // 3. Assigner le rôle natif
    const res = await fetch(`https://${domain}/api/v2/roles/${rid}/users`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ users: [userId] }),
    });
    if (res.ok || res.status === 204) {
      console.log(`✅ ${email} → ${role}`);
      assigned++;
    } else {
      console.log(`❌ ${email} → ${role} : ${res.status} ${await res.text()}`);
    }
  }

  console.log(`\n✅ ${assigned} assignations effectuées.`);
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
