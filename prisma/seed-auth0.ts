/**
 * Seed Auth0 — crée 7 comptes de démo (un par rôle) via la Management API.
 *
 * Pré-requis dans .env :
 *   AUTH0_DOMAIN
 *   AUTH0_MANAGEMENT_CLIENT_ID
 *   AUTH0_MANAGEMENT_CLIENT_SECRET
 *
 * Lancement :
 *   npx tsx prisma/seed-auth0.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL non defini");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => PrismaClient)({ adapter });

type Role =
  | "OWNER"
  | "ADMIN"
  | "SUPPORT"
  | "COMPTABLE"
  | "COMMERCIAL"
  | "CENTRE_OWNER"
  | "ELEVE";

type DemoUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
};

const DEMO_PASSWORD = "DemoByspermis2026!";

const DEMO_USERS: DemoUser[] = [
  { email: "sebastien@bys-formation.fr", firstName: "Sebastien", lastName: "BYS", role: "OWNER" },
  { email: "admin@bys-formation.fr", firstName: "Admin", lastName: "BYS", role: "ADMIN" },
  { email: "support@bys-formation.fr", firstName: "Support", lastName: "BYS", role: "SUPPORT" },
  { email: "comptabilite@bys-formation.fr", firstName: "Comptable", lastName: "BYS", role: "COMPTABLE" },
  { email: "commercial@bys-formation.fr", firstName: "Commercial", lastName: "BYS", role: "COMMERCIAL" },
  { email: "contact@bys-formation.fr", firstName: "Centre", lastName: "BYS Cergy", role: "CENTRE_OWNER" },
  { email: "marie.durand@outlook.fr", firstName: "Marie", lastName: "Durand", role: "ELEVE" },
];

async function getManagementToken(domain: string, clientId: string, clientSecret: string): Promise<string> {
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
    const err = await res.text();
    throw new Error(`Impossible d'obtenir le token Management API : ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function findUserByEmail(domain: string, token: string, email: string): Promise<string | null> {
  const url = `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const users = (await res.json()) as Array<{ user_id: string }>;
  return users[0]?.user_id ?? null;
}

async function markEmailVerified(domain: string, token: string, auth0Id: string, role: Role): Promise<void> {
  const url = `https://${domain}/api/v2/users/${encodeURIComponent(auth0Id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email_verified: true,
      app_metadata: { role },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`   ⚠️  echec MAJ email_verified : ${err}`);
  }
}

async function createAuth0User(
  domain: string,
  token: string,
  user: DemoUser,
): Promise<string> {
  const res = await fetch(`https://${domain}/api/v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: user.email,
      password: DEMO_PASSWORD,
      connection: "Username-Password-Authentication",
      email_verified: true,
      name: `${user.firstName} ${user.lastName}`,
      given_name: user.firstName,
      family_name: user.lastName,
      app_metadata: { role: user.role },
      user_metadata: { firstName: user.firstName, lastName: user.lastName },
    }),
  });

  if (res.status === 409) {
    return "EXISTS";
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Creation user ${user.email} echouee : ${err}`);
  }
  const created = (await res.json()) as { user_id: string };
  return created.user_id;
}

async function linkToPrismaUser(email: string, auth0Id: string, role: Role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { auth0Id, role, emailVerified: true },
    });
    return "updated";
  }
  return "db-missing";
}

async function main() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Variables AUTH0_DOMAIN / AUTH0_MANAGEMENT_CLIENT_ID / AUTH0_MANAGEMENT_CLIENT_SECRET manquantes dans .env");
  }

  console.log("🔑 Obtention du token Management API…");
  const token = await getManagementToken(domain, clientId, clientSecret);
  console.log("✅ Token obtenu.");
  console.log("");

  let created = 0;
  let already = 0;
  let linked = 0;

  for (const user of DEMO_USERS) {
    console.log(`👤 ${user.email} (${user.role})`);

    let auth0Id: string;
    const result = await createAuth0User(domain, token, user);

    if (result === "EXISTS") {
      console.log("   ↳ existe deja dans Auth0, recuperation de l'ID…");
      const found = await findUserByEmail(domain, token, user.email);
      if (!found) {
        console.log("   ⚠️  introuvable via users-by-email, skip.");
        continue;
      }
      auth0Id = found;
      already++;
      // Force email_verified=true + role pour les comptes existants
      await markEmailVerified(domain, token, auth0Id, user.role);
      console.log("   ↳ email_verified=true + role synchronises sur Auth0");
    } else {
      auth0Id = result;
      console.log(`   ↳ cree (id: ${auth0Id})`);
      created++;
    }

    const linkResult = await linkToPrismaUser(user.email, auth0Id, user.role);
    if (linkResult === "updated") {
      console.log(`   ↳ lie a l'utilisateur DB (role ${user.role})`);
      linked++;
    } else {
      console.log(`   ⚠️  pas d'utilisateur en base avec cet email — seed Prisma manquant ?`);
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════");
  console.log(`✅ Seed Auth0 termine.`);
  console.log(`   • ${created} comptes crees`);
  console.log(`   • ${already} existaient deja`);
  console.log(`   • ${linked} relies aux users en base`);
  console.log("");
  console.log(`   Mot de passe pour tous : ${DEMO_PASSWORD}`);
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
