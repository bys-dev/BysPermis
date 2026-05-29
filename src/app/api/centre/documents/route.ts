import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, mapAuthError } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { uploadFile, extForMime, DOCUMENT_MAX_BYTES } from "@/lib/storage";
import { sendDocumentEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
const KINDS = ["EMARGEMENT", "BON_ACCORD", "REGLEMENT", "AUTRE"] as const;

// Vérifie que la réservation appartient bien au centre du staff connecté
async function loadOwnedReservation(reservationId: string, centreId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, session: { formation: { centreId } } },
    select: { id: true, email: true, prenom: true, nom: true, numero: true },
  });
  return reservation;
}

// GET /api/centre/documents?reservationId=... — documents (2 sens) côté centre
export async function GET(req: NextRequest) {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const reservationId = req.nextUrl.searchParams.get("reservationId");
    if (!reservationId) return NextResponse.json({ error: "reservationId requis" }, { status: 400 });

    const reservation = await loadOwnedReservation(reservationId, centreId);
    if (!reservation) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    const documents = await prisma.document.findMany({
      where: { reservationId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[GET /api/centre/documents]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/centre/documents — envoi manuel d'un document à l'élève (fichier OU modèle)
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreStaff();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const formData = await req.formData();
    const reservationId = String(formData.get("reservationId") ?? "");
    const templateId = formData.get("templateId");
    const file = formData.get("file");
    const kindRaw = String(formData.get("kind") ?? "AUTRE");
    const nomRaw = formData.get("nom");
    const contenuRaw = formData.get("contenu");
    const requiresAck = formData.get("requiresAck") === "true";

    if (!reservationId) return NextResponse.json({ error: "reservationId requis" }, { status: 400 });
    const reservation = await loadOwnedReservation(reservationId, centreId);
    if (!reservation) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    let kind = (KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "AUTRE";
    let nom = typeof nomRaw === "string" && nomRaw.trim() ? nomRaw.trim() : "Document";
    let contenu: string | null = typeof contenuRaw === "string" && contenuRaw.trim() ? contenuRaw.trim() : null;
    let blobUrl: string | null = null;
    let mimeType: string | null = null;
    let taille: number | null = null;
    let ack = requiresAck;
    let uploadedBuffer: Buffer | null = null;
    let uploadedFilename = "";

    // Depuis un modèle
    if (typeof templateId === "string" && templateId) {
      const template = await prisma.centreDocumentTemplate.findFirst({ where: { id: templateId, centreId } });
      if (!template) return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
      kind = template.kind;
      nom = template.nom;
      contenu = template.contenu;
      blobUrl = template.blobUrl;
      ack = template.requiresAck;
    } else if (file instanceof File) {
      const ext = extForMime(file.type);
      if (!ext) return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WEBP ou PDF)" }, { status: 400 });
      if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: "Fichier trop volumineux (max 8 MB)" }, { status: 400 });
      uploadedBuffer = Buffer.from(await file.arrayBuffer());
      uploadedFilename = `${kind.toLowerCase()}-${Date.now()}.${ext}`;
      const { url } = await uploadFile({
        pathPrefix: `reservations/${reservationId}/centre`,
        filename: uploadedFilename,
        contentType: file.type,
        buffer: uploadedBuffer,
      });
      blobUrl = url;
      mimeType = file.type;
      taille = file.size;
    } else if (!contenu) {
      return NextResponse.json({ error: "Fournissez un fichier, un texte ou un modèle" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        kind: kind as (typeof KINDS)[number],
        direction: "CENTRE_VERS_ELEVE",
        nom,
        contenu,
        blobUrl,
        mimeType,
        taille,
        requiresAck: ack,
        status: "ENVOYE",
        reservationId,
        centreId,
        uploadedById: user.id,
        templateId: typeof templateId === "string" && templateId ? templateId : undefined,
      },
    });

    // Email élève (PJ si on a le buffer, sinon lien vers l'espace)
    await sendDocumentEmail({
      to: reservation.email,
      prenom: reservation.prenom,
      sujet: ack ? `Document à valider — ${nom}` : `Nouveau document — ${nom}`,
      intro: ack
        ? `Votre centre vous a transmis un document à lire et accepter : « ${nom} ». Rendez-vous dans votre espace élève pour le valider.`
        : `Votre centre vous a transmis un document : « ${nom} ».`,
      ctaUrl: `${APP_URL}/espace-eleve/documents`,
      ctaLabel: "Voir mes documents",
      ...(uploadedBuffer ? { attachments: [{ filename: uploadedFilename, content: uploadedBuffer }] } : {}),
    });

    await prisma.notification.create({
      data: {
        userId: (await prisma.reservation.findUnique({ where: { id: reservationId }, select: { userId: true } }))!.userId,
        titre: ack ? "Document à valider" : "Nouveau document reçu",
        contenu: `Votre centre vous a envoyé : ${nom}.`,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[POST /api/centre/documents]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
