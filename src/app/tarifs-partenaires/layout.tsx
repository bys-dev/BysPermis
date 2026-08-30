import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs partenaires — Devenir centre partenaire",
  description:
    "Découvrez nos forfaits pour les centres de formation partenaires. Abonnement mensuel transparent, sans engagement, paiement sécurisé Stripe.",
  alternates: { canonical: "/tarifs-partenaires" },
  openGraph: {
    title: "Tarifs partenaires | BYS Permis",
    description:
      "Forfaits transparents pour les centres de formation partenaires BYS.",
    url: "/tarifs-partenaires",
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Permis",
  },
};

export default function TarifsPartenairesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
