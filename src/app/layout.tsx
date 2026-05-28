import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import Analytics from "@/components/analytics/Analytics";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import JsonLd from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

// Font Awesome config
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://byspermis.fr";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "BYS Formation Permis — Stages agréés de récupération de points",
    template: "%s | BYS Formation Permis",
  },
  description:
    "Trouvez et réservez votre stage de récupération de points du permis de conduire. Tous nos centres sont agréés Ministère de l'Intérieur. Récupérez jusqu'à 4 points en 2 jours.",
  keywords: [
    "stage récupération points",
    "stage récupération de points",
    "stage permis",
    "stage 48N",
    "stage 48SI",
    "stage volontaire permis",
    "récupérer points permis",
    "stage sensibilisation sécurité routière",
    "stage agréé préfecture",
    "BYS Formation Permis",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Formation Permis",
    url: APP_URL,
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BYS Formation Permis — Stages agréés de récupération de points",
    description:
      "Trouvez et réservez votre stage de récupération de points du permis de conduire. Centres agréés Ministère de l'Intérieur.",
    images: ["/opengraph-image"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION
        ? { "facebook-domain-verification": process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION }
        : {}),
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <JsonLd id="ld-organization" data={[organizationJsonLd(), websiteJsonLd()]} />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-brand-bg text-brand-text`}
      >
        <Analytics />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
