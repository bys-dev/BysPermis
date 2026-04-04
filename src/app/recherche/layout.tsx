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
};

export default function RechercheLayout({ children }: { children: React.ReactNode }) {
  return children;
}
