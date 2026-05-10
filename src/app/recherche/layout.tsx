import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rechercher un stage — Récupération de points, permis, FIMO, FCO",
  description:
    "Recherchez et comparez les stages de récupération de points, formations permis B, moto, FIMO et FCO près de chez vous. Réservation en ligne, centres agréés préfecture.",
  keywords: [
    "recherche stage",
    "récupération de points",
    "stage permis près de chez moi",
    "formation FIMO",
    "FCO",
    "auto-école",
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
