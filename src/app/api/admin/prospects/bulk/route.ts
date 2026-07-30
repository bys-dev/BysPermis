import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, requireAdmin, mapAuthError } from "@/lib/auth0";

const BulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Aucun prospect sélectionné").max(5000),
  action: z.enum(["statut", "assigner", "source", "supprimer"]),
  statut: z
    .enum(["NOUVEAU", "A_CONTACTER", "CONTACTE", "RELANCE", "INTERESSE", "INSCRIT", "REFUSE", "INJOIGNABLE", "DESABONNE"])
    .optional(),
  ownerId: z.string().nullable().optional(),
  source: z.string().max(100).optional(),
});

/**
 * POST /api/admin/prospects/bulk — action groupée sur une sélection.
 *
 * Actions : statut | assigner (commercial) | source (ré-étiquetage) | supprimer.
 * La suppression exige un rôle ADMIN/OWNER, les autres actions le rôle COMMERCIAL.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = BulkSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const { ids, action, statut, ownerId, source } = parsed.data;

    // La suppression de masse est irréversible : garde plus stricte.
    if (action === "supprimer") {
      await requireAdmin();
      const { count } = await prisma.prospect.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ success: true, action, count });
    }

    await requireCommercial();

    if (action === "statut") {
      if (!statut) {
        return NextResponse.json({ error: "Statut manquant." }, { status: 400 });
      }
      // DESABONNE / INJOIGNABLE doivent aussi couper l'éligibilité aux envois,
      // sinon le prospect resterait ciblé par les campagnes suivantes.
      const extra =
        statut === "DESABONNE"
          ? { unsubscribedAt: new Date() }
          : statut === "INJOIGNABLE"
            ? { emailValide: false }
            : {};
      const { count } = await prisma.prospect.updateMany({
        where: { id: { in: ids } },
        data: { statut, ...extra },
      });
      return NextResponse.json({ success: true, action, count });
    }

    if (action === "assigner") {
      if (ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, role: true } });
        if (!owner) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
        if (!["COMMERCIAL", "ADMIN", "OWNER", "SUPPORT"].includes(owner.role)) {
          return NextResponse.json(
            { error: "Ce compte n'a pas un rôle permettant le suivi commercial." },
            { status: 422 },
          );
        }
      }
      const { count } = await prisma.prospect.updateMany({
        where: { id: { in: ids } },
        data: { ownerId: ownerId || null },
      });
      return NextResponse.json({ success: true, action, count });
    }

    // action === "source"
    if (!source?.trim()) {
      return NextResponse.json({ error: "Source manquante." }, { status: 400 });
    }
    const { count } = await prisma.prospect.updateMany({
      where: { id: { in: ids } },
      data: { source: source.trim() },
    });
    return NextResponse.json({ success: true, action, count });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/prospects/bulk]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
