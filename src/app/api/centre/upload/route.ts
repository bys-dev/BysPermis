import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { promises as fs } from "fs";
import path from "path";

/**
 * POST /api/centre/upload — upload a centre image asset (logo, signature, banner).
 *
 * Body: multipart/form-data
 *   - file: File (image/png | image/jpeg | image/svg+xml | image/webp), max 2 MB
 *   - kind: "logo" | "signature" | "bannerImage"
 *
 * Storage strategy:
 *   - If `BLOB_READ_WRITE_TOKEN` env var is set → Vercel Blob (recommended in prod).
 *   - Otherwise → local filesystem at `public/uploads/centres/{centreId}/`.
 *     Local FS only works in dev or on a long-lived VM — Vercel serverless is read-only.
 */
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};
const ALLOWED_KINDS = ["logo", "signature", "bannerImage"] as const;
type UploadKind = (typeof ALLOWED_KINDS)[number];

const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function uploadToBlob(
  centreId: string,
  filename: string,
  contentType: string,
  buffer: Buffer,
): Promise<string> {
  const { put } = await import("@vercel/blob");
  const blob = await put(`centres/${centreId}/${filename}`, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

async function uploadToLocalFs(
  centreId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const dirAbs = path.join(process.cwd(), "public", "uploads", "centres", centreId);
  await fs.mkdir(dirAbs, { recursive: true });
  await fs.writeFile(path.join(dirAbs, filename), buffer);
  return `/uploads/centres/${centreId}/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Aucun centre" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    const kindRaw = formData.get("kind");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (typeof kindRaw !== "string" || !(ALLOWED_KINDS as readonly string[]).includes(kindRaw)) {
      return NextResponse.json({ error: "kind invalide (logo|signature|bannerImage)" }, { status: 400 });
    }
    const kind = kindRaw as UploadKind;

    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Type d'image non supporté" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 2 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const filename = `${kind}-${timestamp}.${ext}`;

    const url = HAS_BLOB
      ? await uploadToBlob(centreId, filename, file.type, buffer)
      : await uploadToLocalFs(centreId, filename, buffer);

    const fieldMap: Record<UploadKind, "logo" | "signatureUrl" | "bannerImage"> = {
      logo: "logo",
      signature: "signatureUrl",
      bannerImage: "bannerImage",
    };
    await prisma.centre.update({
      where: { id: centreId },
      data: { [fieldMap[kind]]: url },
    });

    return NextResponse.json({ url, kind, storage: HAS_BLOB ? "blob" : "local" });
  } catch (err) {
    if (err instanceof Error && err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "Non autorisé") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    console.error("[POST /api/centre/upload]", err);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
