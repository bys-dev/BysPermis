import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, PLATFORM_ROLES } from "@/lib/auth0";

/**
 * GET /api/messages/[userId] — Conversation entre l'utilisateur courant et userId.
 * Anti-IDOR: refuse si aucune relation user↔partenaire (réservation, ticket,
 * message existant, ou staff plateforme).
 */
async function canMessage(userAId: string, userBId: string): Promise<boolean> {
  if (userAId === userBId) return false;

  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: userAId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userBId }, select: { role: true } }),
  ]);
  if (!a || !b) return false;
  const staffRoles = new Set<string>(PLATFORM_ROLES);
  if (staffRoles.has(a.role) || staffRoles.has(b.role)) return true;

  const existingMessage = await prisma.message.findFirst({
    where: {
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    },
    select: { id: true },
  });
  if (existingMessage) return true;

  const sharedAsElev = await prisma.reservation.findFirst({
    where: {
      OR: [
        {
          userId: userAId,
          session: {
            formation: {
              centre: {
                OR: [
                  { userId: userBId },
                  { membres: { some: { userId: userBId } } },
                ],
              },
            },
          },
        },
        {
          userId: userBId,
          session: {
            formation: {
              centre: {
                OR: [
                  { userId: userAId },
                  { membres: { some: { userId: userAId } } },
                ],
              },
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  if (sharedAsElev) return true;

  const sharedTicket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { userId: userAId, messages: { some: { userId: userBId } } },
        { userId: userBId, messages: { some: { userId: userAId } } },
      ],
    },
    select: { id: true },
  });
  if (sharedTicket) return true;

  return false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    if (!(await canMessage(user.id, userId))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

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
