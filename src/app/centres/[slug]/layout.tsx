import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const centre = await prisma.centre.findUnique({
      where: { slug },
      select: {
        nom: true,
        description: true,
        ville: true,
        codePostal: true,
      },
    });

    if (!centre) {
      return { title: "Centre introuvable" };
    }

    const description =
      centre.description?.slice(0, 155) ??
      `${centre.nom} — Centre agréé préfecture à ${centre.ville} (${centre.codePostal}). Réservez votre stage en ligne.`;

    return {
      title: `${centre.nom} | BYS Formation Permis`,
      description,
      alternates: { canonical: `/centres/${slug}` },
      openGraph: {
        title: `${centre.nom} — ${centre.ville}`,
        description,
        url: `/centres/${slug}`,
        type: "website",
        locale: "fr_FR",
        siteName: "BYS Formation Permis",
        images: [{ url: "/opengraph-image" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${centre.nom} — ${centre.ville}`,
        description,
        images: ["/opengraph-image"],
      },
    };
  } catch {
    return { title: "Centre" };
  }
}

export default function CentreSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
