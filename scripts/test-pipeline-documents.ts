/**
 * Test de bout en bout du pipeline « génération → sauvegarde → envoi ».
 *
 * Usage :
 *   TEST_EMAIL_TO=ton@email.fr npx tsx scripts/test-pipeline-documents.ts
 *
 * Ce que le script vérifie :
 *   1. Création d'une réservation de TEST (clairement identifiée TEST-PIPELINE-*)
 *   2. Archivage convocation + facture → upload Cellar + Document.blobUrl + Invoice.pdfUrl
 *   3. Lecture des lignes réellement écrites en base
 *   4. Accessibilité publique HTTP des PDF archivés
 *   5. Envoi d'un email réel avec les 2 PDF joints + écriture dans EmailLog
 *   6. NETTOYAGE COMPLET (objets Cellar, documents, facture, logs, réservation)
 *
 * Sécurité :
 *   - N'appelle PAS `fulfillReservation`, qui notifierait par email les vrais
 *     centres partenaires. Seule l'adresse TEST_EMAIL_TO reçoit quelque chose.
 *   - Le bloc `finally` nettoie même en cas d'échec en cours de route.
 *   - Ne touche pas à `session.placesRestantes`.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { archiveConvocation, archiveFacture } from "@/lib/documents";
import { sendDocumentEmail } from "@/lib/email";
import { EMAIL_KIND } from "@/lib/email-log";
import { deleteFile, HAS_CELLAR, HAS_BLOB } from "@/lib/storage";

const DEST = process.env.TEST_EMAIL_TO;
const created: { resaId?: string; urls: string[] } = { urls: [] };

(async () => {
  if (!DEST) throw new Error("Définis TEST_EMAIL_TO=ton@email.fr");

  console.log("=== 0. Backend de stockage ===");
  console.log("HAS_CELLAR:", HAS_CELLAR, "| HAS_BLOB:", HAS_BLOB);
  if (!HAS_CELLAR && !HAS_BLOB) {
    console.warn("!! Aucun stockage distant : les fichiers iront sur le disque local (éphémère en prod)");
  }

  const session = await prisma.session.findFirst({
    where: { formation: { is: { centre: { is: {} } } } },
    include: { formation: { include: { centre: true } } },
    orderBy: { dateDebut: "desc" },
  });
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!session || !user) throw new Error("Aucune session ou aucun utilisateur en base");
  console.log("session :", session.id, "| centre:", session.formation.centre.nom);

  console.log("\n=== 1. Création d'une réservation de TEST ===");
  const resa = await prisma.reservation.create({
    data: {
      numero: "TEST-PIPELINE-" + Date.now(),
      userId: user.id,
      sessionId: session.id,
      montant: 230,
      status: "CONFIRMEE",
      civilite: "M.",
      nom: "TEST",
      prenom: "Pipeline",
      email: DEST,
      telephone: "0600000000",
      adresse: "1 rue de Test",
      codePostal: "95000",
      ville: "Cergy",
      numeroPermis: "TEST123456",
    },
  });
  created.resaId = resa.id;
  console.log("créée:", resa.numero);

  console.log("\n=== 2. Archivage convocation + facture ===");
  const conv = await archiveConvocation(resa.id, session.formation.centreId);
  created.urls.push(conv.url);
  console.log("convocation ->", conv.url, "|", conv.buffer.length, "octets | nouveau:", conv.created);
  const fac = await archiveFacture(resa.id, session.formation.centreId);
  created.urls.push(fac.url);
  console.log("facture     ->", fac.url, "|", fac.buffer.length, "octets | nouveau:", fac.created);

  console.log("\n=== 3. Vérification en base ===");
  const docs = await prisma.document.findMany({
    where: { reservationId: resa.id },
    select: { kind: true, blobUrl: true, taille: true },
  });
  docs.forEach((d) =>
    console.log(`  Document ${d.kind}: blobUrl=${d.blobUrl ? "OUI" : "NON"} taille=${d.taille}`),
  );
  const inv = await prisma.invoice.findFirst({
    where: { reservationId: resa.id },
    select: { numero: true, pdfUrl: true, montantHT: true, tva: true, montantTTC: true },
  });
  console.log(
    "  Invoice:", inv?.numero,
    "| pdfUrl:", inv?.pdfUrl ? "RENSEIGNÉ" : "VIDE",
    "| HT:", inv?.montantHT, "TVA:", inv?.tva, "TTC:", inv?.montantTTC,
  );

  console.log("\n=== 4. Accessibilité publique des PDF ===");
  for (const u of created.urls) {
    const r = await fetch(u);
    console.log(" ", r.status, r.headers.get("content-type"), "→", u.split("/").pop());
  }

  console.log("\n=== 5. Envoi email + journal EmailLog ===");
  await sendDocumentEmail({
    to: DEST,
    prenom: "Andrys",
    sujet: "[TEST] Pipeline complet — documents archivés",
    intro:
      "Test de bout en bout : convocation et facture générées, archivées sur le storage et tracées en base. PDF joints.",
    attachments: [
      { filename: conv.filename, content: conv.buffer },
      { filename: fac.filename, content: fac.buffer },
    ],
    context: {
      kind: EMAIL_KIND.DOCUMENTS_AUTO,
      reservationId: resa.id,
      userId: user.id,
      centreId: session.formation.centreId,
    },
  });
  const logs = await prisma.emailLog.findMany({
    where: { reservationId: resa.id },
    select: { kind: true, status: true, providerId: true, destinataire: true },
  });
  logs.forEach((l) =>
    console.log(`  EmailLog ${l.kind}: ${l.status} | resend=${l.providerId} | ${l.destinataire}`),
  );
})()
  .catch((e) => {
    console.error("\nECHEC:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    console.log("\n=== 6. NETTOYAGE ===");
    for (const u of created.urls) {
      await deleteFile(u);
      console.log("  objet storage supprimé:", u.split("/").pop());
    }
    if (created.resaId) {
      await prisma.emailLog.deleteMany({ where: { reservationId: created.resaId } });
      await prisma.document.deleteMany({ where: { reservationId: created.resaId } });
      await prisma.invoice.deleteMany({ where: { reservationId: created.resaId } });
      await prisma.reservation.delete({ where: { id: created.resaId } });
      console.log("  réservation de test + documents + facture + logs supprimés");
    }
    console.log("  réservations restantes en base:", await prisma.reservation.count());
    await prisma.$disconnect();
  });
