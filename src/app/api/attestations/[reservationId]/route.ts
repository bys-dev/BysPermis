import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Attestation } from "@/components/pdf/Attestation";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const user = await requireAuth();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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

    if (!reservation) {
      return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });
    }

    // Verification : l'utilisateur doit etre le proprietaire ou un admin
    if (reservation.userId !== user.id && user.role !== "ADMIN" && user.role !== "OWNER") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    // Seules les reservations TERMINEE peuvent generer une attestation
    if (reservation.status !== "TERMINEE") {
      return NextResponse.json(
        { error: "L'attestation n'est disponible que pour les formations terminées" },
        { status: 400 }
      );
    }

    const { session } = reservation;
    const { formation } = session;
    const centre = formation.centre;

    const numeroAttestation = `ATT-${new Date().getFullYear()}-${reservation.numero}`;

    const data = {
      numeroAttestation,
      dateDelivrance: formatDate(new Date()),
      stagiaire: {
        civilite: reservation.civilite ?? undefined,
        prenom: reservation.prenom,
        nom: reservation.nom,
        adresse: reservation.adresse ?? undefined,
        codePostal: reservation.codePostal ?? undefined,
        ville: reservation.ville ?? undefined,
      },
      formation: {
        titre: formation.titre,
        duree: formation.duree,
        objectifs: formation.objectifs ?? undefined,
        modalite: formation.modalite,
      },
      session: {
        dateDebut: formatDate(session.dateDebut),
        dateFin: formatDate(session.dateFin),
        lieu: formation.lieu ?? `${centre.adresse}, ${centre.codePostal} ${centre.ville}`,
      },
      centre: {
        nom: centre.nom,
        adresse: centre.adresse,
        codePostal: centre.codePostal,
        ville: centre.ville,
        telephone: centre.telephone ?? undefined,
        email: centre.email ?? undefined,
      },
      verificationUrl: `https://byspermis.fr/verification/${numeroAttestation}`,
    };

    const pdfBuffer = await renderToBuffer(
      createElement(Attestation, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attestation-${reservation.numero}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/attestations]", err);
    return NextResponse.json({ error: "Erreur generation PDF" }, { status: 500 });
  }
}
