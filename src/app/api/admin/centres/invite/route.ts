import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";
import { slugify } from "@/lib/utils";
import { sendCentreInvitationEmail } from "@/lib/email";

// ─── Auth0 Management API helper ─────────────────────────

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
      app_metadata: {
        role: "CENTRE_OWNER",
      },
    }),
  });

  if (res.status === 409) throw new Error("EMAIL_EXISTS");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur creation compte Auth0");
  }

  const user = await res.json();
  return user.user_id as string;
}

function generateTempPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ─── POST /api/admin/centres/invite ──────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { nom, email, ville } = body;

    // ── Validation ──────────────────────────────────────
    if (!nom?.trim()) {
      return NextResponse.json(
        { error: "Le nom du centre est requis." },
        { status: 400 }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "L'email du proprietaire est requis." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email invalide." },
        { status: 400 }
      );
    }

    // ── Check if user or centre already exists ─────────
    const existingUserWithCentres = await prisma.user.findUnique({
      where: { email },
      include: { centres: true },
    });

    if (existingUserWithCentres?.centres && existingUserWithCentres.centres.length > 0) {
      return NextResponse.json(
        { error: "Cet email est deja associe a un centre." },
        { status: 409 }
      );
    }

    const existingUserId = existingUserWithCentres?.id ?? null;
    const existingUserRole = existingUserWithCentres?.role ?? null;

    // ── Generate temp password ──────────────────────────
    const tempPassword = generateTempPassword();

    // ── Create Auth0 user (with dev fallback) ──────────
    let auth0Id: string | null = null;
    try {
      const token = await getManagementToken();
      auth0Id = await createAuth0User({
        email,
        password: tempPassword,
        name: nom.trim(),
        token,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        // User exists in Auth0 but not in our DB — that's okay, continue
        auth0Id = null;
      } else if (process.env.NODE_ENV !== "development") {
        throw err;
      }
      console.warn(
        "[invite] Auth0 Management API non disponible — mode dev"
      );
    }

    // ── Create in DB (transaction) ─────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // Create or reuse user
      let userId: string;
      let userEmail: string;

      if (!existingUserId) {
        const created = await tx.user.create({
          data: {
            auth0Id: auth0Id ?? `local_invite_${Date.now()}`,
            email: email.trim(),
            nom: nom.trim(),
            prenom: "",
            role: "CENTRE_OWNER",
          },
        });
        userId = created.id;
        userEmail = created.email;
      } else {
        userId = existingUserId;
        userEmail = email.trim();
        // Update role if user exists but is not a centre owner
        if (existingUserRole !== "CENTRE_OWNER") {
          await tx.user.update({
            where: { id: existingUserId },
            data: { role: "CENTRE_OWNER" },
          });
        }
      }

      // Create centre
      const slug =
        slugify(nom.trim()) + "-" + Date.now().toString(36);

      const centre = await tx.centre.create({
        data: {
          nom: nom.trim(),
          slug,
          adresse: "",
          codePostal: "",
          ville: ville?.trim() ?? "",
          statut: "EN_ATTENTE",
          isActive: false,
          profilCompletionPct: 0,
          userId,
        },
      });

      // Set the new centre as active for the user
      await tx.user.update({
        where: { id: userId },
        data: { activeCentreId: centre.id },
      });

      // Create notification for the new centre owner
      await tx.notification.create({
        data: {
          titre: "Bienvenue sur BYS Formation",
          contenu:
            "Votre espace centre a ete cree. Completez votre profil pour etre visible sur la marketplace.",
          userId,
        },
      });

      return { userId, userEmail, centre };
    });

    // ── Send invitation email ──────────────────────────
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const loginUrl = `${appUrl}/connexion`;

    try {
      await sendCentreInvitationEmail({
        to: email.trim(),
        centreName: nom.trim(),
        loginUrl,
        tempPassword,
      });
    } catch (emailErr) {
      console.error(
        "[invite] Erreur envoi email d'invitation:",
        emailErr
      );
      // Don't fail the whole request — centre is created
    }

    return NextResponse.json(
      {
        success: true,
        message: "Centre cree et invitation envoyee.",
        centre: {
          id: result.centre.id,
          nom: result.centre.nom,
          slug: result.centre.slug,
        },
        user: {
          id: result.userId,
          email: result.userEmail,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[POST /api/admin/centres/invite]", err);
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez reessayer." },
      { status: 500 }
    );
  }
}
