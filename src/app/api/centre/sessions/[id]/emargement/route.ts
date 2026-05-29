import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, mapAuthError } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Emargement } from "@/components/pdf/Emargement";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { formatDate } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

function logoUrl(logo: string | null): string {
  if (!logo) return `${APP_URL}/colored-logo.png`;
  return logo.startsWith("http") ? logo : `${APP_URL}${logo}`;
}

// GET /api/centre/sessions/[id]/emargement — feuille d'émargement PDF
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // Vérifie que la session appartient bien à ce centre
    const session = await prisma.session.findFirst({
      where: { id, formation: { centreId } },
      include: {
        formation: { include: { centre: true } },
        reservations: {
          where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
          orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    const centre = session.formation.centre;
    const stagiaires = session.reservations.map((r) => ({
      civilite: r.civilite ?? undefined,
      nom: r.nom,
      prenom: r.prenom,
      numeroPermis: r.numeroPermis ?? undefined,
    }));

    // Complète jusqu'à la capacité de la session (lignes vierges pour ajouts manuels)
    const lignesVierges = Math.max(2, session.placesTotal - stagiaires.length);

    const data = {
      formationTitre: session.formation.titre,
      jour1: formatDate(session.dateDebut),
      jour2: formatDate(session.dateFin),
      horaires: "9h00 – 12h30 / 13h30 – 17h00",
      centre: {
        nom: centre.nom,
        raisonSociale: centre.raisonSociale ?? undefined,
        adresse: centre.adresse,
        codePostal: centre.codePostal,
        ville: centre.ville,
        numAgrement: centre.agrementNumber ?? undefined,
        logoUrl: logoUrl(centre.logo),
      },
      stagiaires,
      lignesVierges,
    };

    const pdfBuffer = await renderToBuffer(
      createElement(Emargement, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    );

    const dateStr = session.dateDebut.toISOString().slice(0, 10);
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="emargement-${dateStr}.pdf"`,
      },
    });
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[GET /api/centre/sessions/[id]/emargement]", err);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}
