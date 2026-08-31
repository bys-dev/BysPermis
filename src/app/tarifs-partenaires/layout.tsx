import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs partenaires — Devenir centre partenaire",
  description:
    "Rejoignez BYS Permis sans abonnement ni engagement : 15 % de commission sur les réservations confirmées et versement hebdomadaire via Stripe.",
  alternates: { canonical: "/tarifs-partenaires" },
  openGraph: {
    title: "Tarifs partenaires | BYS Permis",
    description:
      "Sans abonnement : 15 % de commission et versement hebdomadaire.",
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
