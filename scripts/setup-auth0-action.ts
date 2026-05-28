/**
 * Crée / met à jour / déploie / binde l'Action Auth0 Post-Login BYS Permis.
 *
 * Pré-requis .env : AUTH0_DOMAIN, AUTH0_MANAGEMENT_CLIENT_ID, AUTH0_MANAGEMENT_CLIENT_SECRET
 * (ou AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET si M2M sur la même app)
 *
 * Lancement : npx tsx scripts/setup-auth0-action.ts
 */

import "dotenv/config";
import {
  AUTH0_ACTION_NAME,
  AUTH0_LEGACY_ACTION_NAME,
  AUTH0_POST_LOGIN_ACTION_CODE,
  AUTH0_ROLE_NAMESPACE,
} from "./auth0-action-code";

async function getToken(domain: string, id: string, secret: string): Promise<string> {
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function api(
  domain: string,
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`https://${domain}/api/v2${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function main() {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET!;
  if (!domain || !clientId || !clientSecret) {
    throw new Error("Variables AUTH0_* manquantes dans .env");
  }

  console.log("🔑 Token Management API…");
  const token = await getToken(domain, clientId, clientSecret);
  console.log("✅ Token OK\n");

  console.log("🔎 Recherche de l'action…");
  const list = await api(
    domain,
    token,
    "GET",
    "/actions/actions?actionName=" + encodeURIComponent(AUTH0_ACTION_NAME),
  );
  const existing = (list.json as { actions?: Array<{ id: string; name: string }> })?.actions?.find(
    (a) => a.name === AUTH0_ACTION_NAME,
  );

  let actionId: string;

  if (existing) {
    actionId = existing.id;
    console.log(`   ↳ existe (id: ${actionId}), mise à jour…`);
    const upd = await api(domain, token, "PATCH", `/actions/actions/${actionId}`, {
      code: AUTH0_POST_LOGIN_ACTION_CODE,
    });
    if (upd.status >= 400) throw new Error(`Update action: ${JSON.stringify(upd.json)}`);
  } else {
    console.log("   ↳ création…");
    const create = await api(domain, token, "POST", "/actions/actions", {
      name: AUTH0_ACTION_NAME,
      supported_triggers: [{ id: "post-login", version: "v3" }],
      code: AUTH0_POST_LOGIN_ACTION_CODE,
      runtime: "node18",
      dependencies: [],
    });
    if (create.status >= 400) throw new Error(`Create action: ${JSON.stringify(create.json)}`);
    actionId = (create.json as { id: string }).id;
    console.log(`   ↳ créée (id: ${actionId})`);
  }

  console.log("🚀 Déploiement…");
  const deploy = await api(domain, token, "POST", `/actions/actions/${actionId}/deploy`);
  if (deploy.status >= 400) throw new Error(`Deploy: ${JSON.stringify(deploy.json)}`);
  console.log("   ↳ déployée\n");

  console.log("🔗 Bindings post-login…");
  const bindings = await api(domain, token, "GET", "/actions/triggers/post-login/bindings");
  const current = (bindings.json as { bindings?: Array<{ action: { name: string; id: string } }> })?.bindings ?? [];
  console.log(`   ↳ ${current.length} action(s) actuelle(s)`);

  const legacy = current.filter((b) => b.action?.name === AUTH0_LEGACY_ACTION_NAME);
  if (legacy.length > 0) {
    console.log(`   ⚠️  Retrait de l'action legacy "${AUTH0_LEGACY_ACTION_NAME}" (écrasait les rôles en ELEVE)`);
  }

  const kept = current.filter(
    (b) => b.action?.name !== AUTH0_LEGACY_ACTION_NAME && b.action?.id !== actionId,
  );
  const newBindings = [
    ...kept.map((b) => ({
      ref: { type: "action_id", value: b.action.id },
      display_name: b.action.name,
    })),
    {
      ref: { type: "action_id", value: actionId },
      display_name: AUTH0_ACTION_NAME,
    },
  ];

  const patch = await api(domain, token, "PATCH", "/actions/triggers/post-login/bindings", {
    bindings: newBindings,
  });
  if (patch.status >= 400) throw new Error(`Bind: ${JSON.stringify(patch.json)}`);
  console.log(`   ↳ flow Login : uniquement "${AUTH0_ACTION_NAME}".\n`);

  console.log("═══════════════════════════════════════════");
  console.log("✅ Trigger post-login configuré.");
  console.log(`   Action : ${AUTH0_ACTION_NAME}`);
  console.log(`   Claim  : ${AUTH0_ROLE_NAMESPACE}/role`);
  console.log("   Source : app_metadata.role puis rôles natifs Auth0");
  console.log("");
  console.log("   Vérifiez : npx tsx scripts/verify-auth0-triggers.ts");
  console.log("   Comptes  : npx tsx prisma/seed-auth0.ts");
  console.log("═══════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Erreur:", err.message || err);
  process.exit(1);
});
