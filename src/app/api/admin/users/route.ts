import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin, requireOwner } from "@/lib/auth0";
import { slugify } from "@/lib/utils";

const ALL_ROLES = ["ELEVE", "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE", "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"] as const;

// ─── GET /api/admin/users ────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const users = await prisma.user.findMany({
      where: {
        ...(role && role !== "tous" ? { role: role as (typeof ALL_ROLES)[number] } : {}),
        ...(search ? {
          OR: [
            { prenom: { contains: search, mode: "insensitive" as const } },
            { nom:    { contains: search, mode: "insensitive" as const } },
            { email:  { contains: search, mode: "insensitive" as const } },
          ],
        } : {}),
      },
      select: {
        id: true, prenom: true, nom: true, email: true, role: true,
        isBlocked: true, createdAt: true, auth0Id: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/admin/users — Créer un utilisateur ────────
const createSchema = z.object({
  prenom: z.string().min(1, "Prénom requis"),
  nom: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(ALL_ROLES),
  password: z.string().min(8, "Minimum 8 caractères").optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);

    // Vérifier doublon email
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Un utilisateur existe déjà avec cet email." }, { status: 409 });
    }

    // Créer dans Auth0 si possible
    let auth0Id = `local_${Date.now()}`;
    try {
      const domain = process.env.AUTH0_DOMAIN;
      const clientId = process.env.AUTH0_CLIENT_ID;
      const clientSecret = process.env.AUTH0_CLIENT_SECRET;

      if (domain && clientId && clientSecret) {
        // Get management token
        const tokenRes = await fetch(`https://${domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            audience: `https://${domain}/api/v2/`,
          }),
        });

        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json();
          const tempPassword = data.password ?? `BYS-${Math.random().toString(36).slice(2, 10)}!Aa1`;

          const createRes = await fetch(`https://${domain}/api/v2/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
              email: data.email,
              password: tempPassword,
              given_name: data.prenom,
              family_name: data.nom,
              name: `${data.prenom} ${data.nom}`,
              connection: "Username-Password-Authentication",
              email_verified: false,
              app_metadata: { role: data.role },
            }),
          });

          if (createRes.ok) {
            const auth0User = await createRes.json();
            auth0Id = auth0User.user_id as string;
          }
        }
      }
    } catch {
      console.warn("[admin/users POST] Auth0 non disponible — mode dev");
    }

    // Créer en BDD
    const user = await prisma.user.create({
      data: {
        auth0Id,
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        role: data.role,
      },
      select: {
        id: true, prenom: true, nom: true, email: true, role: true,
        isBlocked: true, createdAt: true,
        _count: { select: { reservations: true } },
      },
    });

    // Si rôle centre, créer un Centre automatiquement
    if (data.role === "CENTRE_OWNER") {
      const slug = slugify(`${data.prenom}-${data.nom}`) + "-" + Date.now().toString(36);
      await prisma.centre.create({
        data: {
          userId: user.id,
          nom: `Centre de ${data.prenom} ${data.nom}`,
          slug,
          adresse: "",
          codePostal: "",
          ville: "",
        },
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/users — Modifier rôle ou bloquer ───
const patchSchema = z.object({
  id: z.string(),
  isBlocked: z.boolean().optional(),
  role: z.enum(ALL_ROLES).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, ...data } = patchSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, prenom: true, nom: true, email: true, role: true, isBlocked: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/users — Supprimer un utilisateur ──
const deleteSchema = z.object({
  id: z.string(),
});

export async function DELETE(req: NextRequest) {
  try {
    await requireOwner(); // Seul le OWNER peut supprimer

    const body = await req.json();
    const { id } = deleteSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, auth0Id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Empêcher la suppression d'un OWNER par un autre OWNER
    if (user.role === "OWNER") {
      return NextResponse.json({ error: "Impossible de supprimer un Owner." }, { status: 403 });
    }

    // Supprimer dans Auth0 si possible
    try {
      const domain = process.env.AUTH0_DOMAIN;
      const clientId = process.env.AUTH0_CLIENT_ID;
      const clientSecret = process.env.AUTH0_CLIENT_SECRET;

      if (domain && clientId && clientSecret && !user.auth0Id.startsWith("local_")) {
        const tokenRes = await fetch(`https://${domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            audience: `https://${domain}/api/v2/`,
          }),
        });

        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json();
          await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(user.auth0Id)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${access_token}` },
          });
        }
      }
    } catch {
      console.warn("[admin/users DELETE] Impossible de supprimer dans Auth0");
    }

    // Supprimer en cascade dans la BDD
    // Les relations ont onDelete: Cascade sur Centre, CentreMembre, etc.
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Utilisateur ${user.email} supprimé.` });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
