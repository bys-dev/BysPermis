import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import type { Prisma, ProspectStatus } from "@/generated/prisma/client";
import { computeDedupeKey } from "@/lib/prospects/import";
import { cleanEmail, cleanPhone, cleanSiret, cleanWebsite, departementFromCodePostal } from "@/lib/prospects/parse";

const PROSPECT_STATUTS = [
  "NOUVEAU",
  "A_CONTACTER",
  "CONTACTE",
  "RELANCE",
  "INTERESSE",
  "INSCRIT",
  "REFUSE",
  "INJOIGNABLE",
  "DESABONNE",
] as const satisfies readonly ProspectStatus[];

const MAX_PER_PAGE = 200;

/**
 * GET /api/admin/prospects — fichier de prospects, paginé et filtrable.
 *
 * Query : statut, departement, source, importId, search, avecEmail,
 *         page (1-based), perPage, sort (recent|nom|relance)
 * Renvoie aussi la répartition par statut et les valeurs de filtres
 * disponibles, pour alimenter l'écran sans appel supplémentaire.
 */
export async function GET(req: NextRequest) {
  try {
    await requireCommercial();
    const { searchParams } = req.nextUrl;

    const statuts = searchParams
      .getAll("statut")
      .flatMap((s) => s.split(","))
      .map((s) => s.trim())
      .filter((s): s is ProspectStatus => (PROSPECT_STATUTS as readonly string[]).includes(s));

    const departements = searchParams
      .getAll("departement")
      .flatMap((d) => d.split(","))
      .map((d) => d.trim())
      .filter(Boolean);

    const source = searchParams.get("source")?.trim();
    const importId = searchParams.get("importId")?.trim();
    const search = searchParams.get("search")?.trim();
    const avecEmail = searchParams.get("avecEmail");

    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(searchParams.get("perPage") ?? 50) || 50));
    const sort = searchParams.get("sort") ?? "recent";

    const where: Prisma.ProspectWhereInput = {
      ...(statuts.length ? { statut: { in: statuts } } : {}),
      ...(departements.length ? { departement: { in: departements } } : {}),
      ...(source ? { source } : {}),
      ...(importId ? { importId } : {}),
      ...(avecEmail === "true" ? { email: { not: null } } : {}),
      ...(avecEmail === "false" ? { email: null } : {}),
      ...(search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" } },
              { raisonSociale: { contains: search, mode: "insensitive" } },
              { ville: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { siret: { contains: search } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProspectOrderByWithRelationInput =
      sort === "nom"
        ? { nom: "asc" }
        : sort === "relance"
          ? { lastContactedAt: "asc" }
          : { createdAt: "desc" };

    const [total, prospects, parStatut] = await Promise.all([
      prisma.prospect.count({ where }),
      prisma.prospect.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          nom: true,
          raisonSociale: true,
          email: true,
          emailValide: true,
          telephone: true,
          ville: true,
          codePostal: true,
          departement: true,
          agrementNumber: true,
          contactNom: true,
          contactPrenom: true,
          statut: true,
          score: true,
          source: true,
          notesInternes: true,
          nbEmailsEnvoyes: true,
          nbOuvertures: true,
          nbClics: true,
          lastContactedAt: true,
          unsubscribedAt: true,
          createdAt: true,
          owner: { select: { id: true, prenom: true, nom: true } },
        },
      }),
      prisma.prospect.groupBy({ by: ["statut"], _count: { _all: true } }),
    ]);

    return NextResponse.json({
      prospects,
      pagination: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
      stats: {
        parStatut: Object.fromEntries(parStatut.map((r) => [r.statut, r._count._all])),
        total: parStatut.reduce((sum, r) => sum + r._count._all, 0),
      },
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[GET /api/admin/prospects]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ─── Création manuelle ───────────────────────────────────

const CreateProspectSchema = z.object({
  nom: z.string().min(2, "Nom du centre requis").max(200),
  raisonSociale: z.string().max(200).optional().nullable(),
  siret: z.string().max(30).optional().nullable(),
  agrementNumber: z.string().max(60).optional().nullable(),
  agrementDepartement: z.string().max(10).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  telephone: z.string().max(40).optional().nullable(),
  siteWeb: z.string().max(300).optional().nullable(),
  adresse: z.string().max(300).optional().nullable(),
  codePostal: z.string().max(10).optional().nullable(),
  ville: z.string().max(120).optional().nullable(),
  contactNom: z.string().max(120).optional().nullable(),
  contactPrenom: z.string().max(120).optional().nullable(),
  contactFonction: z.string().max(120).optional().nullable(),
  notesInternes: z.string().max(5000).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  statut: z.enum(PROSPECT_STATUTS).optional(),
});

/** POST /api/admin/prospects — ajout manuel d'un prospect (hors import). */
export async function POST(req: NextRequest) {
  try {
    await requireCommercial();

    const parsed = CreateProspectSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const { email, warning } = cleanEmail(input.email);
    const codePostal = (input.codePostal ?? "").replace(/\D/g, "") || null;
    const siret = cleanSiret(input.siret);

    const dedupeKey = computeDedupeKey({ email, siret, nom: input.nom, codePostal });

    // La clé est unique : on renvoie le doublon plutôt qu'une erreur opaque.
    const existing = await prisma.prospect.findUnique({
      where: { dedupeKey },
      select: { id: true, nom: true, email: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Ce prospect existe déjà : « ${existing.nom} ».`, prospect: existing },
        { status: 409 },
      );
    }

    const prospect = await prisma.prospect.create({
      data: {
        dedupeKey,
        nom: input.nom.trim(),
        raisonSociale: input.raisonSociale?.trim() || null,
        siret,
        agrementNumber: input.agrementNumber?.trim() || null,
        agrementDepartement: input.agrementDepartement?.trim() || null,
        email,
        telephone: cleanPhone(input.telephone),
        siteWeb: cleanWebsite(input.siteWeb),
        adresse: input.adresse?.trim() || null,
        codePostal,
        ville: input.ville?.trim() || null,
        departement: departementFromCodePostal(codePostal),
        contactNom: input.contactNom?.trim() || null,
        contactPrenom: input.contactPrenom?.trim() || null,
        contactFonction: input.contactFonction?.trim() || null,
        notesInternes: input.notesInternes?.trim() || null,
        source: input.source?.trim() || "manuel",
        statut: input.statut ?? "NOUVEAU",
      },
    });

    return NextResponse.json({ prospect, warning: warning ?? null }, { status: 201 });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/prospects]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
