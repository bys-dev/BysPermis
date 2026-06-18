/**
 * Vérification santé plateforme — données & routes clés.
 * Usage: npx tsx scripts/verify-platform-health.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL non défini");
const adapter = new PrismaPg({ connectionString });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => PrismaClient)({
  adapter,
});

type Check = { id: string; ok: boolean; detail: string };

const checks: Check[] = [];

function record(id: string, ok: boolean, detail: string) {
  checks.push({ id, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${id}: ${detail}`);
}

async function main() {
  console.log("=== Vérification données plateforme ===\n");

  const [
    users,
    centres,
    formations,
    sessionsActive,
    reservations,
    messages,
    tickets,
    invoices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.centre.count(),
    prisma.formation.count({ where: { isActive: true } }),
    prisma.session.count({ where: { status: "ACTIVE", dateDebut: { gte: new Date() } } }),
    prisma.reservation.count({ where: { status: "CONFIRMEE" } }),
    prisma.message.count(),
    prisma.ticket.count(),
    prisma.invoice.count(),
  ]);

  record("DB.users", users > 0, `${users} utilisateurs`);
  record("DB.centres", centres > 0, `${centres} centres`);
  record("DB.formations", formations > 0, `${formations} formations actives`);
  record("DB.sessions", sessionsActive > 0, `${sessionsActive} sessions actives à venir`);
  record("DB.reservations", reservations > 0, `${reservations} réservations confirmées`);
  record("DB.messages", true, `${messages} messages (OK si 0)`);
  record("DB.tickets", true, `${tickets} tickets`);
  record("DB.invoices", invoices > 0, `${invoices} factures`);

  const centreWithSession = await prisma.centre.findFirst({
    where: {
      formations: {
        some: {
          isActive: true,
          sessions: {
            some: {
              status: "ACTIVE",
              dateDebut: { gte: new Date() },
              placesTotal: { gt: 0 },
            },
          },
        },
      },
    },
    select: {
      id: true,
      nom: true,
      slug: true,
      logo: true,
      signatureUrl: true,
      statut: true,
      isActive: true,
      formations: {
        where: { isActive: true },
        take: 1,
        select: {
          titre: true,
          slug: true,
          sessions: {
            where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
            take: 1,
            select: { id: true, placesTotal: true, placesRestantes: true },
          },
        },
      },
    },
  });

  if (centreWithSession) {
    const f = centreWithSession.formations[0];
    const s = f?.sessions[0];
    record(
      "DATA.parcours-reservation",
      !!s && (s.placesRestantes ?? 0) > 0,
      s
        ? `Centre "${centreWithSession.nom}" — session ${s.id.slice(0, 8)}… (${s.placesRestantes}/${s.placesTotal} places)`
        : "Aucune session bookable"
    );
    record("DATA.centre-slug", !!centreWithSession.slug, `slug: /centres/${centreWithSession.slug}`);
    record("DATA.centre-statut", centreWithSession.statut === "ACTIF", `statut: ${centreWithSession.statut}`);
  } else {
    record("DATA.parcours-reservation", false, "Aucun centre avec session bookable");
  }

  const owner = await prisma.user.findFirst({
    where: { email: "sebastien@bys-formation.fr" },
    select: { id: true, role: true },
  });
  record("DATA.owner", !!owner && owner.role === "OWNER", owner ? `sebastien@bys-formation.fr (${owner.role})` : "introuvable");

  const centreOwner = await prisma.user.findFirst({
    where: { email: "contact@bys-formation.fr" },
    select: {
      id: true,
      email: true,
      role: true,
      centres: { take: 1, select: { nom: true } },
    },
  });
  record(
    "DATA.centre-owner",
    !!centreOwner,
    centreOwner
      ? `${centreOwner.email} → ${centreOwner.centres[0]?.nom ?? "sans centre"}`
      : "introuvable"
  );

  const eleve = await prisma.user.findFirst({
    where: { email: "karim.bouaziz@gmail.com", role: "ELEVE" },
    select: {
      id: true,
      reservations: {
        where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
        take: 1,
        select: { id: true, numero: true },
      },
    },
  });
  record(
    "DATA.eleve-reservation",
    !!eleve,
    eleve
      ? `karim.bouaziz@gmail.com — ${eleve.reservations.length ? `résa ${eleve.reservations[0]!.numero}` : "sans résa confirmée"}`
      : "introuvable"
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n=== Résultat: ${checks.length - failed.length}/${checks.length} OK ===`);
  if (failed.length) {
    console.log("\nÉchecs:");
    failed.forEach((f) => console.log(`  - ${f.id}: ${f.detail}`));
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("ERREUR:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
