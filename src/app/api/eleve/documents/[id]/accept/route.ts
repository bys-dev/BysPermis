import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { uploadFile } from "@/lib/storage";
import { renderBonAccordPdf } from "@/lib/pdf-helpers";
import { sendDocumentEmail } from "@/lib/email";
import { notifyCentreBonAccordAccepted } from "@/lib/event-notifications";
import { z } from "zod";

const schema = z.object({ nom: z.string().min(2, "Nom requis") });

// POST /api/eleve/documents/[id]/accept — bon d'accord : "Lu et accepté" (valeur probante)
export async function POST(
  req: NextRequest,
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
    const body = await req.json();
    const { nom } = schema.parse(body);

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        reservation: {
          select: {
            userId: true,
            email: true,
            prenom: true,
            nom: true,
            numero: true,
          },
        },
      },
    });
    if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    if (document.reservation.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (!document.requiresAck) return NextResponse.json({ error: "Ce document ne nécessite pas d'acceptation" }, { status: 400 });

    // Idempotent : déjà accepté → renvoyer tel quel
    if (document.status === "ACCEPTE") return NextResponse.json(document, { status: 200 });

    // Capture IP (Vercel : x-forwarded-for, 1er hop)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "inconnue";

    const updated = await prisma.document.update({
      where: { id },
      data: { status: "ACCEPTE", acceptedAt: new Date(), acceptedNom: nom, acceptedIp: ip },
    });

    // Génère le PDF probant et le persiste (immuable — fait foi)
    try {
      const pdf = await renderBonAccordPdf(updated.id);
      const { url } = await uploadFile({
        pathPrefix: `reservations/${updated.reservationId}/bon-accord`,
        filename: `${updated.id}.pdf`,
        contentType: "application/pdf",
        buffer: pdf.buffer,
      });
      await prisma.document.update({ where: { id: updated.id }, data: { blobUrl: url, mimeType: "application/pdf" } });

      await sendDocumentEmail({
        to: document.reservation.email,
        prenom: document.reservation.prenom,
        sujet: `Bon d'accord accepté — ${document.nom}`,
        intro: `Vous avez accepté le document « ${document.nom} » le ${updated.acceptedAt?.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}. Une copie PDF faisant foi est jointe à ce message.`,
        attachments: [{ filename: pdf.filename, content: pdf.buffer }],
      });
    } catch (pdfErr) {
      console.error("[accept] PDF/email error:", pdfErr);
    }

    if (document.centreId) {
      await notifyCentreBonAccordAccepted({
        centreId: document.centreId,
        eleveName: nom,
        documentName: document.nom,
        reservationNumber: document.reservation.numero,
      }).catch((err) => console.error("[accept] notify centre:", err));
    }

    const fresh = await prisma.document.findUnique({ where: { id: updated.id } });
    return NextResponse.json(fresh);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    console.error("[POST /api/eleve/documents/[id]/accept]", err);
    return NextResponse.json({ error: "Erreur lors de l'acceptation" }, { status: 500 });
  }
}
