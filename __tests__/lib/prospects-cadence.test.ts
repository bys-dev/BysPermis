import { attenteRestante, formatAttente, type CampagneCadence } from "@/lib/prospects/cadence";

// ─────────────────────────────────────────────────────────────
//  Tests — compte à rebours entre deux lots de campagne
// ─────────────────────────────────────────────────────────────

/** 12 h 00 pile, en millisecondes. */
const MIDI = new Date("2026-08-27T12:00:00.000Z").getTime();
const CADENCE = 5;

function campagne(over: Partial<CampagneCadence> = {}): CampagneCadence {
  return { statut: "EN_COURS", dernierEnvoiAt: new Date(MIDI).toISOString(), ...over };
}

describe("attenteRestante", () => {
  // ─── Cas nominal ─────────────────────────────────────────
  it("decompte le temps restant depuis le dernier lot", () => {
    // 2 minutes se sont ecoulees : il en reste 3.
    const reste = attenteRestante(campagne(), MIDI + 2 * 60_000, CADENCE);
    expect(reste).toBe(3 * 60_000);
  });

  it("retourne 0 une fois la cadence ecoulee", () => {
    expect(attenteRestante(campagne(), MIDI + 5 * 60_000, CADENCE)).toBe(0);
  });

  it("ne renvoie jamais de valeur negative, meme longtemps apres", () => {
    expect(attenteRestante(campagne(), MIDI + 60 * 60_000, CADENCE)).toBe(0);
  });

  // ─── Cas ou il n'y a rien a attendre ──────────────────────
  it("ignore une campagne qui n'est pas en cours d'envoi", () => {
    for (const statut of ["BROUILLON", "PROGRAMMEE", "PAUSEE", "ENVOYEE", "ANNULEE"]) {
      expect(attenteRestante(campagne({ statut }), MIDI + 60_000, CADENCE)).toBe(0);
    }
  });

  it("ignore une campagne dont aucun lot n'est encore parti", () => {
    expect(attenteRestante(campagne({ dernierEnvoiAt: null }), MIDI + 60_000, CADENCE)).toBe(0);
  });

  it("n'affiche rien tant que l'horloge du navigateur n'a pas demarre", () => {
    // `maintenant = 0` : premier rendu, avant le premier tic.
    expect(attenteRestante(campagne(), 0, CADENCE)).toBe(0);
  });

  it("ne produit pas de NaN sur une date illisible", () => {
    expect(attenteRestante(campagne({ dernierEnvoiAt: "pas une date" }), MIDI, CADENCE)).toBe(0);
  });

  // ─── Cadence configurable ────────────────────────────────
  it("suit la cadence fournie par le serveur", () => {
    // Si la crontab passe a 10 minutes, l'attente doit suivre.
    expect(attenteRestante(campagne(), MIDI, 10)).toBe(10 * 60_000);
  });
});

describe("formatAttente", () => {
  it("formate en minutes:secondes sur deux chiffres", () => {
    expect(formatAttente(4 * 60_000 + 7_000)).toBe("4:07");
    expect(formatAttente(60_000)).toBe("1:00");
    expect(formatAttente(9_000)).toBe("0:09");
  });

  it("arrondit a la seconde superieure pour ne jamais afficher 0:00 par anticipation", () => {
    expect(formatAttente(1)).toBe("0:01");
    expect(formatAttente(1_400)).toBe("0:02");
  });

  it("affiche 0:00 a echeance et pour une valeur negative", () => {
    expect(formatAttente(0)).toBe("0:00");
    expect(formatAttente(-5_000)).toBe("0:00");
  });
});
