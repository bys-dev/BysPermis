import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement, mapAuthError } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { uploadFile, deleteFile, extForMime, DOCUMENT_MAX_BYTES } from "@/lib/storage";

const KINDS = ["BON_ACCORD", "REGLEMENT", "AUTRE"] as const;

async function ownTemplate(id: string, centreId: string) {
  return prisma.centreDocumentTemplate.findFirst({ where: { id, centreId } });
}

// PATCH /api/centre/document-templates/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const { id } = await params;
    const existing = await ownTemplate(id, centreId);
    if (!existing) return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });

    const formData = await req.formData();
    const data: Record<string, unknown> = {};
    const nom = formData.get("nom");
    if (typeof nom === "string" && nom.trim()) data.nom = nom.trim();
    const description = formData.get("description");
    if (description !== null) data.description = String(description).trim() || null;
    const contenu = formData.get("contenu");
    if (contenu !== null) data.contenu = String(contenu).trim() || null;
    const kindRaw = formData.get("kind");
    if (typeof kindRaw === "string" && (KINDS as readonly string[]).includes(kindRaw)) data.kind = kindRaw;
    if (formData.get("requiresAck") !== null) data.requiresAck = formData.get("requiresAck") === "true";
    if (formData.get("autoSend") !== null) data.autoSend = formData.get("autoSend") === "true";
    if (formData.get("actif") !== null) data.actif = formData.get("actif") === "true";
    if (formData.get("ordre") !== null) data.ordre = Number(formData.get("ordre")) || 0;

    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const ext = extForMime(file.type);
      if (!ext) return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
      if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: "Fichier trop volumineux (max 8 MB)" }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await uploadFile({
        pathPrefix: `templates/${centreId}`,
        filename: `${Date.now()}.${ext}`,
        contentType: file.type,
        buffer,
      });
      if (existing.blobUrl) await deleteFile(existing.blobUrl);
      data.blobUrl = url;
    }

    const updated = await prisma.centreDocumentTemplate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[PATCH /api/centre/document-templates/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/centre/document-templates/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const { id } = await params;
    const existing = await ownTemplate(id, centreId);
    if (!existing) return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });

    if (existing.blobUrl) await deleteFile(existing.blobUrl);
    await prisma.centreDocumentTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[DELETE /api/centre/document-templates/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
