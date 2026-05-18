import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos centres partenaires agréés préfecture",
  description:
    "Découvrez nos 150+ centres de formation partenaires agréés par la préfecture. Récupération de points, permis B, FIMO, FCO dans toute la France.",
  alternates: { canonical: "/centres" },
  openGraph: {
    title: "Nos centres partenaires | BYS Formation",
    description:
      "Plus de 150 centres agréés préfecture sur toute la France. Trouvez le centre près de chez vous.",
    url: "/centres",
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Formation",
  },
};

export default function CentresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
