/**
 * Pipeline complet Auth0 : trigger post-login + rôles + app_metadata + vérification.
 *
 * Usage : npm run auth0:configure
 */

import { execSync } from "child_process";

function run(label: string, script: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`▶ ${label}`);
  console.log(`${"─".repeat(50)}\n`);
  execSync(`npx tsx ${script}`, { stdio: "inherit", env: process.env });
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  BYS Permis — Configuration Auth0 complète");
  console.log("═══════════════════════════════════════════");

  run("1/4 — Trigger post-login (créer / déployer / binder)", "scripts/setup-auth0-action.ts");
  run("2/4 — Rôles natifs + app_metadata (comptes démo)", "scripts/assign-auth0-roles.ts");
  run("3/4 — Sync app_metadata ← rôles natifs (Google, etc.)", "scripts/sync-auth0-app-metadata.ts");
  run("4/4 — Vérification", "scripts/verify-auth0-triggers.ts");

  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Auth0 configuré. Déconnexion / reconnexion requise.");
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exit(1);
});
