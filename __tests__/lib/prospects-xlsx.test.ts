import ExcelJS from "exceljs";
import { parseProspectFile, normalizeRows } from "@/lib/prospects/parse";

/**
 * Le chemin Excel est celui que le client utilisera en premier (les listes de
 * centres agréés circulent en .xlsx). On fabrique donc un vrai classeur et on le
 * relit, plutôt que de se fier au parsing CSV pour valider l'import.
 */
async function classeur(
  lignes: unknown[][],
  options: { avantEntetes?: unknown[][] } = {},
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Centres");
  for (const ligne of options.avantEntetes ?? []) sheet.addRow(ligne);
  for (const ligne of lignes) sheet.addRow(ligne);
  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}

describe("parseProspectFile — XLSX", () => {
  it("lit un classeur et mappe les colonnes", async () => {
    const buffer = await classeur([
      ["Nom du centre", "Courriel", "Ville", "Code postal", "Téléphone"],
      ["Centre A", "a@x.fr", "Cergy", "95000", "01 23 45 67 89"],
      ["Centre B", "b@y.fr", "Osny", "95520", "01 98 76 54 32"],
    ]);

    const parsed = await parseProspectFile({ buffer, filename: "centres.xlsx" });

    expect(parsed.format).toBe("XLSX");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.mapping["Nom du centre"]).toBe("nom");
    expect(parsed.mapping["Courriel"]).toBe("email");
    expect(parsed.mapping["Code postal"]).toBe("codePostal");
    expect(parsed.rows[0]["Ville"]).toBe("Cergy");
  });

  it("saute les lignes de titre avant les en-têtes", async () => {
    // Les exports administratifs commencent souvent par un titre et une ligne vide.
    const buffer = await classeur(
      [
        ["Nom du centre", "Courriel", "Ville"],
        ["Centre A", "a@x.fr", "Cergy"],
      ],
      { avantEntetes: [["Liste des centres agréés — avril 2026"], []] },
    );

    const parsed = await parseProspectFile({ buffer, filename: "centres.xlsx" });
    expect(parsed.headers).toContain("Nom du centre");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]["Nom du centre"]).toBe("Centre A");
  });

  it("ignore les lignes entièrement vides", async () => {
    const buffer = await classeur([
      ["Nom du centre", "Ville"],
      ["Centre A", "Cergy"],
      ["", ""],
      ["Centre B", "Osny"],
    ]);
    const parsed = await parseProspectFile({ buffer, filename: "centres.xlsx" });
    expect(parsed.rows).toHaveLength(2);
  });

  it("aplatit les cellules non textuelles (nombres, liens)", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Centres");
    sheet.addRow(["Nom du centre", "Code postal", "Site web"]);
    const ligne = sheet.addRow(["Centre A", 95000, null]);
    // Cellule de type lien hypertexte.
    ligne.getCell(3).value = { text: "exemple.fr", hyperlink: "https://exemple.fr" };
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const parsed = await parseProspectFile({ buffer, filename: "centres.xlsx" });
    expect(parsed.rows[0]["Code postal"]).toBe("95000");
    expect(parsed.rows[0]["Site web"]).toBe("exemple.fr");
  });

  it("suffixe les colonnes homonymes au lieu de les écraser", async () => {
    const buffer = await classeur([
      ["Email", "Email"],
      ["a@x.fr", "b@y.fr"],
    ]);
    const parsed = await parseProspectFile({ buffer, filename: "centres.xlsx" });
    expect(parsed.headers).toEqual(["Email", "Email (2)"]);
    expect(parsed.rows[0]["Email"]).toBe("a@x.fr");
    expect(parsed.rows[0]["Email (2)"]).toBe("b@y.fr");
  });

  it("produit des prospects exploitables de bout en bout", async () => {
    const buffer = await classeur([
      ["Nom du centre", "Courriel", "Ville", "Code postal"],
      ["Centre A", "a@x.fr", "Cergy", "95000"],
      ["", "orphelin@x.fr", "Nulle part", "00000"],
    ]);

    const parsed = await parseProspectFile({ buffer, filename: "centres.xlsx" });
    const rows = normalizeRows({ rows: parsed.rows, mapping: parsed.mapping, defaultSource: "test" });

    const retenus = rows.filter((r) => r.input);
    const rejetes = rows.filter((r) => r.motif);

    expect(retenus).toHaveLength(1);
    expect(retenus[0].input?.nom).toBe("Centre A");
    expect(retenus[0].input?.departement).toBe("95");
    expect(retenus[0].input?.source).toBe("test");
    // La ligne sans nom est rejetée, pas importée à moitié.
    expect(rejetes).toHaveLength(1);
  });
});
