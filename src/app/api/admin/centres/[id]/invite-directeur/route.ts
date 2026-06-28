import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";
import { sendDirecteurLieuInvitationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email invalide").max(254),
  prenom: z.string().min(1, "Prénom requis").max(80),
  nom: z.string().min(1, "Nom requis").max(80),
});

async function getManagementToken(): Promise<string> {
  const domain =
    process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ??
    process.env.AUTH0_DOMAIN;
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error("Impossible d'obtenir le token Management API");
  const data = await res.json();
  return data.access_token as string;
}

async function createAuth0User(params: {
  email: string;
  password: string;
  name: string;
  token: string;
}): Promise<string> {
  const domain =
    process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ??
    process.env.AUTH0_DOMAIN;
  const res = await fetch(`https://${domain}/api/v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      name: params.name,
      connection: "Username-Password-Authentication",
      email_verified: false,
      app_metadata: { role: "CENTRE_ADMIN" },
    }),
  });

  if (res.status === 409) throw new Error("EMAIL_EXISTS");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Erreur creation compte Auth0");
  }

  const user = await res.json();
  return (user as { user_id: string }).user_id;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// POST /api/admin/centres/[id]/invite-directeur
// Crée un compte CENTRE_ADMIN rattaché à ce lieu uniquement
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(req, { max: 20, windowMs: 60_000, keyPrefix: "admin-invite-dir" });
    if (limited) return limited;

    await requireAdmin();

    const { id: centreId } = await params;

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      select: { id: true, nom: true },
    });

    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, prenom, nom } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Check if already member of this centre
      const alreadyMembre = await prisma.centreMembre.findUnique({
        where: { userId_centreId: { userId: existingUser.id, centreId } },
      });
      if (alreadyMembre) {
        return NextResponse.json(
          { error: "Cet utilisateur est déjà membre de ce lieu." },
          { status: 409 }
        );
      }

      // Add as membre to this centre
      await prisma.$transaction(async (tx) => {
        await tx.centreMembre.create({
          data: { userId: existingUser.id, centreId, role: "CENTRE_ADMIN" },
        });
        if (existingUser.role === "ELEVE") {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { role: "CENTRE_ADMIN", activeCentreId: centreId },
          });
        }
        await tx.notification.create({
          data: {
            titre: "Accès directeur de lieu",
            contenu: `Vous avez été nommé directeur du lieu "${centre.nom}".`,
            userId: existingUser.id,
          },
        });
      });

      return NextResponse.json(
        { success: true, message: "Directeur ajouté au lieu.", user: { id: existingUser.id, email } },
        { status: 201 }
      );
    }

    // New user — create in Auth0 + DB
    const tempPassword = generateTempPassword();
    let auth0Id: string | null = null;

    try {
      const token = await getManagementToken();
      auth0Id = await createAuth0User({
        email,
        password: tempPassword,
        name: `${prenom} ${nom}`.trim(),
        token,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        auth0Id = null;
      } else if (process.env.NODE_ENV !== "development") {
        throw err;
      }
      console.warn("[invite-directeur] Auth0 Management API non disponible — mode dev");
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          auth0Id: auth0Id ?? `local_dir_${Date.now()}`,
          email: email.trim(),
          prenom: prenom.trim(),
          nom: nom.trim(),
          role: "CENTRE_ADMIN",
          activeCentreId: centreId,
        },
      });

      await tx.centreMembre.create({
        data: { userId: user.id, centreId, role: "CENTRE_ADMIN" },
      });

      await tx.notification.create({
        data: {
          titre: "Bienvenue sur BYS Formation",
          contenu: `Votre accès directeur de lieu pour "${centre.nom}" est prêt.`,
          userId: user.id,
        },
      });

      return user;
    });

    // Send invitation email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendDirecteurLieuInvitationEmail({
        to: email.trim(),
        prenom: prenom.trim(),
        centreName: centre.nom,
        loginUrl: `${appUrl}/connexion`,
        tempPassword,
      });
    } catch (emailErr) {
      console.error("[invite-directeur] Erreur envoi email:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Directeur de lieu créé et invitation envoyée.",
        user: { id: result.id, email: result.email },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[POST /api/admin/centres/[id]/invite-directeur]", err);
    return NextResponse.json({ error: "Erreur serveur. Veuillez reessayer." }, { status: 500 });
  }
}
