import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

// ─── Auth0 Management API helper ─────────────────────────

async function getManagementToken(): Promise<string> {
  const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ?? process.env.AUTH0_DOMAIN;
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
  firstName: string;
  lastName: string;
  role: string;
  token: string;
}): Promise<string> {
  const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ?? process.env.AUTH0_DOMAIN;
  const res = await fetch(`https://${domain}/api/v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      given_name: params.firstName,
      family_name: params.lastName,
      name: `${params.firstName} ${params.lastName}`,
      connection: "Username-Password-Authentication",
      email_verified: false,
      app_metadata: {
        role: params.role,
      },
    }),
  });

  if (res.status === 409) throw new Error("EMAIL_EXISTS");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur création compte Auth0");
  }

  const user = await res.json();
  return user.user_id as string;
}

// ─── POST /api/register ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, {
      max: 10,
      windowMs: 60 * 1000,
      keyPrefix: "register",
    });
    if (limited) return limited;

    const body = await req.json();
    const { firstName, lastName, email, password, confirmPassword, accountType, acceptCGU, centreName, referralCode } = body;

    // ── Validation ────────────────────────────────────────
    if (!firstName?.trim()) return NextResponse.json({ error: "Prénom requis." }, { status: 400 });
    if (!lastName?.trim()) return NextResponse.json({ error: "Nom requis." }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Mot de passe requis." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
    if (!acceptCGU) return NextResponse.json({ error: "Vous devez accepter les CGU." }, { status: 400 });
    if (accountType === "centre" && !centreName?.trim()) {
      return NextResponse.json({ error: "Nom du centre requis." }, { status: 400 });
    }

    // ── Vérifier si email existe déjà en BDD ──────────────
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });

    const role = accountType === "centre" ? "CENTRE_OWNER" : "ELEVE";

    // ── Créer dans Auth0 (Management API) ─────────────────
    let auth0Id: string | null = null;
    try {
      const token = await getManagementToken();
      auth0Id = await createAuth0User({ email, password, firstName, lastName, role, token });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
      }
      // En dev sans env vars, continuer sans Auth0
      if (process.env.NODE_ENV !== "development") {
        throw err;
      }
      console.warn("[register] Auth0 Management API non disponible — mode dev");
    }

    // ── Vérifier le code parrain s'il est fourni ──────────
    let validReferralCode: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) {
        validReferralCode = referralCode;
      }
      // Ignore silently if code is invalid
    }

    // ── Créer en BDD (transaction) ────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const generatedRefCode = `BYS-${firstName.trim().toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "X")}${Math.floor(Math.random() * 100)}`;

      const user = await tx.user.create({
        data: {
          auth0Id: auth0Id ?? `local_${Date.now()}`,
          email,
          nom: lastName.trim(),
          prenom: firstName.trim(),
          role,
          referralCode: generatedRefCode,
          referredBy: validReferralCode,
        },
      });

      if (role === "CENTRE_OWNER" && centreName) {
        const slug = slugify(centreName) + "-" + Date.now().toString(36);
        const centre = await tx.centre.create({
          data: {
            userId: user.id,
            nom: centreName.trim(),
            slug,
            adresse: "",
            codePostal: "",
            ville: "",
          },
        });

        // Set the new centre as active
        await tx.user.update({
          where: { id: user.id },
          data: { activeCentreId: centre.id },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès.",
      user: { email: result.email, role: result.role },
    }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/register]", err);
    return NextResponse.json({ error: "Erreur serveur. Veuillez réessayer." }, { status: 500 });
  }
}
