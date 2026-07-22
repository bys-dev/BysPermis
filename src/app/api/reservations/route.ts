import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";
import { calculateCommission, getCommissionRate } from "@/lib/utils";
import { fulfillReservation } from "@/lib/reservation-fulfillment";

// ─── GET /api/reservations — mes réservations ─────────────
export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
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
  } catch (err) {
    console.error("[GET /api/reservations] DB error:", err);
    // En cas d'erreur DB (migration manquante, schema mismatch, etc.),
    // renvoyer une liste vide plutôt qu'un 500 — la page rendra "aucune réservation".
    return NextResponse.json([]);
  }
}

// ─── POST /api/reservations ─────────────────────────────────────────
// Finalise une réservation déjà créée en EN_ATTENTE_PAIEMENT par
// /api/stripe/create-payment-intent (anti race-condition).
//
// Si sessionId est fourni sans stripePaymentIntentId (legacy flow),
// 400 — utiliser /api/stripe/create-payment-intent en amont.
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
  casStage: z.number().int().min(1).max(4).optional(),
  attestationPasStage12Mois: z.boolean().optional(),
  attestationPermisValide: z.boolean().optional(),
  stripePaymentIntentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createSchema.parse(body);

    // 1. Trouver la réservation existante (placeholder créé par create-payment-intent)
    const placeholder = await prisma.reservation.findFirst({
      where: {
        stripePaymentId: data.stripePaymentIntentId,
        userId: user.id,
      },
      include: { session: { include: { formation: { include: { centre: true } } } } },
    });

    if (!placeholder) {
      return NextResponse.json(
        { error: "Réservation introuvable. Veuillez recommencer le processus de paiement." },
        { status: 404 }
      );
    }

    // Si déjà confirmée → idempotent : retourner la résa actuelle
    if (placeholder.status === "CONFIRMEE") {
      return NextResponse.json(placeholder, { status: 200 });
    }

    if (placeholder.status !== "EN_ATTENTE_PAIEMENT") {
      return NextResponse.json(
        { error: `Réservation dans un état invalide: ${placeholder.status}` },
        { status: 400 }
      );
    }

    // 2. Vérifier le paiement Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(data.stripePaymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Le paiement n'a pas été validé" }, { status: 400 });
    }
    if (paymentIntent.amount !== Math.round(placeholder.montant * 100)) {
      return NextResponse.json({ error: "Montant de paiement incorrect" }, { status: 400 });
    }

    // 3. Calculer la commission (au cas où elle n'aurait pas été calculée)
    const placeholderCentre = placeholder.session.formation.centre;
    const commissionFraction = getCommissionRate(placeholderCentre);
    if (placeholderCentre.commissionRateOverride !== null && placeholderCentre.commissionRateOverride !== undefined) {
      console.info(`[reservations.POST] centre ${placeholderCentre.id} override rate=${placeholderCentre.commissionRateOverride}`);
    }
    const { commission } = calculateCommission(placeholder.montant, commissionFraction * 100);

    // 4. Update transaction
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.update({
        where: { id: placeholder.id },
        data: {
          status: "CONFIRMEE",
          commissionMontant: commission,
          civilite: data.civilite,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          codePostal: data.codePostal,
          ville: data.ville,
          numeroPermis: data.numeroPermis,
          casStage: data.casStage,
          attestationPasStage12Mois: data.attestationPasStage12Mois ?? false,
          attestationPermisValide: data.attestationPermisValide ?? false,
          attestationLe:
            data.attestationPasStage12Mois && data.attestationPermisValide ? new Date() : null,
        },
        include: { session: { include: { formation: { include: { centre: true } } } } },
      });

      // 5. Notification élève
      await tx.notification.create({
        data: {
          userId: user.id,
          titre: "Réservation confirmée",
          contenu: `Votre réservation ${reservation.numero} pour le stage "${reservation.session.formation.titre}" est confirmée.`,
        },
      });

      // 6. CentrePayment (commission)
      const centre = reservation.session.formation.centre;
      const stripeConnectUsed = !!centre.stripeOnboardingDone && !!centre.stripeAccountId;
      // Eviter doublons sur retries
      const existingCentrePayment = await tx.centrePayment.findFirst({
        where: { stripeId: data.stripePaymentIntentId, type: "COMMISSION" },
      });
      if (!existingCentrePayment) {
        await tx.centrePayment.create({
          data: {
            centreId: centre.id,
            type: "COMMISSION",
            montant: commission,
            description: `Commission réservation #${reservation.numero} — ${reservation.session.formation.titre}`,
            stripeId: data.stripePaymentIntentId,
            status: stripeConnectUsed ? "PAYE" : "EN_ATTENTE",
            periode: new Date().toISOString().slice(0, 7),
          },
        });
      }

      // 7. Facture (idempotent : seulement si pas déjà existante)
      const existingInvoice = await tx.invoice.findFirst({ where: { reservationId: reservation.id } });
      if (!existingInvoice) {
        const year = new Date().getFullYear();
        // Numérotation par année civile — même règle que lib/pdf-helpers.ts, qui
        // crée la facture quand elle n'existe pas encore au moment du rendu PDF.
        const invoiceCount = await tx.invoice.count({
          where: { createdAt: { gte: new Date(`${year}-01-01`) } },
        });
        const invoiceNum = `FAC-${year}-${String(invoiceCount + 1).padStart(4, "0")}`;
        // TVA 0% : les stages de récupération de points relèvent de la formation
        // professionnelle continue exonérée (art. 261-4-4° CGI). Ce chemin
        // appliquait 20% alors que le rendu PDF documentait 0% : les deux factures
        // possibles pour une même réservation ne concordaient pas.
        await tx.invoice.create({
          data: {
            numero: invoiceNum,
            type: "ELEVE",
            montantHT: reservation.montant,
            tva: 0,
            montantTTC: reservation.montant,
            status: "PAYEE",
            userId: user.id,
            centreId: centre.id,
            reservationId: reservation.id,
          },
        });
      }

      // 8. Loyalty points — seulement si pas déjà attribués
      const existingLoyalty = await tx.loyaltyPoints.findFirst({
        where: { userId: user.id, description: `Réservation #${reservation.numero}` },
      });
      if (!existingLoyalty) {
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

        // 9. Referral reward
        if (currentUser.referredBy) {
          const previousReservations = await tx.reservation.count({
            where: { userId: user.id, id: { not: reservation.id }, status: "CONFIRMEE" },
          });
          if (previousReservations === 0) {
            const referrer = await tx.user.findFirst({
              where: { referralCode: currentUser.referredBy },
            });
            if (referrer) {
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
      }

      return { reservation };
    });

    // 7. Archivage des PDF + envoi des emails (hors transaction).
    //    Mutualisé avec le webhook Stripe, qui rejoue ce même pipeline en filet
    //    de sécurité si cette route échoue après encaissement. Idempotent.
    await fulfillReservation(result.reservation.id, { source: "api/reservations" });

    return NextResponse.json(result.reservation, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    if (err instanceof Error && err.message === "Non authentifié") {
      return NextResponse.json({ error: "Vous devez être connecté pour réserver" }, { status: 401 });
    }
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
