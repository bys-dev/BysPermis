import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

const CRON_SECRET = process.env.CRON_SECRET;

/** Durée de conservation des justificatifs d'identité après la fin du stage. */
export const RETENTION_DAYS = 45;
/** Garde-fou : nombre de fichiers détruits par passage. */
const BATCH_SIZE = 200;

/**
 * Kinds purgés : uniquement les pièces personnelles transmises par le stagiaire.
 *
 * NE SONT PAS PURGÉS, volontairement :
 *   - FACTURE       → obligation de conservation comptable (10 ans, art. L123-22 C. com.)
 *   - ATTESTATION   → preuve du suivi du stage, opposable à l'administration
 *   - CONVOCATION / EMARGEMENT → pièces justificatives du stage (contrôle préfecture)
 *   - BON_ACCORD / REGLEMENT   → valeur probante contractuelle
 * Les purger constituerait une perte de pièces légalement exigibles.
 */
const PURGEABLE_KINDS = ["PERMIS", "PIECE_IDENTITE", "LETTRE_48N", "AUTRE"] as const;

/**
 * GET /api/cron/purge-documents
 *
 * Purge RGPD : détruit les justificatifs d'identité des stagiaires
 * RETENTION_DAYS jours après la FIN DU STAGE (`session.dateFin`).
 *
 * La ligne `Document` est conservée avec `purgedAt` horodaté et `blobUrl` vidé :
 * le centre garde la preuve que la pièce a bien été fournie et contrôlée, sans
 * conserver la donnée personnelle elle-même (minimisation).
 *
 * Idempotent : un document déjà purgé (`purgedAt` non nul) est ignoré.
 * À planifier une fois par jour.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const expired = await prisma.document.findMany({
      where: {
        direction: "ELEVE_VERS_CENTRE",
        kind: { in: [...PURGEABLE_KINDS] },
        purgedAt: null,
        reservation: { session: { dateFin: { lte: cutoff } } },
      },
      select: {
        id: true,
        blobUrl: true,
        kind: true,
        reservation: { select: { numero: true, session: { select: { dateFin: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (expired.length === 0) {
      return NextResponse.json({
        retentionDays: RETENTION_DAYS,
        cutoff: cutoff.toISOString(),
        purged: 0,
        message: "Aucun justificatif à purger",
      });
    }

    let filesDeleted = 0;
    const failures: string[] = [];

    for (const doc of expired) {
      try {
        if (doc.blobUrl) {
          await deleteFile(doc.blobUrl);
          filesDeleted++;
        }
        // Le fichier est détruit, la trace reste : on ne supprime PAS la ligne.
        await prisma.document.update({
          where: { id: doc.id },
          data: { blobUrl: null, purgedAt: new Date() },
        });
      } catch (err) {
        console.error(`[cron/purge-documents] échec sur ${doc.id}:`, err);
        failures.push(doc.id);
      }
    }

    console.info(
      `[cron/purge-documents] ${filesDeleted} fichier(s) détruit(s) sur ${expired.length} document(s) expiré(s) (> ${RETENTION_DAYS}j après fin de stage)`,
    );

    return NextResponse.json({
      retentionDays: RETENTION_DAYS,
      cutoff: cutoff.toISOString(),
      examined: expired.length,
      filesDeleted,
      failures,
      truncated: expired.length === BATCH_SIZE,
    });
  } catch (err) {
    console.error("[cron/purge-documents]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
