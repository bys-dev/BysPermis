import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement, mapAuthError } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { uploadFile, extForMime, DOCUMENT_MAX_BYTES } from "@/lib/storage";

const KINDS = ["BON_ACCORD", "REGLEMENT", "AUTRE"] as const;

// GET /api/centre/document-templates — liste des modèles du centre
export async function GET() {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const templates = await prisma.centreDocumentTemplate.findMany({
      where: { centreId },
      orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(templates);
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[GET /api/centre/document-templates]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/centre/document-templates — créer un modèle (fichier OU texte)
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const formData = await req.formData();
    const nom = String(formData.get("nom") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const kindRaw = String(formData.get("kind") ?? "AUTRE");
    const contenu = String(formData.get("contenu") ?? "").trim() || null;
    const requiresAck = formData.get("requiresAck") === "true";
    const autoSend = formData.get("autoSend") !== "false";
    const ordre = Number(formData.get("ordre") ?? 0) || 0;
    const file = formData.get("file");

    if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const kind = (KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "AUTRE";

    let blobUrl: string | null = null;
    if (file instanceof File && file.size > 0) {
      const ext = extForMime(file.type);
      if (!ext) return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WEBP ou PDF)" }, { status: 400 });
      if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: "Fichier trop volumineux (max 8 MB)" }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await uploadFile({
        pathPrefix: `templates/${centreId}`,
        filename: `${Date.now()}.${ext}`,
        contentType: file.type,
        buffer,
      });
      blobUrl = url;
    }

    if (!blobUrl && !contenu) {
      return NextResponse.json({ error: "Fournissez un fichier ou un texte" }, { status: 400 });
    }

    const template = await prisma.centreDocumentTemplate.create({
      data: { nom, description, kind: kind as (typeof KINDS)[number], contenu, blobUrl, requiresAck, autoSend, ordre, centreId },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[POST /api/centre/document-templates]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
