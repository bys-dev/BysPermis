/**
 * Génère le client Prisma après install, sauf sur Clever Cloud où
 * `npm run build` le fait déjà — évite un double pic mémoire (OOM XS).
 */
if (process.env.CC_APP_ID || process.env.CC_COMMIT_ID) {
  console.log(
    "[postinstall] Clever Cloud détecté — prisma generate reporté au build"
  );
  process.exit(0);
}

const { execSync } = require("node:child_process");
execSync("npx prisma generate", { stdio: "inherit" });
