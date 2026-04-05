import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth0";

// ─── GET /api/messages/[userId] — Conversation avec un utilisateur ─
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: userId },
          { senderId: userId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, prenom: true, nom: true } },
        reservation: {
          select: {
            id: true,
            numero: true,
            session: {
              select: {
                formation: { select: { titre: true } },
              },
            },
          },
        },
      },
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
