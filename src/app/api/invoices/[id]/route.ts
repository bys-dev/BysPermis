import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Facture } from "@/components/pdf/Facture";
import { createElement, JSXElementConstructor, ReactElement } from "react";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        reservation: {
          include: {
            session: {
              include: {
                formation: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }

    // Vérification : l'utilisateur doit être le propriétaire ou un admin
    const isAdmin = user.role === "ADMIN" || user.role === "OWNER";
    if (invoice.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Build client info from user or reservation
    const clientNom = invoice.user?.nom ?? invoice.reservation?.nom ?? "—";
    const clientPrenom = invoice.user?.prenom ?? invoice.reservation?.prenom ?? "";
    const clientEmail = invoice.user?.email ?? invoice.reservation?.email ?? "";
    const clientAdresse = invoice.user?.adresse ?? invoice.reservation?.adresse ?? undefined;
    const clientCodePostal = invoice.user?.codePostal ?? invoice.reservation?.codePostal ?? undefined;
    const clientVille = invoice.user?.ville ?? invoice.reservation?.ville ?? undefined;

    // Build line items
    const formationTitre = invoice.reservation?.session?.formation?.titre ?? "Prestation de formation";
    const lignes = [
      {
        description: formationTitre,
        quantite: 1,
        prixUnitaire: invoice.montantHT,
        total: invoice.montantHT,
      },
    ];

    // Status mapping
    const statusLabel: Record<string, string> = {
      PAYEE: "Payé",
      EN_ATTENTE: "En attente",
      ANNULEE: "Annulée",
    };

    const data = {
      numero: invoice.numero,
      dateEmission: formatDate(invoice.createdAt),
      dateEcheance: formatDate(invoice.createdAt), // Paiement immédiat
      client: {
        nom: clientNom,
        prenom: clientPrenom,
        email: clientEmail,
        adresse: clientAdresse ?? undefined,
        codePostal: clientCodePostal ?? undefined,
        ville: clientVille ?? undefined,
      },
      lignes,
      montantHT: invoice.montantHT,
      tva: invoice.tva,
      montantTTC: invoice.montantTTC,
      paiement: {
        reference: invoice.reservation?.stripePaymentId ?? undefined,
        status: statusLabel[invoice.status] ?? invoice.status,
        methode: "Carte bancaire (Stripe)",
      },
    };

    const pdfBuffer = await renderToBuffer(
      createElement(Facture, { data }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoice.numero}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/invoices/[id]]", err);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}
