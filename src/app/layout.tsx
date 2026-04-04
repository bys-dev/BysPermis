import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "BYS Formation — Marketplace de formations permis & sécurité routière",
    template: "%s | BYS Formation",
  },
  description:
    "Trouvez et réservez votre stage de récupération de points, permis B, moto, FIMO, FCO. Comparez les centres agréés près de chez vous.",
  keywords: [
    "stage récupération points",
    "permis de conduire",
    "formation FIMO",
    "stage permis",
    "auto-école",
    "récupération de points",
    "FCO",
    "sécurité routière",
    "BYS Formation",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Formation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-brand-bg text-brand-text`}
      >
        {children}
      </body>
    </html>
  );
}
