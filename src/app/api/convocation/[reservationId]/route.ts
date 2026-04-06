import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Convocation } from "@/components/pdf/Convocation";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const user = await requireAuth();

    // Chercher par ID ou par numéro de réservation
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
      },
    });

    if (!reservation) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    // Vérification : l'utilisateur doit être le propriétaire ou un admin
    if (reservation.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { session } = reservation;
    const { formation } = session;
    const centre = formation.centre;

    const data = {
      reservationNumero: reservation.numero,
      dateEmission: formatDate(reservation.createdAt),
      montant: reservation.montant,
      stagiaire: {
        civilite: reservation.civilite ?? "M.",
        prenom: reservation.prenom,
        nom: reservation.nom,
        adresse: reservation.adresse ?? undefined,
        codePostal: reservation.codePostal ?? undefined,
        ville: reservation.ville ?? undefined,
        numeroPermis: reservation.numeroPermis ?? undefined,
      },
      formation: {
        titre: formation.titre,
        type: formation.titre,
        duree: formation.duree,
        isQualiopi: formation.isQualiopi,
      },
      session: {
        dateDebut: formatDate(session.dateDebut),
        dateFin: formatDate(session.dateFin),
        horaires: "9h00 – 17h30",
      },
      centre: {
        nom: centre.nom,
        adresse: centre.adresse,
        codePostal: centre.codePostal,
        ville: centre.ville,
        telephone: centre.telephone ?? undefined,
        email: centre.email ?? undefined,
      },
    };

    const pdfBuffer = await renderToBuffer(
      createElement(Convocation, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="convocation-${reservation.numero}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/convocation]", err);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}
