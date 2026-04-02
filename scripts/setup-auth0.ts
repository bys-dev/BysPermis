/**
 * ═══════════════════════════════════════════════════════════
 * Script de configuration Auth0 pour BYS Permis
 * ═══════════════════════════════════════════════════════════
 *
 * Ce script configure automatiquement :
 * 1. L'Action Post-Login qui injecte le rôle dans le token
 * 2. Assigne l'action au flow Login
 *
 * Usage : npx tsx scripts/setup-auth0.ts
 */

import "dotenv/config";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
  console.error("❌ Variables AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET requises dans .env");
  process.exit(1);
}

// ─── 1. Get Management API Token ─────────────────────────

async function getManagementToken(): Promise<string> {
  console.log("🔑 Obtention du token Management API...");
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Impossible d'obtenir le token:", err);
    console.log("\n💡 Assurez-vous que votre application Auth0 a les permissions Management API.");
    console.log("   → Auth0 Dashboard → Applications → APIs → Auth0 Management API → Machine to Machine Applications");
    console.log("   → Activez votre app et cochez les scopes : read:actions, create:actions, update:actions, read:users, update:users");
    process.exit(1);
  }

  const data = await res.json();
  console.log("✅ Token obtenu.");
  return data.access_token;
}

// ─── 2. Create Post-Login Action ─────────────────────────

const ACTION_CODE = `
/**
 * BYS Permis — Post-Login Action
 * Injecte le rôle utilisateur (app_metadata.role) dans le token ID et access token.
 * Le rôle est défini lors de l'inscription via l'API /api/register.
 *
 * Rôles valides (10) :
 *   Publics    : ELEVE
 *   Centre     : CENTRE_OWNER, CENTRE_ADMIN, CENTRE_FORMATEUR, CENTRE_SECRETAIRE
 *   Plateforme : SUPPORT, COMPTABLE, COMMERCIAL, ADMIN, OWNER
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://byspermis.fr";

  const VALID_ROLES = [
    "ELEVE",
    "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
    "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"
  ];

  // Lire le rôle depuis app_metadata (défini par notre API register)
  const rawRole = event.user.app_metadata?.role;
  const role = VALID_ROLES.includes(rawRole) ? rawRole : "ELEVE";

  // Injecter dans le ID token (lu par le frontend / proxy)
  api.idToken.setCustomClaim(namespace + "/role", role);

  // Injecter dans le access token (lu par les API routes)
  api.accessToken.setCustomClaim(namespace + "/role", role);

  // Aussi injecter directement comme "role" pour simplicité
  api.idToken.setCustomClaim("role", role);
};
`;

async function createOrUpdateAction(token: string): Promise<string> {
  console.log("\n📦 Création de l'Action Post-Login 'BYS - Inject Role'...");

  // Check if action already exists
  const listRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/actions/actions?actionName=BYS - Inject Role`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let actionId: string;

  if (listRes.ok) {
    const list = await listRes.json();
    const existing = list.actions?.find((a: { name: string }) => a.name === "BYS - Inject Role");

    if (existing) {
      console.log("   Action existe déjà (ID:", existing.id + "). Mise à jour...");
      actionId = existing.id;

      const updateRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/actions/actions/${actionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: ACTION_CODE }),
      });

      if (!updateRes.ok) {
        console.error("❌ Erreur mise à jour:", await updateRes.text());
        process.exit(1);
      }
    } else {
      // Create new
      const createRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/actions/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "BYS - Inject Role",
          supported_triggers: [{ id: "post-login", version: "v3" }],
          code: ACTION_CODE,
        }),
      });

      if (!createRes.ok) {
        console.error("❌ Erreur création:", await createRes.text());
        process.exit(1);
      }

      const created = await createRes.json();
      actionId = created.id;
    }
  } else {
    console.error("❌ Erreur listing actions:", await listRes.text());
    process.exit(1);
  }

  console.log("✅ Action créée/mise à jour (ID:", actionId + ")");

  // Deploy the action
  console.log("🚀 Déploiement de l'action...");
  const deployRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/actions/actions/${actionId}/deploy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!deployRes.ok) {
    console.error("⚠️  Erreur déploiement:", await deployRes.text());
    console.log("   → Vous pouvez déployer manuellement depuis le Dashboard Auth0");
  } else {
    console.log("✅ Action déployée.");
  }

  return actionId;
}

// ─── 3. Bind Action to Login Flow ────────────────────────

async function bindActionToFlow(token: string, actionId: string) {
  console.log("\n🔗 Association de l'action au flow Login...");

  // Get current bindings
  const bindingsRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/actions/triggers/post-login/bindings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!bindingsRes.ok) {
    console.error("⚠️  Impossible de lire les bindings:", await bindingsRes.text());
    console.log("   → Associez manuellement l'action au flow Login dans le Dashboard Auth0");
    return;
  }

  const bindings = await bindingsRes.json();
  const existingBindings = bindings.bindings || [];

  // Check if already bound
  const alreadyBound = existingBindings.some(
    (b: { action: { id: string } }) => b.action?.id === actionId
  );

  if (alreadyBound) {
    console.log("✅ Action déjà associée au flow Login.");
    return;
  }

  // Add our action to existing bindings
  const newBindings = [
    ...existingBindings.map((b: { action: { id: string } }) => ({
      ref: { type: "action_id" as const, value: b.action.id },
    })),
    { ref: { type: "action_id" as const, value: actionId } },
  ];

  const updateRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/actions/triggers/post-login/bindings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bindings: newBindings }),
  });

  if (!updateRes.ok) {
    console.error("⚠️  Erreur association:", await updateRes.text());
    console.log("   → Associez manuellement dans Dashboard → Actions → Flows → Login");
  } else {
    console.log("✅ Action associée au flow Login.");
  }
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  BYS Permis — Configuration Auth0");
  console.log("═══════════════════════════════════════════");
  console.log(`  Domain: ${AUTH0_DOMAIN}`);
  console.log("");

  const token = await getManagementToken();
  const actionId = await createOrUpdateAction(token);
  await bindActionToFlow(token, actionId);

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ Configuration Auth0 terminée !");
  console.log("═══════════════════════════════════════════");
  console.log("");
  console.log("  L'Action 'BYS - Inject Role' est active.");
  console.log("  Elle injecte le claim 'role' dans le token");
  console.log("  à chaque connexion utilisateur.");
  console.log("");
  console.log("  Vérifiez dans le Dashboard Auth0 :");
  console.log("  → Actions → Flows → Login");
  console.log("  → 'BYS - Inject Role' doit apparaître");
  console.log("");
}

main().catch((err) => {
  console.error("❌ Erreur fatale:", err);
  process.exit(1);
});
