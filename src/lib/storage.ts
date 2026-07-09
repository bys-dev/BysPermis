import { promises as fs } from "fs";
import path from "path";

/**
 * Stockage de fichiers — 3 backends, sélectionnés par ordre de priorité :
 *   1. Clever Cloud Cellar (S3) en prod, si `CELLAR_ADDON_KEY_ID` + bucket définis.
 *   2. Vercel Blob, si `BLOB_READ_WRITE_TOKEN` défini.
 *   3. Filesystem local sous public/uploads (dev / VM long-lived uniquement ;
 *      le FS serverless est en lecture seule / non persistant).
 */

// ─── Cellar (Clever Cloud, S3-compatible) ────────────────
const CELLAR_HOST = process.env.CELLAR_ADDON_HOST;
const CELLAR_KEY_ID = process.env.CELLAR_ADDON_KEY_ID;
const CELLAR_KEY_SECRET = process.env.CELLAR_ADDON_KEY_SECRET;
// Le bucket n'est pas auto-injecté par Clever Cloud : à créer + définir à la main.
const CELLAR_BUCKET =
  process.env.CELLAR_ADDON_BUCKET ?? process.env.CELLAR_BUCKET;

export const HAS_CELLAR = Boolean(
  CELLAR_HOST && CELLAR_KEY_ID && CELLAR_KEY_SECRET && CELLAR_BUCKET,
);
export const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Client S3 mémoïsé (import dynamique pour ne pas charger le SDK hors prod).
let cellarClientPromise: Promise<import("@aws-sdk/client-s3").S3Client> | null = null;
async function getCellarClient() {
  if (!cellarClientPromise) {
    cellarClientPromise = (async () => {
      const { S3Client } = await import("@aws-sdk/client-s3");
      return new S3Client({
        region: "us-east-1", // ignoré par Cellar mais requis par le SDK
        endpoint: `https://${CELLAR_HOST}`,
        credentials: {
          accessKeyId: CELLAR_KEY_ID!,
          secretAccessKey: CELLAR_KEY_SECRET!,
        },
        forcePathStyle: true,
      });
    })();
  }
  return cellarClientPromise;
}

function cellarPublicUrl(key: string): string {
  return `https://${CELLAR_HOST}/${CELLAR_BUCKET}/${key}`;
}

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
  storage: "cellar" | "blob" | "local";
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

  if (HAS_CELLAR) {
    const client = await getCellarClient();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new PutObjectCommand({
        Bucket: CELLAR_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      }),
    );
    return { url: cellarPublicUrl(key), storage: "cellar" };
  }

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

/** Supprime un fichier précédemment stocké (Cellar, Blob ou local). Best-effort. */
export async function deleteFile(url: string): Promise<void> {
  if (!url) return;
  try {
    // Objet Cellar : URL sous l'hôte Cellar → suppression S3.
    if (CELLAR_HOST && url.includes(CELLAR_HOST)) {
      if (!HAS_CELLAR) return;
      const prefix = cellarPublicUrl("");
      const key = url.startsWith(prefix) ? url.slice(prefix.length) : null;
      if (!key) return;
      const client = await getCellarClient();
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await client.send(
        new DeleteObjectCommand({ Bucket: CELLAR_BUCKET, Key: key }),
      );
      return;
    }
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
