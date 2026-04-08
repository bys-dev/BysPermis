import { haversineDistance } from "@/lib/geocoding";

// ─────────────────────────────────────────────────────────────
//  Tests — haversineDistance()
// ─────────────────────────────────────────────────────────────

describe("haversineDistance", () => {
  // Coordonnees GPS de reference
  const PARIS = { lat: 48.8566, lng: 2.3522 };
  const LYON = { lat: 45.764, lng: 4.8357 };
  const MARSEILLE = { lat: 43.2965, lng: 5.3698 };
  const OSNY = { lat: 49.0702, lng: 2.0629 };
  const NEW_YORK = { lat: 40.7128, lng: -74.006 };
  const TOKYO = { lat: 35.6762, lng: 139.6503 };

  it("retourne 0 km pour le meme point", () => {
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      PARIS.lat,
      PARIS.lng
    );
    expect(distance).toBe(0);
  });

  it("calcule la distance Paris → Lyon (~390-395 km)", () => {
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      LYON.lat,
      LYON.lng
    );
    expect(distance).toBeGreaterThan(385);
    expect(distance).toBeLessThan(400);
  });

  it("calcule la distance Paris → Marseille (~660-665 km)", () => {
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      MARSEILLE.lat,
      MARSEILLE.lng
    );
    expect(distance).toBeGreaterThan(655);
    expect(distance).toBeLessThan(670);
  });

  it("calcule la distance Paris → Osny (~30-35 km)", () => {
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      OSNY.lat,
      OSNY.lng
    );
    expect(distance).toBeGreaterThan(25);
    expect(distance).toBeLessThan(40);
  });

  it("est symetrique (A→B = B→A)", () => {
    const parisLyon = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      LYON.lat,
      LYON.lng
    );
    const lyonParis = haversineDistance(
      LYON.lat,
      LYON.lng,
      PARIS.lat,
      PARIS.lng
    );
    expect(parisLyon).toBeCloseTo(lyonParis, 10);
  });

  it("gere les distances intercontinentales (Paris → New York ~5830 km)", () => {
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      NEW_YORK.lat,
      NEW_YORK.lng
    );
    expect(distance).toBeGreaterThan(5800);
    expect(distance).toBeLessThan(5900);
  });

  it("gere les grandes distances (Paris → Tokyo ~9700 km)", () => {
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      TOKYO.lat,
      TOKYO.lng
    );
    expect(distance).toBeGreaterThan(9600);
    expect(distance).toBeLessThan(9800);
  });

  it("retourne toujours un nombre positif", () => {
    const distance = haversineDistance(
      LYON.lat,
      LYON.lng,
      PARIS.lat,
      PARIS.lng
    );
    expect(distance).toBeGreaterThanOrEqual(0);
  });

  it("gere les coordonnees negatives (hemisphere sud)", () => {
    // Sydney, Australie
    const SYDNEY = { lat: -33.8688, lng: 151.2093 };
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      SYDNEY.lat,
      SYDNEY.lng
    );
    expect(distance).toBeGreaterThan(16000);
    expect(distance).toBeLessThan(17500);
  });

  it("gere les coordonnees sur le meridien de Greenwich (longitude 0)", () => {
    // Londres
    const LONDON = { lat: 51.5074, lng: -0.1278 };
    const distance = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      LONDON.lat,
      LONDON.lng
    );
    expect(distance).toBeGreaterThan(330);
    expect(distance).toBeLessThan(350);
  });

  it("respecte l'inegalite triangulaire", () => {
    const parisLyon = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      LYON.lat,
      LYON.lng
    );
    const lyonMarseille = haversineDistance(
      LYON.lat,
      LYON.lng,
      MARSEILLE.lat,
      MARSEILLE.lng
    );
    const parisMarseille = haversineDistance(
      PARIS.lat,
      PARIS.lng,
      MARSEILLE.lat,
      MARSEILLE.lng
    );

    expect(parisMarseille).toBeLessThanOrEqual(parisLyon + lyonMarseille);
  });
});
