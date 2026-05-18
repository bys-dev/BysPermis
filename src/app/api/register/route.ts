import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

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

// ─── Zod validation ─────────────────────────────────────────
// Mot de passe : >= 12 caractères, 1 maj, 1 chiffre, 1 spécial.
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(100),
  lastName: z.string().trim().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide").max(254),
  password: z.string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
    .regex(passwordRegex, "Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial."),
  confirmPassword: z.string(),
  accountType: z.enum(["eleve", "centre"]).optional(),
  acceptCGU: z.boolean(),
  centreName: z.string().trim().max(200).optional(),
  referralCode: z.string().trim().max(50).optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
}).refine((d) => d.acceptCGU, {
  message: "Vous devez accepter les CGU.",
  path: ["acceptCGU"],
}).refine((d) => d.accountType !== "centre" || (d.centreName && d.centreName.length > 0), {
  message: "Nom du centre requis.",
  path: ["centreName"],
});

// Réponse générique pour anti-énumération
const GENERIC_OK = NextResponse.json({
  success: true,
  message: "Si cet email n'est pas déjà utilisé, votre compte a été créé. Vérifiez votre boîte mail pour activer votre compte.",
}, { status: 200 });

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
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, accountType, centreName, referralCode } = parsed.data;

    // ── Vérifier si email existe déjà — réponse générique pour anti-énum ──
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.info(`[register] Tentative de création avec email existant: ${email}`);
      return GENERIC_OK;
    }

    // ── Anti auto-promotion: tous les comptes démarrent en ELEVE ──
    // Le rôle CENTRE_OWNER est attribué après validation admin du centre
    // (voir /api/admin/centres/[id]/validate qui promote l'owner).
    const role = "ELEVE";

    // ── Créer dans Auth0 (Management API) ─────────────────
    let auth0Id: string | null = null;
    try {
      const token = await getManagementToken();
      auth0Id = await createAuth0User({ email, password, firstName, lastName, role, token });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        console.info(`[register] Auth0 retourne EMAIL_EXISTS pour: ${email}`);
        return GENERIC_OK;
      }
      // En dev sans env vars, continuer sans Auth0
      if (process.env.NODE_ENV !== "development") {
        console.error("[register] Erreur Auth0 Management API:", err);
        // On retourne quand même la réponse générique pour éviter la fuite d'info.
        return GENERIC_OK;
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
    await prisma.$transaction(async (tx) => {
      const generatedRefCode = `BYS-${firstName.toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "X")}${Math.floor(Math.random() * 100)}`;

      const user = await tx.user.create({
        data: {
          auth0Id: auth0Id ?? `local_${Date.now()}`,
          email,
          nom: lastName,
          prenom: firstName,
          role,
          referralCode: generatedRefCode,
          referredBy: validReferralCode,
        },
      });

      // Pour les comptes "centre" : créer le Centre en EN_ATTENTE (statut
      // par défaut) et le rattacher au user. Le user reste ELEVE jusqu'à
      // la validation admin qui passera son rôle en CENTRE_OWNER.
      if (accountType === "centre" && centreName) {
        const slug = slugify(centreName) + "-" + Date.now().toString(36);
        const centre = await tx.centre.create({
          data: {
            userId: user.id,
            nom: centreName,
            slug,
            adresse: "",
            codePostal: "",
            ville: "",
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { activeCentreId: centre.id },
        });
      }

      return user;
    });

    return GENERIC_OK;

  } catch (err) {
    console.error("[POST /api/register]", err);
    // Réponse générique même en cas d'erreur serveur, pour éviter la fuite d'info.
    return GENERIC_OK;
  }
}
