import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, mapAuthError } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { sendDocumentEmail } from "@/lib/email";
import { EMAIL_KIND } from "@/lib/email-log";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

const verifySchema = z
  .object({
    decision: z.enum(["ACCEPTE", "REFUSE"]),
    motifRefus: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.decision !== "REFUSE" || !!d.motifRefus, {
    message: "Un motif est obligatoire en cas de refus",
    path: ["motifRefus"],
  });

/**
 * PATCH /api/centre/documents/[id]/verify
 *
 * Le centre valide ou refuse un justificatif transmis par le stagiaire
 * (permis, pièce d'identité, lettre 48N). L'élève est prévenu par email et
 * notification ; en cas de refus le motif lui est communiqué pour qu'il puisse
 * renvoyer une pièce conforme.
 *
 * Ne s'applique QU'AUX documents ELEVE_VERS_CENTRE : un document envoyé par le
 * centre n'a pas à être « vérifié » par lui-même (l'acceptation d'un bon d'accord
 * est une action de l'élève, cf. /api/eleve/documents/[id]/accept).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const body = await req.json();
    const { decision, motifRefus } = verifySchema.parse(body);

    // Le document doit appartenir à une réservation du centre du staff connecté.
    const document = await prisma.document.findFirst({
      where: { id, reservation: { session: { formation: { centreId } } } },
      include: {
        reservation: {
          select: {
            id: true,
            userId: true,
            email: true,
            prenom: true,
            numero: true,
            session: { select: { formation: { select: { titre: true } } } },
          },
        },
      },
    });
    if (!document) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }
    if (document.direction !== "ELEVE_VERS_CENTRE") {
      return NextResponse.json(
        { error: "Seuls les documents transmis par le stagiaire peuvent être vérifiés" },
        { status: 400 },
      );
    }
    if (document.purgedAt) {
      return NextResponse.json(
        { error: "Ce document a été supprimé (purge RGPD) et n'est plus vérifiable" },
        { status: 410 },
      );
    }

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: decision,
        verifiedAt: new Date(),
        verifiedById: user.id,
        motifRefus: decision === "REFUSE" ? motifRefus : null,
      },
    });

    // Prévenir l'élève — best-effort, la décision est déjà enregistrée.
    const { reservation } = document;
    const valide = decision === "ACCEPTE";
    await Promise.allSettled([
      sendDocumentEmail({
        to: reservation.email,
        prenom: reservation.prenom,
        sujet: valide
          ? `Justificatif validé — ${document.nom}`
          : `Justificatif à renvoyer — ${document.nom}`,
        intro: valide
          ? `Votre centre a validé votre « ${document.nom} » pour le stage « ${reservation.session.formation.titre} ». Aucune action de votre part n'est nécessaire.`
          : `Votre centre n'a pas pu accepter votre « ${document.nom} » pour le stage « ${reservation.session.formation.titre} ».<br/><br/><strong>Motif :</strong> ${motifRefus}<br/><br/>Merci de déposer une nouvelle pièce depuis votre espace élève.`,
        ctaUrl: `${APP_URL}/espace-eleve/documents`,
        ctaLabel: valide ? "Voir mes documents" : "Renvoyer un justificatif",
        context: {
          kind: EMAIL_KIND.JUSTIFICATIF_VERIFIE,
          reservationId: reservation.id,
          userId: reservation.userId,
          centreId,
        },
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          titre: valide ? "Justificatif validé" : "Justificatif refusé",
          contenu: valide
            ? `Votre « ${document.nom} » a été validé par le centre.`
            : `Votre « ${document.nom} » a été refusé : ${motifRefus}. Merci d'en déposer un nouveau.`,
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[PATCH /api/centre/documents/[id]/verify]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
