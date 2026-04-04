import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes sur les stages et formations",
  description:
    "Retrouvez toutes les réponses à vos questions sur les stages de récupération de points, les formations permis, la réservation, le paiement et les remboursements.",
  keywords: [
    "FAQ stage récupération points",
    "questions fréquentes permis",
    "comment récupérer ses points",
    "stage obligatoire permis probatoire",
    "prix stage points",
  ],
};

// FAQ JSON-LD structured data for SEO
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Combien de points peut-on récupérer lors d'un stage ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Un stage de sensibilisation à la sécurité routière permet de récupérer jusqu'à 4 points sur votre permis de conduire. Les points sont crédités le lendemain du dernier jour de stage.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle est la durée d'un stage de récupération de points ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le stage dure obligatoirement 2 jours consécutifs, soit 14 heures de formation au total (7 heures par jour).",
      },
    },
    {
      "@type": "Question",
      name: "Comment réserver un stage sur BYS Formation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Recherchez un stage par ville ou code postal, sélectionnez le stage qui vous convient, créez votre compte, renseignez vos informations et procédez au paiement sécurisé. Vous recevrez immédiatement votre convocation par email.",
      },
    },
    {
      "@type": "Question",
      name: "Combien coûte un stage de récupération de points ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le prix d'un stage varie entre 200 € et 300 € selon le centre et la ville. Comparez les prix sur BYS Formation pour trouver la meilleure offre.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle est la politique d'annulation et de remboursement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Annulation gratuite au moins 10 jours avant le stage. Entre 10 et 3 jours : remboursement de 70%. Moins de 3 jours : aucun remboursement. Le remboursement est crédité sous 5 à 10 jours ouvrés.",
      },
    },
    {
      "@type": "Question",
      name: "À quelle fréquence peut-on faire un stage ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vous pouvez effectuer un stage de récupération de points une fois par an (12 mois minimum entre deux stages volontaires).",
      },
    },
  ],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
