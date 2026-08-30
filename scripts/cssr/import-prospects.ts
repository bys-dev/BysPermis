/**
 * Charge le classeur de prospection CSSR dans la base de prospects.
 *
 * Passe par la même chaîne que l'écran d'import admin (parse → mappage
 * automatique → `importProspects`) : le rapport, la déduplication et les
 * garde-fous sont donc rigoureusement identiques à un import manuel, sans
 * dépendre d'une session navigateur.
 *
 * Simulation par défaut — aucune écriture tant que `--commit` n'est pas passé.
 *
 * Usage :
 *   npx tsx scripts/cssr/import-prospects.ts            # simulation
 *   npx tsx scripts/cssr/import-prospects.ts --commit   # écrit en base
 *   npx tsx scripts/cssr/import-prospects.ts --fichier "autre.xlsx" --commit
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../../src/lib/prisma";
import { parseProspectFile, normalizeRows } from "../../src/lib/prospects/parse";
import { importProspects } from "../../src/lib/prospects/import";

const DEFAULT_FILE = "Centres CSSR - fichier de prospection.xlsx";
const SOURCE = "liste-prefecture-cssr";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const commit = process.argv.includes("--commit");
  const filename = arg("fichier") ?? DEFAULT_FILE;
  const filePath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    console.error(`Fichier introuvable : ${filePath}`);
    console.error(`Générez-le d'abord : npx tsx scripts/cssr/build-xlsx.ts`);
    process.exit(1);
  }

  const parsed = await parseProspectFile({
    buffer: fs.readFileSync(filePath),
    filename: path.basename(filePath),
  });

  const mapped = Object.entries(parsed.mapping).filter(([, field]) => field);
  const ignored = Object.entries(parsed.mapping).filter(([, field]) => !field);

  console.log(`\nFichier   : ${path.basename(filePath)} (${parsed.format})`);
  console.log(`Colonnes  : ${mapped.length} reconnues, ${ignored.length} ignorées`);
  if (ignored.length > 0) {
    console.log(`            ignorées → ${ignored.map(([h]) => h).join(", ")}`);
  }
  console.log(`Lignes    : ${parsed.rows.length}`);

  const rows = normalizeRows({ rows: parsed.rows, mapping: parsed.mapping, defaultSource: SOURCE });

  const report = await importProspects(rows, {
    filename: path.basename(filePath),
    format: parsed.format,
    source: SOURCE,
    mapping: parsed.mapping,
    overwrite: false,
    commit,
  });

  console.log(`\n${commit ? "── Import ──" : "── Simulation (aucune écriture) ──"}`);
  console.log(`  créés          : ${report.nbCrees}`);
  console.log(`  mis à jour     : ${report.nbMisAJour}`);
  console.log(`  ignorés        : ${report.nbIgnores} (dont ${report.nbDoublonsFichier} doublons dans le fichier)`);
  console.log(`  en erreur      : ${report.nbErreurs}`);

  for (const e of report.erreurs.slice(0, 10)) console.log(`    ✗ ligne ${e.ligne} : ${e.motif}`);
  if (report.erreurs.length > 10) console.log(`    … ${report.erreurs.length - 10} autres erreurs`);

  const parMotif = new Map<string, number>();
  for (const w of report.warnings) parMotif.set(w.motif, (parMotif.get(w.motif) ?? 0) + 1);
  if (parMotif.size > 0) {
    console.log(`  anomalies non bloquantes :`);
    for (const [motif, n] of [...parMotif.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ⚠ ${motif} (${n})`);
    }
  }

  if (commit) {
    const total = await prisma.prospect.count();
    console.log(`\n✅ Base prospects : ${total} fiche(s) — import ${report.importId}`);
  } else {
    console.log(`\nRelancer avec --commit pour écrire en base.`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
