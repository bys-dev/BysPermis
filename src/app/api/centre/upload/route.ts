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
 * Persists to `public/uploads/centres/{centreId}/{kind}-{timestamp}.{ext}` and
 * updates the matching Centre column with the public URL.
 *
 * NOTE — STORAGE BACKEND
 * On Vercel (or any other serverless prod host) the filesystem is read-only,
 * so this local-disk strategy only works in dev or on a long-lived VM.
 *
 * TODO (prod) — replace by Vercel Blob or S3:
 *   import { put } from "@vercel/blob";
 *   const blob = await put(`centres/${centreId}/${filename}`, buffer, { access: "public" });
 *   url = blob.url;
 * Then drop the fs.mkdir / fs.writeFile block below.
 */
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};
const ALLOWED_KINDS = ["logo", "signature", "bannerImage"] as const;
type UploadKind = (typeof ALLOWED_KINDS)[number];

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
    const dirAbs = path.join(process.cwd(), "public", "uploads", "centres", centreId);
    await fs.mkdir(dirAbs, { recursive: true });
    await fs.writeFile(path.join(dirAbs, filename), buffer);

    const url = `/uploads/centres/${centreId}/${filename}`;

    // Map kind to centre column
    const fieldMap: Record<UploadKind, "logo" | "signatureUrl" | "bannerImage"> = {
      logo: "logo",
      signature: "signatureUrl",
      bannerImage: "bannerImage",
    };
    await prisma.centre.update({
      where: { id: centreId },
      data: { [fieldMap[kind]]: url },
    });

    return NextResponse.json({ url, kind });
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
