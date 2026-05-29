import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { deleteFile } from "@/lib/storage";

// DELETE /api/eleve/documents/[id] — l'élève retire un document qu'il a uploadé
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { reservation: { select: { userId: true } } },
  });
  if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  if (document.reservation.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (document.direction !== "ELEVE_VERS_CENTRE") {
    return NextResponse.json({ error: "Seuls vos propres documents peuvent être supprimés" }, { status: 403 });
  }
  if (document.status === "ACCEPTE") {
    return NextResponse.json({ error: "Un document accepté ne peut pas être supprimé" }, { status: 403 });
  }

  if (document.blobUrl) await deleteFile(document.blobUrl);
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
