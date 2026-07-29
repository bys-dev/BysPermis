import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BYS Formation Permis — Stages récupération de points",
    short_name: "BYS Permis",
    description:
      "Réservez votre stage de récupération de points près de chez vous. Stages agréés Ministère de l'Intérieur, convocation immédiate.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0A1628",
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
