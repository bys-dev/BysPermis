import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, courseJsonLd } from "@/lib/seo/jsonld";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const formation = await prisma.formation.findUnique({
      where: { slug },
      select: {
        titre: true,
        description: true,
        prix: true,
        duree: true,
        centre: { select: { nom: true, ville: true } },
      },
    });

    if (!formation) {
      return {
        title: "Formation introuvable",
        description: "Cette formation n'existe pas ou a été supprimée.",
      };
    }

    const description = formation.description.slice(0, 155);

    return {
      title: `${formation.titre} | BYS Formation`,
      description,
      keywords: [
        formation.titre,
        formation.centre.nom,
        formation.centre.ville,
        "stage récupération de points",
        `stage permis ${formation.centre.ville}`,
        "stage agréé préfecture",
      ],
      alternates: { canonical: `/formations/${slug}` },
      openGraph: {
        title: `${formation.titre} — ${formation.centre.ville}`,
        description,
        url: `/formations/${slug}`,
        type: "website",
        locale: "fr_FR",
        siteName: "BYS Formation",
      },
    };
  } catch {
    return {
      title: "Formation",
      description: "Détails de la formation sur BYS Formation.",
    };
  }
}

export default async function FormationSlugLayout({
  params,
  children,
}: Props) {
  const { slug } = await params;

  let jsonLd: object[] = [];
  try {
    const formation = await prisma.formation.findUnique({
      where: { slug },
      select: {
        titre: true,
        description: true,
        prix: true,
        slug: true,
        centre: { select: { nom: true, ville: true } },
        sessions: {
          where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
          orderBy: { dateDebut: "asc" },
          take: 5,
          select: {
            dateDebut: true,
            dateFin: true,
            placesRestantes: true,
          },
        },
      },
    });

    if (formation) {
      jsonLd = [
        breadcrumbJsonLd([
          { name: "Accueil", url: "/" },
          { name: "Formations", url: "/recherche" },
          { name: formation.titre, url: `/formations/${formation.slug}` },
        ]),
        courseJsonLd({
          title: formation.titre,
          description: formation.description,
          slug: formation.slug,
          price: formation.prix,
          centreName: formation.centre.nom,
          centreCity: formation.centre.ville,
          durationISO: "P2D",
          sessions: formation.sessions.map((s) => ({
            startDate: s.dateDebut.toISOString(),
            endDate: s.dateFin.toISOString(),
            placesRestantes: s.placesRestantes,
            ville: formation.centre.ville,
          })),
        }),
      ];
    }
  } catch {
    // DB indisponible — on rend la page sans JSON-LD
  }

  return (
    <>
      {jsonLd.length > 0 && <JsonLd id={`ld-formation-${slug}`} data={jsonLd} />}
      {children}
    </>
  );
}
