import { promises as fs } from "fs";
import path from "path";
import { parseProspectFile, normalizeRows } from "@/lib/prospects/parse";
import { computeDedupeKey } from "@/lib/prospects/import";

async function main() {
  const file = path.join(process.cwd(), "Centres CSSR - fichier de prospection.xlsx");
  const buffer = await fs.readFile(file);
  const parsed = await parseProspectFile({ buffer, filename: path.basename(file) });

  console.log("format :", parsed.format, "| lignes :", parsed.rows.length);
  console.log("\nMappage automatique des colonnes :");
  const nonMappees: string[] = [];
  for (const [col, field] of Object.entries(parsed.mapping)) {
    console.log(`  ${field ? "OK " : "-- "} ${col.padEnd(26)} -> ${field ?? "(non reconnue)"}`);
    if (!field) nonMappees.push(col);
  }

  const results = normalizeRows({ rows: parsed.rows, mapping: parsed.mapping });
  const rejets = results.filter((r) => r.motif);
  const warnings = results.flatMap((r) => r.warnings);
  const keys = new Set(results.filter((r) => r.input).map((r) => computeDedupeKey(r.input!)));

  console.log(`\nLignes importables : ${results.length - rejets.length}/${results.length}`);
  console.log(`Rejets             : ${rejets.length}`, rejets.slice(0, 5).map((r) => `L${r.ligne}: ${r.motif}`));
  console.log(`Avertissements     : ${warnings.length}`, [...new Set(warnings)].slice(0, 8));
  console.log(`Clés de dédoublonnage distinctes : ${keys.size} (doublons résiduels : ${results.length - rejets.length - keys.size})`);
  console.log(`Colonnes non reconnues : ${nonMappees.length ? nonMappees.join(", ") : "aucune"}`);

  const ex = results.find((r) => r.input?.email)?.input;
  console.log("\nExemple de fiche normalisée :", JSON.stringify({ ...ex, raw: undefined, notesInternes: ex?.notesInternes?.slice(0, 90) + "…" }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
