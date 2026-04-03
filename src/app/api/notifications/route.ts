import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";
import { z } from "zod";

// ─── GET /api/notifications — toutes les notifications de l'utilisateur ───
export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── PATCH /api/notifications — marquer comme lu ──────────
// Body: { id: string } → marque une seule notification
// Body: {} (vide)      → marque toutes les notifications
const patchSchema = z.object({
  id: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const data = patchSchema.parse(body);

    if (data.id) {
      // Marquer une seule notification comme lue
      await prisma.notification.updateMany({
        where: { id: data.id, userId: user.id },
        data: { isRead: true },
      });
    } else {
      // Marquer toutes comme lues
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── POST /api/notifications — créer une notification (usage système) ───
const createSchema = z.object({
  userId: z.string().min(1),
  titre: z.string().min(1).max(200),
  contenu: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    // Only authenticated users can create notifications (system/admin use)
    await requireAuth();
    const body = await req.json();
    const data = createSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        titre: data.titre,
        contenu: data.contenu,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
