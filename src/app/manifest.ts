import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BYS Formation — Stages récupération de points",
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
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
