/**
 * @jest-environment node
 */

import { variation } from "@/app/admin/dashboard/AdminDashboardClient";

describe("variation — pastille de tendance du dashboard", () => {
  it("n'accole plus un « + » à une valeur négative", () => {
    // Le libellé était construit avec un « + » en dur : une chute de 100 %
    // s'affichait « +-100% », avec une flèche vers le haut et en vert.
    const t = variation(-100);
    expect(t.label).not.toContain("+-");
    expect(t.label).toBe("−100 %");
    expect(t.sens).toBe("baisse");
  });

  it("marque une hausse", () => {
    expect(variation(42)).toEqual({ label: "+42 %", sens: "hausse" });
  });

  it("distingue « stable » de « rien à comparer »", () => {
    expect(variation(0)).toEqual({ label: "stable", sens: "neutre" });
    expect(variation(null)).toEqual({ label: "—", sens: "neutre" });
  });

  it("ne rend jamais de sens autre que les trois attendus", () => {
    for (const valeur of [-250, -1, 0, 1, 900, null]) {
      expect(["hausse", "baisse", "neutre"]).toContain(variation(valeur).sens);
    }
  });
});
