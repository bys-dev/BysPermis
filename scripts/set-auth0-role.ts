/**
 * Définit le rôle d'un utilisateur dans Auth0 app_metadata
 *
 * Usage:
 *   npx tsx scripts/set-auth0-role.ts <email> <role>
 *
 * Exemples:
 *   npx tsx scripts/set-auth0-role.ts bysandrys95@gmail.com OWNER
 *   npx tsx scripts/set-auth0-role.ts jean@exemple.fr CENTRE_OWNER
 *   npx tsx scripts/set-auth0-role.ts support@bys.fr SUPPORT
 */

import "dotenv/config";

const VALID_ROLES = [
  "ELEVE",
  "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
  "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
];

const domain = process.env.AUTH0_DOMAIN!;
const clientId = process.env.AUTH0_CLIENT_ID!;
const clientSecret = process.env.AUTH0_CLIENT_SECRET!;

async function getManagementToken(): Promise<string> {
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

  if (!res.ok) {
    throw new Error(`Erreur token: ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function findUserByEmail(token: string, email: string) {
  const res = await fetch(
    `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Erreur recherche: ${res.status} ${await res.text()}`);
  }

  const users = await res.json() as Array<{ user_id: string; email: string; app_metadata?: { role?: string } }>;
  return users;
}

async function setRole(token: string, userId: string, role: string) {
  const res = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ app_metadata: { role } }),
    }
  );

  if (!res.ok) {
    throw new Error(`Erreur update: ${res.status} ${await res.text()}`);
  }

  return await res.json() as { user_id: string; email: string; app_metadata: { role: string } };
}

async function main() {
  const email = process.argv[2];
  const role = process.argv[3]?.toUpperCase();

  if (!email || !role) {
    console.log("Usage: npx tsx scripts/set-auth0-role.ts <email> <role>");
    console.log("");
    console.log("Rôles disponibles:");
    VALID_ROLES.forEach((r) => console.log(`  - ${r}`));
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Rôle invalide: "${role}"`);
    console.log("Rôles disponibles:", VALID_ROLES.join(", "));
    process.exit(1);
  }

  if (!domain || !clientId || !clientSecret) {
    console.error("❌ Variables AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET requises dans .env");
    process.exit(1);
  }

  console.log(`🔍 Recherche de ${email} dans Auth0...`);
  const token = await getManagementToken();
  const users = await findUserByEmail(token, email);

  if (users.length === 0) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email ${email}`);
    process.exit(1);
  }

  console.log(`   Trouvé ${users.length} compte(s) Auth0 pour ${email}`);

  for (const user of users) {
    const oldRole = user.app_metadata?.role ?? "(aucun)";
    console.log(`\n🔄 ${user.user_id}`);
    console.log(`   Ancien rôle: ${oldRole}`);

    const updated = await setRole(token, user.user_id, role);
    console.log(`   Nouveau rôle: ${updated.app_metadata.role}`);
  }

  console.log(`\n✅ Rôle ${role} défini pour ${email} dans Auth0.`);
  console.log("   L'utilisateur doit se déconnecter et se reconnecter pour que le changement prenne effet.");
}

main().catch((e) => {
  console.error("❌", e.message ?? e);
  process.exit(1);
});
