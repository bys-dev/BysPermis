import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo";
import { HOME_FAQ } from "@/lib/seo-content";

export const metadata: Metadata = pageMetadata({
  title: "FAQ — Stages récupération de points & réservation",
  description:
    "Réponses à vos questions sur les stages de récupération de points : prix, durée, agrément préfecture, réservation en ligne, annulation et remboursement.",
  path: "/faq",
  keywords: [
    "FAQ stage récupération points",
    "questions fréquentes permis",
    "comment récupérer ses points",
    "stage obligatoire permis probatoire",
    "prix stage points",
  ],
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd id="faq-jsonld" data={faqJsonLd(HOME_FAQ)} />
      {children}
    </>
  );
}
