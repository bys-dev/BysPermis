/**
 * Crée (ou met à jour) l'Action Auth0 "Add role to ID token" et la binde
 * au flow Post-Login, via la Management API.
 *
 * Pré-requis .env : AUTH0_DOMAIN, AUTH0_MANAGEMENT_CLIENT_ID, AUTH0_MANAGEMENT_CLIENT_SECRET
 * Le M2M doit avoir les scopes : read/create/update/delete:actions.
 *
 * Lancement : npx tsx scripts/setup-auth0-action.ts
 */

import "dotenv/config";

const ACTION_NAME = "Add role to ID token";
const NAMESPACE = "https://byspermis.fr";

const ACTION_CODE = `exports.onExecutePostLogin = async (event, api) => {
  const namespace = '${NAMESPACE}';
  // Source de vérité : Role natif Auth0 assigné à l'utilisateur.
  // Fallback : app_metadata.role (legacy), puis ELEVE par défaut.
  const nativeRole = event.authorization && event.authorization.roles && event.authorization.roles[0];
  const role = nativeRole || (event.user.app_metadata && event.user.app_metadata.role) || 'ELEVE';
  api.idToken.setCustomClaim(namespace + '/role', role);
  api.accessToken.setCustomClaim(namespace + '/role', role);
};`;

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
  const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!;
  if (!domain || !clientId || !clientSecret) {
    throw new Error("Variables AUTH0_* manquantes dans .env");
  }

  console.log("🔑 Token Management API…");
  const token = await getToken(domain, clientId, clientSecret);
  console.log("✅ Token OK\n");

  // 1. Chercher si l'action existe déjà
  console.log("🔎 Recherche de l'action existante…");
  const list = await api(domain, token, "GET", "/actions/actions?actionName=" + encodeURIComponent(ACTION_NAME));
  const existing = (list.json as { actions?: Array<{ id: string; name: string }> })?.actions?.find(
    (a) => a.name === ACTION_NAME,
  );

  let actionId: string;

  if (existing) {
    actionId = existing.id;
    console.log(`   ↳ existe déjà (id: ${actionId}), mise à jour du code…`);
    const upd = await api(domain, token, "PATCH", `/actions/actions/${actionId}`, {
      code: ACTION_CODE,
    });
    if (upd.status >= 400) throw new Error(`Update action: ${JSON.stringify(upd.json)}`);
  } else {
    console.log("   ↳ création de l'action…");
    const create = await api(domain, token, "POST", "/actions/actions", {
      name: ACTION_NAME,
      supported_triggers: [{ id: "post-login", version: "v3" }],
      code: ACTION_CODE,
      runtime: "node18",
      dependencies: [],
    });
    if (create.status >= 400) throw new Error(`Create action: ${JSON.stringify(create.json)}`);
    actionId = (create.json as { id: string }).id;
    console.log(`   ↳ créée (id: ${actionId})`);
  }

  // 2. Déployer l'action
  console.log("🚀 Déploiement de l'action…");
  const deploy = await api(domain, token, "POST", `/actions/actions/${actionId}/deploy`);
  if (deploy.status >= 400) throw new Error(`Deploy: ${JSON.stringify(deploy.json)}`);
  console.log("   ↳ déployée\n");

  // 3. Récupérer les bindings actuels du flow post-login
  console.log("🔗 Lecture des bindings post-login…");
  const bindings = await api(domain, token, "GET", "/actions/triggers/post-login/bindings");
  const current = (bindings.json as { bindings?: Array<{ action: { name: string; id: string } }> })?.bindings ?? [];
  console.log(`   ↳ ${current.length} binding(s) actuel(s)`);

  const alreadyBound = current.some((b) => b.action?.name === ACTION_NAME || b.action?.id === actionId);

  if (alreadyBound) {
    console.log("   ↳ action déjà dans le flow, rien à faire.\n");
  } else {
    console.log("   ↳ ajout de l'action au flow…");
    // Reconstruire la liste en gardant les existantes + ajout de la nôtre
    const newBindings = [
      ...current.map((b) => ({
        ref: { type: "action_id", value: b.action.id },
        display_name: b.action.name,
      })),
      {
        ref: { type: "action_name", value: ACTION_NAME },
        display_name: ACTION_NAME,
      },
    ];
    const patch = await api(domain, token, "PATCH", "/actions/triggers/post-login/bindings", {
      bindings: newBindings,
    });
    if (patch.status >= 400) throw new Error(`Bind: ${JSON.stringify(patch.json)}`);
    console.log("   ↳ bindée au flow Login\n");
  }

  console.log("═══════════════════════════════════════════");
  console.log("✅ Action post-login configurée et active.");
  console.log("   Le rôle (app_metadata.role) est injecté dans");
  console.log(`   le claim ${NAMESPACE}/role à chaque login.`);
  console.log("═══════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Erreur:", err.message || err);
  process.exit(1);
});
