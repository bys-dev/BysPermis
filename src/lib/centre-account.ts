import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  Auth0ManagementError,
  createAuth0PasswordUser,
  findAuth0UserIdByEmail,
  setAuth0UserRole,
} from "@/lib/auth0-management";
import { marquerProspectsInscrits } from "@/lib/prospects/inscrits";

/**
 * Création d'un compte CENTRE_OWNER + de son centre par le staff plateforme.
 * Utilisé par l'invitation manuelle (/api/admin/centres/invite) et par
 * l'acceptation d'une demande partenaire (/api/admin/partenaires/[id]/accept).
 */

export class CentreAccountError extends Error {
  constructor(
    public code: "EMAIL_HAS_CENTRE" | "AUTH0_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "CentreAccountError";
  }
}

export interface CentreAccountInput {
  /** Email de connexion du futur propriétaire. */
  email: string;
  ownerNom: string;
  ownerPrenom?: string | null;
  ownerTelephone?: string | null;
  centre: {
    nom: string;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
    telephone?: string | null;
    email?: string | null;
    siteWeb?: string | null;
    siret?: string | null;
    raisonSociale?: string | null;
    agrementNumber?: string | null;
    agrementDepartement?: string | null;
    nomResponsable?: string | null;
    representantFonction?: string | null;
  };
  welcomeMessage?: string;
}

export interface CentreAccountResult {
  userId: string;
  centreId: string;
  centreSlug: string;
  /** Mot de passe temporaire à transmettre, null si le compte existait déjà. */
  tempPassword: string | null;
  reusedExistingAccount: boolean;
}

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

export function generateTempPassword(length = 16): string {
  let password = "";
  for (let i = 0; i < length; i++) password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  // Garantit la politique Auth0 (minuscule, majuscule, chiffre, spécial).
  return password.slice(0, length - 4) + "aZ7!";
}

const trimOrNull = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : null;
};

function initialCompletion(c: CentreAccountInput["centre"]): number {
  // 5 % par champ de base pré-rempli, plafonné à 20 % avant l'onboarding.
  return [c.adresse, c.codePostal, c.ville, c.telephone].filter((v) => v?.trim()).length * 5;
}

/**
 * Crée (ou rattache) le compte Auth0 + l'utilisateur CENTRE_OWNER + le centre EN_ATTENTE.
 * - Email inconnu : compte Auth0 créé avec un mot de passe temporaire.
 * - Email déjà connu d'Auth0 (ex. ancien élève) : le compte est réutilisé et promu, sans mot de passe.
 * - Email déjà propriétaire d'un centre : refus (EMAIL_HAS_CENTRE).
 */
export async function createCentreOwnerAccount(input: CentreAccountInput): Promise<CentreAccountResult> {
  const email = input.email.trim().toLowerCase();
  const centreNom = input.centre.nom.trim();

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, role: true, auth0Id: true, _count: { select: { centres: true } } },
  });
  if (existingUser && existingUser._count.centres > 0) {
    throw new CentreAccountError("EMAIL_HAS_CENTRE", "Cet email est déjà associé à un centre.");
  }

  // ── Auth0 ──
  let auth0Id: string | null = existingUser?.auth0Id ?? null;
  let tempPassword: string | null = null;
  const isLocalPlaceholder = !auth0Id || auth0Id.startsWith("local_");

  try {
    if (isLocalPlaceholder) {
      const found = await findAuth0UserIdByEmail(email);
      if (found) {
        auth0Id = found;
      } else {
        tempPassword = generateTempPassword();
        auth0Id = await createAuth0PasswordUser({
          email,
          password: tempPassword,
          name: [input.ownerPrenom, input.ownerNom].filter(Boolean).join(" ").trim() || centreNom,
          role: "CENTRE_OWNER",
        });
      }
    }
    if (auth0Id && !tempPassword) {
      await setAuth0UserRole(auth0Id, "CENTRE_OWNER").catch((err) =>
        console.warn("[centre-account] rôle Auth0 non mis à jour:", err),
      );
    }
  } catch (err) {
    const devFallback =
      process.env.NODE_ENV === "development" &&
      err instanceof Auth0ManagementError &&
      err.code === "NOT_CONFIGURED";
    if (!devFallback) {
      console.error("[centre-account] Auth0:", err);
      throw new CentreAccountError(
        "AUTH0_UNAVAILABLE",
        "Impossible de créer le compte de connexion (Auth0). Réessayez dans un instant.",
      );
    }
    console.warn("[centre-account] Auth0 Management API non configurée — compte local (dev)");
    tempPassword = null;
    auth0Id = null;
  }

  // ── Base de données ──
  const result = await prisma.$transaction(async (tx) => {
    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      await tx.user.update({
        where: { id: userId },
        select: { id: true },
        data: {
          role: "CENTRE_OWNER",
          ...(auth0Id && isLocalPlaceholder ? { auth0Id } : {}),
          ...(tempPassword ? { mustChangePassword: true } : {}),
        },
      });
    } else {
      const created = await tx.user.create({
        data: {
          auth0Id: auth0Id ?? `local_invite_${Date.now()}`,
          email,
          nom: input.ownerNom.trim() || centreNom,
          prenom: input.ownerPrenom?.trim() ?? "",
          telephone: trimOrNull(input.ownerTelephone),
          role: "CENTRE_OWNER",
          mustChangePassword: Boolean(tempPassword),
        },
        select: { id: true },
      });
      userId = created.id;
    }

    const c = input.centre;
    const centre = await tx.centre.create({
      data: {
        nom: centreNom,
        slug: `${slugify(centreNom)}-${Date.now().toString(36)}`,
        adresse: c.adresse?.trim() ?? "",
        codePostal: c.codePostal?.trim() ?? "",
        ville: c.ville?.trim() ?? "",
        telephone: trimOrNull(c.telephone),
        email: trimOrNull(c.email),
        siteWeb: trimOrNull(c.siteWeb),
        siret: trimOrNull(c.siret)?.replace(/\s+/g, "") ?? null,
        raisonSociale: trimOrNull(c.raisonSociale),
        agrementNumber: trimOrNull(c.agrementNumber),
        agrementDepartement: trimOrNull(c.agrementDepartement),
        nomResponsable: trimOrNull(c.nomResponsable),
        representantFonction: trimOrNull(c.representantFonction),
        statut: "EN_ATTENTE",
        isActive: false,
        profilCompletionPct: initialCompletion(c),
        userId,
      },
      // select explicite : ne dépend pas des colonnes ajoutées par des migrations plus récentes.
      select: { id: true, slug: true },
    });

    await tx.user.update({ where: { id: userId }, data: { activeCentreId: centre.id }, select: { id: true } });

    await tx.notification.create({
      select: { id: true },
      data: {
        titre: "Bienvenue sur BYS Permis",
        contenu:
          input.welcomeMessage ??
          "Votre espace centre a été créé. Complétez votre profil pour être visible sur la marketplace.",
        userId,
      },
    });

    return { userId, centreId: centre.id, centreSlug: centre.slug };
  });

  // Le centre a maintenant un compte : sa fiche de prospection, si elle
  // existe, sort des listes de relance. Best-effort, le compte est déjà créé.
  await marquerProspectsInscrits({
    emails: [email, input.centre.email],
    sirets: [input.centre.siret],
    centreId: result.centreId,
  }).catch((err) => console.error("[centre-account] rapprochement prospects:", err));

  return { ...result, tempPassword, reusedExistingAccount: Boolean(existingUser) || !tempPassword };
}
