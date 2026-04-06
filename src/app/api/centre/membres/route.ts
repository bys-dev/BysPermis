import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreStaff, requireCentreOwner, CENTRE_ROLES } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

// GET /api/centre/membres — List all members of the current user's centre
export async function GET() {
  try {
    const user = await requireCentreStaff();

    // Platform admins: if they have a centre as owner, use that
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) {
      return NextResponse.json({ error: "Aucun centre associé" }, { status: 404 });
    }

    const membres = await prisma.centreMembre.findMany({
      where: { centreId },
      include: {
        user: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(membres);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

// POST /api/centre/membres — Add a member (CENTRE_OWNER only)
export async function POST(req: NextRequest) {
  try {
    const owner = await requireCentreOwner();

    const body = await req.json();
    const { email, role } = body as { email?: string; role?: string };

    if (!email || !role) {
      return NextResponse.json({ error: "Email et rôle requis" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"] as const;
    if (!validRoles.includes(role as typeof validRoles[number])) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Find the owner's active centre
    const centreId = await getUserCentreId(owner.id, owner.role);
    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }
    const centre = { id: centreId };

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, prenom: true, nom: true, email: true, role: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Aucun utilisateur trouvé avec cet e-mail. L'utilisateur doit d'abord créer un compte." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existing = await prisma.centreMembre.findUnique({
      where: { userId_centreId: { userId: targetUser.id, centreId: centre.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Cet utilisateur est déjà membre du centre." }, { status: 409 });
    }

    // Create membership
    const membre = await prisma.centreMembre.create({
      data: {
        userId: targetUser.id,
        centreId: centre.id,
        role: role as typeof CENTRE_ROLES[number],
      },
      include: {
        user: {
          select: { id: true, prenom: true, nom: true, email: true },
        },
      },
    });

    // Also update the user's role if they are still ELEVE
    if (targetUser.role === "ELEVE") {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: role as typeof CENTRE_ROLES[number] },
      });
    }

    return NextResponse.json(membre, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

// DELETE /api/centre/membres — Remove a member (CENTRE_OWNER only)
export async function DELETE(req: NextRequest) {
  try {
    const owner = await requireCentreOwner();

    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    // Find the owner's active centre
    const centreId = await getUserCentreId(owner.id, owner.role);
    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }
    const centre = { id: centreId };

    // Cannot remove self
    if (userId === owner.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous retirer vous-même." }, { status: 400 });
    }

    // Delete membership
    const deleted = await prisma.centreMembre.deleteMany({
      where: { userId, centreId: centre.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}
