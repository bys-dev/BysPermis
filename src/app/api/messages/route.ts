import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// ─── GET /api/messages — Liste des conversations ────────────────
export async function GET() {
  try {
    const user = await requireAuth();

    // Get all distinct conversation partners
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, prenom: true, nom: true, role: true } },
        receiver: { select: { id: true, prenom: true, nom: true, role: true } },
      },
    });

    // Group by conversation partner
    const conversationsMap = new Map<
      string,
      {
        partnerId: string;
        partnerNom: string;
        partnerPrenom: string;
        partnerRole: string;
        lastMessage: string;
        lastMessageAt: Date;
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const partnerId =
        msg.senderId === user.id ? msg.receiverId : msg.senderId;
      const partner =
        msg.senderId === user.id ? msg.receiver : msg.sender;

      if (!conversationsMap.has(partnerId)) {
        // Count unread for this partner
        const unreadCount = messages.filter(
          (m) =>
            m.senderId === partnerId &&
            m.receiverId === user.id &&
            !m.isRead
        ).length;

        conversationsMap.set(partnerId, {
          partnerId,
          partnerNom: partner.nom,
          partnerPrenom: partner.prenom,
          partnerRole: partner.role,
          lastMessage: msg.contenu,
          lastMessageAt: msg.createdAt,
          unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/messages — Envoyer un message ────────────────────
const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  contenu: z.string().min(1).max(5000),
  reservationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = sendMessageSchema.parse(body);

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: data.receiverId },
    });
    if (!receiver) {
      return NextResponse.json(
        { error: "Destinataire introuvable" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        contenu: data.contenu,
        senderId: user.id,
        receiverId: data.receiverId,
        reservationId: data.reservationId ?? null,
      },
      include: {
        sender: { select: { id: true, prenom: true, nom: true } },
        receiver: { select: { id: true, prenom: true, nom: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/messages — Marquer comme lu ─────────────────────
const markReadSchema = z.object({
  partnerId: z.string().min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = markReadSchema.parse(body);

    await prisma.message.updateMany({
      where: {
        senderId: data.partnerId,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
