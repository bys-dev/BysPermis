import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

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

    return {
      title: `${formation.titre} — ${formation.centre.ville}`,
      description: formation.description.slice(0, 160),
      keywords: [
        formation.titre,
        formation.centre.nom,
        formation.centre.ville,
        "stage",
        "formation",
        "permis",
      ],
      openGraph: {
        title: formation.titre,
        description: formation.description.slice(0, 160),
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

export default function FormationSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
