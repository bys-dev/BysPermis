import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rechercher un stage de récupération de points",
  description:
    "Recherchez et comparez les stages agréés de récupération de points près de chez vous. Réservation en ligne, centres agréés Ministère de l'Intérieur, jusqu'à 4 points récupérés en 2 jours.",
  keywords: [
    "recherche stage récupération points",
    "stage permis près de chez moi",
    "stage 48N",
    "stage 48SI",
    "stage volontaire récupération points",
    "stage agréé préfecture",
  ],
  alternates: { canonical: "/recherche" },
  openGraph: {
    title: "Rechercher un stage | BYS Formation",
    description:
      "Comparez les centres agréés préfecture et réservez votre stage en ligne.",
    url: "/recherche",
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Formation",
  },
};

export default function RechercheLayout({ children }: { children: React.ReactNode }) {
  return children;
}
