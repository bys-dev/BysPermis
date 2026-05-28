/**
 * Vérifie l'état Auth0 : action post-login déployée, bindée, comptes démo avec app_metadata.role.
 *
 * Lancement : npx tsx scripts/verify-auth0-triggers.ts
 */

import "dotenv/config";
import { AUTH0_ACTION_NAME, AUTH0_LEGACY_ACTION_NAME, AUTH0_ROLE_NAMESPACE } from "./auth0-action-code";

const DEMO_EMAILS = [
  "sebastien@bys-formation.fr",
  "admin@bys-formation.fr",
  "contact@bys-formation.fr",
  "marie.durand@outlook.fr",
];

async function getToken(domain: string, clientId: string, clientSecret: string): Promise<string> {
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
  if (!res.ok) throw new Error(`Token: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function api(
  domain: string,
  token: string,
  path: string,
): Promise<unknown> {
  const res = await fetch(`https://${domain}/api/v2${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("AUTH0_DOMAIN + credentials Management API requis dans .env");
  }

  console.log("═══════════════════════════════════════════");
  console.log("  Vérification Auth0 — triggers & rôles");
  console.log("═══════════════════════════════════════════\n");

  const token = await getToken(domain, clientId, clientSecret);

  const bindings = (await api(domain, token, "/actions/triggers/post-login/bindings")) as {
    bindings?: Array<{ action: { id: string; name: string; status?: string } }>;
  };
  const bound = bindings.bindings ?? [];

  console.log(`📋 Flow Post-Login : ${bound.length} action(s) bindée(s)`);
  if (bound.length === 0) {
    console.log("   ❌ AUCUNE action — le claim rôle ne sera jamais injecté !");
    console.log("   → Lancez : npx tsx scripts/setup-auth0-action.ts\n");
  } else {
    for (const b of bound) {
      const isLegacy = b.action?.name === AUTH0_LEGACY_ACTION_NAME;
      const ok = b.action?.name === AUTH0_ACTION_NAME;
      const icon = isLegacy ? "❌" : ok ? "✅" : "⚠️ ";
      console.log(`   ${icon} ${b.action?.name ?? "?"} (${b.action?.status ?? "?"})`);
      if (isLegacy) {
        console.log("      → Écrase le claim rôle avec ELEVE si rôles natifs absents — à retirer !");
      }
    }
    const hasLegacy = bound.some((b) => b.action?.name === AUTH0_LEGACY_ACTION_NAME);
    if (hasLegacy) {
      console.log(`\n   ❌ Action legacy "${AUTH0_LEGACY_ACTION_NAME}" encore dans le flow`);
      console.log("   → Lancez : npm run auth0:setup");
    }
    const hasCorrect = bound.some((b) => b.action?.name === AUTH0_ACTION_NAME);
    if (!hasCorrect) {
      console.log(`\n   ❌ "${AUTH0_ACTION_NAME}" absente du flow Login`);
      console.log("   → Lancez : npm run auth0:setup");
    }
    console.log("");
  }

  const actions = (await api(
    domain,
    token,
    `/actions/actions?actionName=${encodeURIComponent(AUTH0_ACTION_NAME)}`,
  )) as { actions?: Array<{ id: string; name: string; status: string }> };
  const action = actions.actions?.find((a) => a.name === AUTH0_ACTION_NAME);
  if (!action) {
    console.log(`❌ Action "${AUTH0_ACTION_NAME}" introuvable — à créer via setup-auth0-action.ts\n`);
  } else {
    console.log(`🚀 Action "${AUTH0_ACTION_NAME}" : status=${action.status}`);
    if (action.status !== "built" && action.status !== "deployed") {
      console.log("   ⚠️  Action non déployée — relancer setup-auth0-action.ts\n");
    } else {
      console.log("");
    }
  }

  console.log(`👤 app_metadata.role sur comptes démo (claim ${AUTH0_ROLE_NAMESPACE}/role) :`);
  let okCount = 0;
  for (const email of DEMO_EMAILS) {
    const users = (await api(
      domain,
      token,
      `/users-by-email?email=${encodeURIComponent(email)}`,
    )) as Array<{ user_id: string; app_metadata?: { role?: string } }>;
    const role = users[0]?.app_metadata?.role;
    if (role) {
      console.log(`   ✅ ${email} → ${role}`);
      okCount++;
    } else {
      console.log(`   ❌ ${email} → (aucun app_metadata.role)`);
    }
  }
  if (okCount < DEMO_EMAILS.length) {
    console.log("\n   → Corriger : npx tsx prisma/seed-auth0.ts");
  }

  console.log("\n═══════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exit(1);
});
