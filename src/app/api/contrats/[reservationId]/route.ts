import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Contrat } from "@/components/pdf/Contrat";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const user = await requireAuth();

    // Chercher par ID ou par numero de reservation
    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          { id: reservationId },
          { numero: reservationId },
        ],
      },
      include: {
        session: {
          include: {
            formation: {
              include: { centre: true },
            },
          },
        },
        user: true,
        invoice: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });
    }

    // Verification : l'utilisateur doit etre le proprietaire ou un admin/owner
    if (reservation.userId !== user.id && user.role !== "ADMIN" && user.role !== "OWNER") {
      // Check if user is centre staff for this formation's centre
      const isCentreStaff =
        user.role === "CENTRE_OWNER" || user.role === "CENTRE_ADMIN";
      if (isCentreStaff) {
        const centre = reservation.session.formation.centre;
        const isOwner = centre.userId === user.id;
        const isMember = await prisma.centreMembre.findUnique({
          where: { userId_centreId: { userId: user.id, centreId: centre.id } },
        });
        if (!isOwner && !isMember) {
          return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
      }
    }

    // Seules les reservations CONFIRMEE ou TERMINEE peuvent generer un contrat
    if (reservation.status !== "CONFIRMEE" && reservation.status !== "TERMINEE") {
      return NextResponse.json(
        { error: "Le contrat n'est disponible que pour les reservations confirmees ou terminees" },
        { status: 400 }
      );
    }

    const { session } = reservation;
    const { formation } = session;
    const centre = formation.centre;

    const year = new Date().getFullYear();
    const numeroContrat = `BYS-CTR-${year}-${reservation.numero}`;

    const data = {
      numeroContrat,
      dateEmission: formatDate(reservation.createdAt),
      organisme: {
        nom: centre.nom,
        siret: "908 058 092 00028",
        adresse: centre.adresse,
        codePostal: centre.codePostal,
        ville: centre.ville,
        email: centre.email ?? undefined,
        telephone: centre.telephone ?? undefined,
      },
      stagiaire: {
        civilite: reservation.civilite ?? undefined,
        prenom: reservation.prenom,
        nom: reservation.nom,
        adresse: reservation.adresse ?? undefined,
        codePostal: reservation.codePostal ?? undefined,
        ville: reservation.ville ?? undefined,
        email: reservation.email,
        telephone: reservation.telephone,
      },
      formation: {
        titre: formation.titre,
        objectifs: formation.objectifs ?? undefined,
        programme: formation.programme ?? undefined,
        duree: formation.duree,
        modalite: formation.modalite,
        lieu: formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
      },
      session: {
        dateDebut: formatDate(session.dateDebut),
        dateFin: formatDate(session.dateFin),
      },
      conditions: {
        prixTTC: reservation.montant,
        tvaNote: "TVA non applicable (art. 261.4.4\u00B0 du CGI)",
        modeReglement: "Carte bancaire via Stripe",
        datePaiement: formatDate(reservation.createdAt),
        refTransaction: reservation.stripePaymentId ?? undefined,
      },
    };

    const pdfBuffer = await renderToBuffer(
      createElement(Contrat, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contrat-${reservation.numero}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/contrats]", err);
    return NextResponse.json({ error: "Erreur generation PDF" }, { status: 500 });
  }
}
