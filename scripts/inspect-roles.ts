import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const byRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
  console.log("=== USERS PAR ROLE ===");
  for (const g of byRole) console.log(`${g.role}: ${g._count._all}`);

  // Centre owners: who owns each centre, and their user role
  const centres = await prisma.centre.findMany({
    select: { id: true, nom: true, ville: true, statut: true, user: { select: { email: true, role: true, prenom: true, nom: true } } },
  });
  console.log("\n=== CENTRES & leur user proprietaire ===");
  for (const c of centres) {
    console.log(`- ${c.nom} (${c.ville}, ${c.statut}) -> ${c.user?.email ?? "??"} [role=${c.user?.role ?? "??"}]`);
  }

  // CentreMembre table (team) if exists
  try {
    const membres = await (prisma as any).centreMembre.findMany({
      select: { role: true, user: { select: { email: true, role: true } }, centre: { select: { nom: true } } },
    });
    console.log("\n=== CENTRE MEMBRES (équipe) ===");
    for (const m of membres) console.log(`- ${m.centre?.nom}: ${m.user?.email} [membreRole=${m.role} | userRole=${m.user?.role}]`);
  } catch (e) {
    console.log("\n(pas de table centreMembre ou erreur)", e instanceof Error ? e.message : e);
  }

  // Specific accounts from screenshot
  const emails = ["bysforma95@gmail.com", "centreteste@mail.com", "bysprospects@gmail.com", "alloecotransport78@gmail.com"];
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true, role: true, auth0Id: true } });
  console.log("\n=== COMPTES CIBLES ===");
  for (const u of users) console.log(`- ${u.email} [role=${u.role}] auth0=${u.auth0Id?.slice(0, 18)}`);
}

main().finally(() => prisma.$disconnect());
