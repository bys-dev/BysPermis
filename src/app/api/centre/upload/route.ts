import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { uploadFile, DOCUMENT_MAX_BYTES } from "@/lib/storage";

/**
 * POST /api/centre/upload — upload a centre image asset (logo, signature, banner).
 *
 * Body: multipart/form-data
 *   - file: File (png | jpeg | webp | avif | gif | svg), max 8 MB
 *   - kind: "logo" | "signature" | "bannerImage" | "photo"
 */
// Aligne sur les autres routes d'upload (8 MB) : une photo de telephone
// depasse regulierement 2 MB, ce qui faisait echouer l'envoi.
const MAX_BYTES = DOCUMENT_MAX_BYTES;
const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
// Formats photo d'iPhone : refuses par les navigateurs a l'affichage, on
// renvoie un message explicite plutot qu'un "type non supporte" opaque.
const HEIC_MIME = new Set(["image/heic", "image/heif", "image/heic-sequence"]);
// "photo" alimente la galerie : le fichier est stocke et son URL renvoyee au
// client, qui l'ajoute au tableau `photos` puis enregistre le profil.
const ALLOWED_KINDS = ["logo", "signature", "bannerImage", "photo"] as const;
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
      if (HEIC_MIME.has(file.type)) {
        return NextResponse.json(
          { error: "Photo iPhone (HEIC) non supportée. Exportez-la en JPEG ou PNG avant de l'envoyer." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Type d'image non supporté (formats acceptés : PNG, JPEG, WEBP, AVIF, GIF, SVG)" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      const mb = Math.round(MAX_BYTES / (1024 * 1024));
      return NextResponse.json(
        { error: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} MB) — maximum ${mb} MB` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const filename = `${kind}-${timestamp}.${ext}`;

    const { url, storage } = await uploadFile({
      pathPrefix: `centres/${centreId}`,
      filename,
      contentType: file.type,
      buffer,
    });

    // La galerie est un tableau gere cote profil : on se contente de renvoyer
    // l'URL, sans ecraser de champ unique.
    if (kind !== "photo") {
      const fieldMap: Record<Exclude<UploadKind, "photo">, "logo" | "signatureUrl" | "bannerImage"> = {
        logo: "logo",
        signature: "signatureUrl",
        bannerImage: "bannerImage",
      };
      await prisma.centre.update({
        where: { id: centreId },
        data: { [fieldMap[kind]]: url },
      });
    }

    return NextResponse.json({ url, kind, storage });
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
