import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// La description précédente annonçait « permis B, FIMO, FCO » et « 150+
// centres » : hors périmètre V1 (stages de récupération de points uniquement)
// et invérifiable. Des mots-clés sans rapport avec le contenu réel de la page
// diluent la pertinence plutôt qu'ils ne l'élargissent.
export const metadata: Metadata = pageMetadata({
  title: "Centres agréés de récupération de points",
  description:
    "Tous les centres de sensibilisation à la sécurité routière partenaires, agréés par la préfecture : adresse, dates de stage et tarifs. Réservation en ligne.",
  path: "/centres",
  keywords: [
    "centre agréé récupération de points",
    "centre de sensibilisation sécurité routière",
    "CSSR agréé préfecture",
    "liste centres stage points",
    "centre stage permis",
  ],
});

export default function CentresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
