import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";
import { generateReservationNumber, calculateCommission } from "@/lib/utils";
import { sendConfirmationEmail, sendCentreNotificationEmail, resend } from "@/lib/email";
import { renderEmailTemplate } from "@/lib/email-templates";
import { formatDate } from "@/lib/utils";

// ─── GET /api/reservations — mes réservations ─────────────
export async function GET() {
  try {
    const user = await requireAuth();
    const reservations = await prisma.reservation.findMany({
      where: { userId: user.id },
      include: {
        session: {
          include: {
            formation: {
              include: { centre: { select: { nom: true, ville: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten the response so the frontend gets all useful fields
    const result = reservations.map((r) => ({
      id: r.id,
      numero: r.numero,
      status: r.status,
      montant: r.montant,
      createdAt: r.createdAt,
      session: {
        dateDebut: r.session.dateDebut,
        dateFin: r.session.dateFin,
        placesRestantes: r.session.placesRestantes,
        formation: {
          titre: r.session.formation.titre,
          slug: r.session.formation.slug,
          prix: r.session.formation.prix,
          lieu: r.session.formation.lieu,
          duree: r.session.formation.duree,
          centre: {
            nom: r.session.formation.centre.nom,
            ville: r.session.formation.centre.ville,
          },
        },
      },
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── POST /api/reservations — créer une réservation ──────
const createSchema = z.object({
  sessionId: z.string().min(1),
  civilite: z.string().optional(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().min(10),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  numeroPermis: z.string().optional(),
  stripePaymentIntentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createSchema.parse(body);

    // 1. Vérifier la session et les places disponibles (transaction atomique)
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: data.sessionId },
        include: { formation: { include: { centre: true } } },
      });

      if (!session) throw new Error("SESSION_NOT_FOUND");
      if (session.status !== "ACTIVE") throw new Error("SESSION_INACTIVE");
      if (session.placesRestantes <= 0) throw new Error("SESSION_FULL");

      // 2. Vérifier le paiement Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(data.stripePaymentIntentId);
      if (paymentIntent.status !== "succeeded") throw new Error("PAYMENT_NOT_SUCCEEDED");
      if (paymentIntent.amount !== Math.round(session.formation.prix * 100)) throw new Error("PAYMENT_AMOUNT_MISMATCH");

      // 3. Calculer la commission
      const commissionRate = Number(process.env.COMMISSION_RATE ?? 0.1) * 100;
      const { commission } = calculateCommission(session.formation.prix, commissionRate);

      // 4. Créer la réservation
      const reservation = await tx.reservation.create({
        data: {
          numero: generateReservationNumber(),
          userId: user.id,
          sessionId: session.id,
          status: "CONFIRMEE",
          montant: session.formation.prix,
          commissionMontant: commission,
          stripePaymentId: data.stripePaymentIntentId,
          civilite: data.civilite,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          codePostal: data.codePostal,
          ville: data.ville,
          numeroPermis: data.numeroPermis,
        },
      });

      // 5. Décrémenter les places
      await tx.session.update({
        where: { id: session.id },
        data: {
          placesRestantes: { decrement: 1 },
          status: session.placesRestantes === 1 ? "COMPLETE" : "ACTIVE",
        },
      });

      // 6. Créer la notification pour l'élève
      await tx.notification.create({
        data: {
          userId: user.id,
          titre: "Réservation confirmée",
          contenu: `Votre réservation ${reservation.numero} pour le stage "${session.formation.titre}" est confirmée.`,
        },
      });

      // 7. Créer l'enregistrement de commission (suivi paiement centre)
      const stripeConnectUsed = !!session.formation.centre.stripeOnboardingDone && !!session.formation.centre.stripeAccountId;
      await tx.centrePayment.create({
        data: {
          centreId: session.formation.centre.id,
          type: "COMMISSION",
          montant: commission,
          description: `Commission réservation #${reservation.numero} — ${session.formation.titre}`,
          stripeId: data.stripePaymentIntentId,
          status: stripeConnectUsed ? "PAYE" : "EN_ATTENTE",
          periode: new Date().toISOString().slice(0, 7),
        },
      });

      // 8. Créer la facture automatiquement
      const invoiceCount = await tx.invoice.count();
      const invoiceNum = `FAC-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;
      const montantHT = Math.round((reservation.montant / 1.2) * 100) / 100;
      const tvaAmount = Math.round((reservation.montant - montantHT) * 100) / 100;
      await tx.invoice.create({
        data: {
          numero: invoiceNum,
          type: "ELEVE",
          montantHT,
          tva: tvaAmount,
          montantTTC: reservation.montant,
          status: "PAYEE",
          userId: user.id,
          reservationId: reservation.id,
        },
      });

      // 9. Loyalty points — gain de points sur réservation
      const pointsEarned = Math.floor(reservation.montant);
      await tx.loyaltyPoints.create({
        data: {
          userId: user.id,
          points: pointsEarned,
          type: "GAIN",
          description: `Réservation #${reservation.numero}`,
        },
      });
      const currentUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      const newTotal = currentUser.totalPoints + pointsEarned;
      const newLevel = newTotal >= 5000 ? "PLATINUM" : newTotal >= 1500 ? "GOLD" : newTotal >= 500 ? "SILVER" : "BRONZE";
      await tx.user.update({
        where: { id: user.id },
        data: { totalPoints: newTotal, loyaltyLevel: newLevel },
      });

      // 10. Referral reward — première réservation d'un filleul
      if (currentUser.referredBy) {
        const previousReservations = await tx.reservation.count({
          where: { userId: user.id, id: { not: reservation.id } },
        });
        if (previousReservations === 0) {
          // C'est la première réservation du filleul
          const referrer = await tx.user.findFirst({
            where: { referralCode: currentUser.referredBy },
          });
          if (referrer) {
            // 200 points au parrain
            await tx.loyaltyPoints.create({
              data: {
                userId: referrer.id,
                points: 200,
                type: "GAIN",
                description: `Parrainage — ${currentUser.prenom} ${currentUser.nom}`,
              },
            });
            const referrerNewTotal = referrer.totalPoints + 200;
            const referrerNewLevel = referrerNewTotal >= 5000 ? "PLATINUM" : referrerNewTotal >= 1500 ? "GOLD" : referrerNewTotal >= 500 ? "SILVER" : "BRONZE";
            await tx.user.update({
              where: { id: referrer.id },
              data: { totalPoints: referrerNewTotal, loyaltyLevel: referrerNewLevel },
            });
            await tx.notification.create({
              data: {
                userId: referrer.id,
                titre: "Bonus parrainage !",
                contenu: `Votre filleul ${currentUser.prenom} a réservé son premier stage. Vous gagnez 200 points de fidélité !`,
              },
            });

            // 100 points au filleul
            await tx.loyaltyPoints.create({
              data: {
                userId: user.id,
                points: 100,
                type: "GAIN",
                description: "Bonus de bienvenue (parrainage)",
              },
            });
            const filleulNewTotal = newTotal + 100;
            const filleulNewLevel = filleulNewTotal >= 5000 ? "PLATINUM" : filleulNewTotal >= 1500 ? "GOLD" : filleulNewTotal >= 500 ? "SILVER" : "BRONZE";
            await tx.user.update({
              where: { id: user.id },
              data: { totalPoints: filleulNewTotal, loyaltyLevel: filleulNewLevel },
            });
          }
        }
      }

      return { reservation, session };
    });

    // 7. Envoyer les emails (hors transaction)
    const APP_URL = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
    const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@bysformations.fr>";
    const centre = result.session.formation.centre;

    try {
      const emailPromises: Promise<unknown>[] = [
        sendConfirmationEmail({
          to: data.email,
          reservationNumber: result.reservation.numero,
          formationTitle: result.session.formation.titre,
          sessionDate: result.session.dateDebut.toLocaleDateString("fr-FR"),
          centreName: centre.nom,
        }),
      ];

      // Centre notification
      if (centre.email) {
        emailPromises.push(
          sendCentreNotificationEmail({
            to: centre.email,
            eleveName: `${data.prenom} ${data.nom}`,
            formationTitle: result.session.formation.titre,
            sessionDate: result.session.dateDebut.toLocaleDateString("fr-FR"),
            amount: result.reservation.montant * (1 - Number(process.env.COMMISSION_RATE ?? 0.1)),
          })
        );
      }

      // Convocation email via template system
      const lienConvocation = `${APP_URL}/api/convocation/${result.reservation.id}`;
      const convocationVars: Record<string, string> = {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        formation: result.session.formation.titre,
        centre: centre.nom,
        dateDebut: formatDate(result.session.dateDebut),
        dateFin: formatDate(result.session.dateFin),
        lieu: result.session.formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
        prix: `${result.reservation.montant} €`,
        numero: result.reservation.numero,
        lienConvocation,
      };

      emailPromises.push(
        renderEmailTemplate("convocation", centre.id, convocationVars)
          .then(({ subject, html }) =>
            resend.emails.send({ from: FROM, to: data.email, subject, html })
          )
          .catch((err) => {
            console.error("[POST /api/reservations] Convocation email error:", err);
          })
      );

      await Promise.all(emailPromises);
    } catch (emailErr) {
      console.error("[POST /api/reservations] Email error:", emailErr);
      // Ne pas faire échouer la réservation pour un email
    }

    return NextResponse.json(result.reservation, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    if (err instanceof Error) {
      const msg: Record<string, string> = {
        SESSION_NOT_FOUND: "Session introuvable",
        SESSION_INACTIVE: "Cette session n'est plus disponible",
        SESSION_FULL: "Il n'y a plus de places disponibles",
        PAYMENT_NOT_SUCCEEDED: "Le paiement n'a pas été validé",
        PAYMENT_AMOUNT_MISMATCH: "Montant de paiement incorrect",
        "Non authentifié": "Vous devez être connecté pour réserver",
      };
      if (msg[err.message]) return NextResponse.json({ error: msg[err.message] }, { status: 400 });
    }
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
