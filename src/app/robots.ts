import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bys-formation.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/espace-eleve/",
        "/espace-centre/",
        "/admin/",
        "/plateforme/",
        "/dashboard/",
        "/reserver/",
        "/support/",
        "/maintenance",
        "/connexion",
        "/inscription",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
