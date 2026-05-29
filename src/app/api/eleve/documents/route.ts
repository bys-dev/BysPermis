import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { uploadFile, extForMime, DOCUMENT_MAX_BYTES } from "@/lib/storage";

const ELEVE_KINDS = ["PERMIS", "PIECE_IDENTITE", "LETTRE_48N", "AUTRE"] as const;
type EleveKind = (typeof ELEVE_KINDS)[number];

const KIND_LABEL: Record<EleveKind, string> = {
  PERMIS: "Permis de conduire",
  PIECE_IDENTITE: "Pièce d'identité",
  LETTRE_48N: "Lettre 48N",
  AUTRE: "Document",
};

// GET /api/eleve/documents?reservationId=... — documents (2 sens) d'une réservation
export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const reservationId = req.nextUrl.searchParams.get("reservationId");
  if (!reservationId) return NextResponse.json({ error: "reservationId requis" }, { status: 400 });

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  if (reservation.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const documents = await prisma.document.findMany({
    where: { reservationId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents);
}

// POST /api/eleve/documents — upload d'un document par l'élève (multipart)
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const reservationId = formData.get("reservationId");
    const kindRaw = formData.get("kind");

    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    if (typeof reservationId !== "string") return NextResponse.json({ error: "reservationId requis" }, { status: 400 });
    if (typeof kindRaw !== "string" || !(ELEVE_KINDS as readonly string[]).includes(kindRaw)) {
      return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
    }
    const kind = kindRaw as EleveKind;

    const ext = extForMime(file.type);
    if (!ext) return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WEBP ou PDF)" }, { status: 400 });
    if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: "Fichier trop volumineux (max 8 MB)" }, { status: 400 });

    // Ownership
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { session: { include: { formation: { include: { centre: true } } } } },
    });
    if (!reservation) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    if (reservation.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const centre = reservation.session.formation.centre;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${kind.toLowerCase()}-${Date.now()}.${ext}`;
    const { url } = await uploadFile({
      pathPrefix: `reservations/${reservationId}/eleve`,
      filename,
      contentType: file.type,
      buffer,
    });

    const document = await prisma.document.create({
      data: {
        kind,
        direction: "ELEVE_VERS_CENTRE",
        nom: KIND_LABEL[kind],
        blobUrl: url,
        mimeType: file.type,
        taille: file.size,
        status: "ENVOYE",
        reservationId,
        centreId: centre.id,
        uploadedById: user.id,
      },
    });

    // Notifier le centre
    await prisma.notification.create({
      data: {
        userId: centre.userId,
        titre: "Nouveau document élève",
        contenu: `${reservation.prenom} ${reservation.nom} a transmis : ${KIND_LABEL[kind]} (réservation ${reservation.numero}).`,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    console.error("[POST /api/eleve/documents]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
