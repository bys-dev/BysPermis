import { promises as fs } from "fs";
import path from "path";

/**
 * Stockage de fichiers — Vercel Blob en prod (si BLOB_READ_WRITE_TOKEN défini),
 * sinon filesystem local sous public/uploads (dev / VM long-lived uniquement ;
 * le FS de Vercel serverless est en lecture seule).
 */

export const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Types autorisés pour les documents (élève + centre). Images + PDF.
export const DOCUMENT_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
export const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export interface UploadedFile {
  url: string;
  storage: "blob" | "local";
}

/**
 * Stocke un buffer et retourne son URL publique.
 * @param pathPrefix dossier logique (ex "reservations/<id>/eleve")
 * @param filename nom de fichier (déjà assaini / horodaté par l'appelant)
 */
export async function uploadFile(opts: {
  pathPrefix: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
}): Promise<UploadedFile> {
  const { pathPrefix, filename, contentType, buffer } = opts;
  const key = `${pathPrefix}/${filename}`.replace(/\/+/g, "/").replace(/^\//, "");

  if (HAS_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, storage: "blob" };
  }

  const dirAbs = path.join(process.cwd(), "public", "uploads", ...pathPrefix.split("/"));
  await fs.mkdir(dirAbs, { recursive: true });
  await fs.writeFile(path.join(dirAbs, filename), buffer);
  return { url: `/uploads/${key}`, storage: "local" };
}

/** Supprime un fichier précédemment stocké (Blob ou local). Best-effort. */
export async function deleteFile(url: string): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("http")) {
      if (!HAS_BLOB) return;
      const { del } = await import("@vercel/blob");
      await del(url);
      return;
    }
    // URL locale "/uploads/..."
    if (url.startsWith("/uploads/")) {
      const rel = url.replace(/^\//, "");
      const abs = path.join(process.cwd(), "public", ...rel.split("/"));
      await fs.unlink(abs).catch(() => undefined);
    }
  } catch (err) {
    console.error("[storage.deleteFile]", err);
  }
}

/** Extension à partir d'un MIME autorisé, ou null si non supporté. */
export function extForMime(mime: string): string | null {
  return DOCUMENT_MIME[mime] ?? null;
}
