import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth0";
import { notifyReservationCancelled } from "@/lib/event-notifications";
import { z } from "zod";

// ─── GET /api/reservations/[id] — détail d'une réservation ───
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            formation: {
              include: {
                centre: {
                  select: {
                    id: true,
                    nom: true,
                    ville: true,
                    adresse: true,
                    codePostal: true,
                    telephone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!reservation || reservation.userId !== user.id) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Flatten response
    const result = {
      id: reservation.id,
      numero: reservation.numero,
      status: reservation.status,
      montant: reservation.montant,
      commissionMontant: reservation.commissionMontant,
      stripePaymentId: reservation.stripePaymentId,
      civilite: reservation.civilite,
      nom: reservation.nom,
      prenom: reservation.prenom,
      email: reservation.email,
      telephone: reservation.telephone,
      adresse: reservation.adresse,
      codePostal: reservation.codePostal,
      ville: reservation.ville,
      numeroPermis: reservation.numeroPermis,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      session: {
        id: reservation.session.id,
        dateDebut: reservation.session.dateDebut,
        dateFin: reservation.session.dateFin,
        placesTotal: reservation.session.placesTotal,
        placesRestantes: reservation.session.placesRestantes,
        status: reservation.session.status,
        formation: {
          id: reservation.session.formation.id,
          titre: reservation.session.formation.titre,
          slug: reservation.session.formation.slug,
          description: reservation.session.formation.description,
          duree: reservation.session.formation.duree,
          prix: reservation.session.formation.prix,
          modalite: reservation.session.formation.modalite,
          lieu: reservation.session.formation.lieu,
          isQualiopi: reservation.session.formation.isQualiopi,
          isCPF: reservation.session.formation.isCPF,
          centre: reservation.session.formation.centre,
        },
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/reservations/[id]] DB error:", err);
    return NextResponse.json(null);
  }
}

// ─── PATCH /api/reservations/[id] — annuler une réservation ───
const patchSchema = z.object({
  action: z.literal("cancel"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const data = patchSchema.parse(body);

    if (data.action === "cancel") {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Find reservation & verify ownership
        const reservation = await tx.reservation.findUnique({
          where: { id },
          include: {
            session: {
              include: {
                formation: { select: { titre: true } },
              },
            },
          },
        });

        if (!reservation || reservation.userId !== user.id) {
          throw new Error("NOT_FOUND");
        }

        if (
          reservation.status !== "EN_ATTENTE" &&
          reservation.status !== "CONFIRMEE"
        ) {
          throw new Error("INVALID_STATUS");
        }

        // 2. Attempt Stripe refund if payment exists and status is CONFIRMEE
        let newStatus: "ANNULEE" | "REMBOURSEE" = "ANNULEE";

        if (
          reservation.stripePaymentId &&
          reservation.status === "CONFIRMEE"
        ) {
          try {
            await stripe.refunds.create({
              payment_intent: reservation.stripePaymentId,
            });
            newStatus = "REMBOURSEE";
          } catch (stripeErr) {
            console.error(
              "[PATCH /api/reservations/[id]] Stripe refund error:",
              stripeErr
            );
            // Continue with ANNULEE status if refund fails
          }
        }

        // 3. Update reservation status
        const updated = await tx.reservation.update({
          where: { id },
          data: { status: newStatus },
          include: {
            session: {
              include: {
                formation: {
                  include: {
                    centre: {
                      select: {
                        id: true,
                        nom: true,
                        ville: true,
                        adresse: true,
                        codePostal: true,
                        telephone: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // 4. Increment session places
        await tx.session.update({
          where: { id: reservation.sessionId },
          data: {
            placesRestantes: { increment: 1 },
            status:
              reservation.session.status === "COMPLETE"
                ? "ACTIVE"
                : reservation.session.status,
          },
        });

        // 5. Create notification
        const statusLabel =
          newStatus === "REMBOURSEE" ? "annulée et remboursée" : "annulée";
        await tx.notification.create({
          data: {
            userId: user.id,
            titre: "Réservation annulée",
            contenu: `Votre réservation ${reservation.numero} pour "${reservation.session.formation.titre}" a été ${statusLabel}.`,
          },
        });

        return { updated, newStatus };
      });

      const centre = result.updated.session.formation.centre;

      // Emails + notifications centre (hors transaction)
      notifyReservationCancelled({
        centreId: centre.id,
        reservationNumber: result.updated.numero,
        eleveName: `${result.updated.prenom} ${result.updated.nom}`,
        eleveEmail: result.updated.email,
        elevePrenom: result.updated.prenom,
        formationTitle: result.updated.session.formation.titre,
        sessionDate: result.updated.session.dateDebut.toLocaleDateString("fr-FR"),
        centreName: centre.nom,
        refunded: result.newStatus === "REMBOURSEE",
      }).catch((err) => {
        console.error("[PATCH /api/reservations/[id]] Notification annulation:", err);
      });

      // Flatten response (same shape as GET)
      const response = {
        id: result.updated.id,
        numero: result.updated.numero,
        status: result.updated.status,
        montant: result.updated.montant,
        commissionMontant: result.updated.commissionMontant,
        stripePaymentId: result.updated.stripePaymentId,
        civilite: result.updated.civilite,
        nom: result.updated.nom,
        prenom: result.updated.prenom,
        email: result.updated.email,
        telephone: result.updated.telephone,
        adresse: result.updated.adresse,
        codePostal: result.updated.codePostal,
        ville: result.updated.ville,
        numeroPermis: result.updated.numeroPermis,
        createdAt: result.updated.createdAt,
        updatedAt: result.updated.updatedAt,
        session: {
          id: result.updated.session.id,
          dateDebut: result.updated.session.dateDebut,
          dateFin: result.updated.session.dateFin,
          placesTotal: result.updated.session.placesTotal,
          placesRestantes: result.updated.session.placesRestantes,
          status: result.updated.session.status,
          formation: {
            id: result.updated.session.formation.id,
            titre: result.updated.session.formation.titre,
            slug: result.updated.session.formation.slug,
            description: result.updated.session.formation.description,
            duree: result.updated.session.formation.duree,
            prix: result.updated.session.formation.prix,
            modalite: result.updated.session.formation.modalite,
            lieu: result.updated.session.formation.lieu,
            isQualiopi: result.updated.session.formation.isQualiopi,
            isCPF: result.updated.session.formation.isCPF,
            centre,
          },
        },
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err instanceof Error) {
      const messages: Record<string, { msg: string; status: number }> = {
        NOT_FOUND: { msg: "Réservation introuvable", status: 404 },
        INVALID_STATUS: {
          msg: "Cette réservation ne peut pas être annulée",
          status: 400,
        },
        "Non authentifié": {
          msg: "Vous devez être connecté",
          status: 401,
        },
      };
      const mapped = messages[err.message];
      if (mapped) {
        return NextResponse.json(
          { error: mapped.msg },
          { status: mapped.status }
        );
      }
    }
    console.error("[PATCH /api/reservations/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
