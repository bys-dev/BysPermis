import type { MetadataRoute } from "next";
import { BRAND_NAVY } from "@/lib/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BYS Permis — Stages récupération de points",
    short_name: "BYS Permis",
    description:
      "Réservez votre stage de récupération de points près de chez vous. Stages agréés Ministère de l'Intérieur, convocation immédiate.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: BRAND_NAVY,
    orientation: "portrait",
    lang: "fr",
    categories: ["education", "business"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48 64x64",
        type: "image/x-icon",
      },
      {
        // icon.tsx rend en 512 : ne declarer que cette taille, sinon
        // l'icone d'installation est upscalee depuis une taille inexistante.
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
