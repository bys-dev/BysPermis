/**
 * Vérifie que chaque import `@/…` pointe vers un fichier réellement commité.
 *
 * Pourquoi : un fichier source oublié dans un `git add` compile parfaitement en
 * local — il est là — et casse le déploiement, où seul le dépôt existe. C'est
 * arrivé sur `src/lib/seo/geo-data.ts`, importé par la recherche et jamais
 * versionné : build local vert, déploiement Clever Cloud en échec.
 *
 * Le build Next attrape déjà ce cas, mais après plusieurs minutes et au milieu
 * d'une trace webpack. Ce contrôle répond en quelques secondes, sans dépendance
 * ni variable d'environnement, et liste *tous* les manquants d'un coup au lieu
 * du premier rencontré.
 *
 * Usage :
 *   node scripts/check-imports.mjs           # contrôle HEAD
 *   node scripts/check-imports.mjs origin/main
 */
import { execSync } from "node:child_process";

const ref = process.argv[2] ?? "HEAD";
const run = (cmd) => execSync(cmd, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/**
 * Modules produits au build et volontairement absents du dépôt : le client
 * Prisma est généré par `prisma generate`, exécuté avant `next build`.
 */
const GENERES = [/^@\/generated\//];

/** Extensions et formes d'index que le résolveur TypeScript accepte. */
const RESOLUTIONS = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];

const IMPORT_ALIAS = /from\s+["'](@\/[^"']+)["']|import\s*\(\s*["'](@\/[^"']+)["']/g;

const commites = new Set(run(`git ls-tree -r --name-only ${ref}`).split("\n").filter(Boolean));
const sources = [...commites].filter((f) => /^src\/.*\.(ts|tsx)$/.test(f));

const manquants = [];

for (const fichier of sources) {
  const contenu = run(`git show ${ref}:"${fichier}"`);
  const specificateurs = new Set(
    [...contenu.matchAll(IMPORT_ALIAS)].map((m) => m[1] ?? m[2]),
  );

  for (const specificateur of specificateurs) {
    if (GENERES.some((re) => re.test(specificateur))) continue;
    const base = `src/${specificateur.slice(2)}`;
    if (!RESOLUTIONS.some((ext) => commites.has(base + ext))) {
      manquants.push({ fichier, specificateur });
    }
  }
}

if (manquants.length === 0) {
  console.log(`✓ ${sources.length} fichiers analysés dans ${ref} — tous les imports « @/ » sont versionnés.`);
  process.exit(0);
}

console.error(`✗ ${manquants.length} import(s) vers un fichier absent du dépôt (${ref}) :\n`);
for (const { fichier, specificateur } of manquants) {
  console.error(`  ${fichier}`);
  console.error(`    → ${specificateur}`);
}
console.error(
  `\nCes fichiers existent probablement en local sans avoir été commités.\n` +
    `Le build passera ici et échouera au déploiement. Vérifiez « git status ».`,
);
process.exit(1);
