import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { sendQuestionnaireEmail, sendDocumentEmail } from "@/lib/email";
import { renderIndividualEmargementPdf } from "@/lib/pdf-helpers";
import { z } from "zod";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL ?? "https://bys-permis.vercel.app";

const emargementSchema = z.object({
  attendance: z.record(z.string(), z.boolean()),
});

// POST /api/centre/formateur/sessions/[id]/emargement — save attendance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // Verify session belongs to this centre
    const session = await prisma.session.findFirst({
      where: { id: sessionId, formation: { centreId } },
    });
    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { attendance } = emargementSchema.parse(body);

    // For now, we update reservation status based on attendance.
    // Users marked as present who have CONFIRMEE reservations -> TERMINEE
    // This is a v1 approach. V2 would use a dedicated Emargement table.
    const presentUserIds = Object.entries(attendance)
      .filter(([, present]) => present)
      .map(([userId]) => userId);

    if (presentUserIds.length > 0) {
      await prisma.reservation.updateMany({
        where: {
          sessionId,
          userId: { in: presentUserIds },
          status: "CONFIRMEE",
        },
        data: { status: "TERMINEE" },
      });

      // Notify users that their attestation is available
      const terminatedReservations = await prisma.reservation.findMany({
        where: {
          sessionId,
          userId: { in: presentUserIds },
          status: "TERMINEE",
        },
        include: {
          session: {
            include: {
              formation: {
                include: { centre: { select: { nom: true } } },
              },
            },
          },
        },
      });

      const notificationPromises = terminatedReservations.flatMap((r) => [
        prisma.notification.create({
          data: {
            userId: r.userId,
            titre: "Attestation de formation disponible",
            contenu: `Votre attestation pour "${r.session.formation.titre}" est disponible. Rendez-vous dans vos formations pour la telecharger.`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: r.userId,
            titre: "Questionnaire satisfaction",
            contenu: `Partagez votre avis sur ${r.session.formation.titre} : 5 questions sur le centre et 5 sur BYS Permis. Rendez-vous dans Mes avis.`,
          },
        }),
      ]);
      await Promise.all(notificationPromises);

      await Promise.allSettled(
        terminatedReservations.map((r) =>
          sendQuestionnaireEmail({
            to: r.email,
            prenom: r.prenom,
            formationTitle: r.session.formation.titre,
            centreName: r.session.formation.centre.nom,
            questionnaireUrl: `${APP_URL}/espace-eleve/avis/${r.id}`,
          }),
        ),
      );

      await prisma.reservation.updateMany({
        where: {
          id: { in: terminatedReservations.map((r) => r.id) },
        },
        data: { questionnaireEnvoye: true },
      });

      // Feuille d'émargement individuelle : générée et envoyée par PDF à chaque stagiaire présent
      await Promise.allSettled(
        terminatedReservations.map(async (r) => {
          // Évite les doublons si l'émargement est revalidé
          const already = await prisma.document.findFirst({
            where: { reservationId: r.id, kind: "EMARGEMENT" },
          });
          if (already) return;
          const pdf = await renderIndividualEmargementPdf(r.id);
          await prisma.document.create({
            data: {
              kind: "EMARGEMENT",
              direction: "CENTRE_VERS_ELEVE",
              nom: "Feuille d'émargement",
              mimeType: "application/pdf",
              status: "ENVOYE",
              reservationId: r.id,
              centreId,
              uploadedById: user.id,
            },
          });
          await sendDocumentEmail({
            to: r.email,
            prenom: r.prenom,
            sujet: `Feuille d'émargement — ${r.session.formation.titre}`,
            intro: `Votre présence au stage « ${r.session.formation.titre} » a été validée. Vous trouverez ci-joint votre feuille d'émargement individuelle.`,
            ctaUrl: `${APP_URL}/espace-eleve/documents`,
            ctaLabel: "Voir mes documents",
            attachments: [{ filename: pdf.filename, content: pdf.buffer }],
          });
        }),
      );
    }

    return NextResponse.json({
      success: true,
      present: presentUserIds.length,
      total: Object.keys(attendance).length,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/centre/formateur/sessions/[id]/emargement]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
