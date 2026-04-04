import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bys-formation.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/recherche`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/cgu`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/politique-de-confidentialite`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/comment-ca-marche`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tarifs-partenaires`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic: formations
  let formationPages: MetadataRoute.Sitemap = [];
  try {
    const formations = await prisma.formation.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    formationPages = formations.map((f) => ({
      url: `${BASE_URL}/formations/${f.slug}`,
      lastModified: f.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB might not be available during build
  }

  // Dynamic: centres
  let centrePages: MetadataRoute.Sitemap = [];
  try {
    const centres = await prisma.centre.findMany({
      where: { isActive: true, statut: "ACTIF" },
      select: { slug: true, updatedAt: true },
    });
    centrePages = centres.map((c) => ({
      url: `${BASE_URL}/centres/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB might not be available during build
  }

  // Dynamic: stages par ville (SEO landing pages)
  let villePages: MetadataRoute.Sitemap = [];
  try {
    const villes = await prisma.centre.findMany({
      where: { isActive: true, statut: "ACTIF" },
      select: { ville: true },
      distinct: ["ville"],
    });
    villePages = villes.map((v) => ({
      url: `${BASE_URL}/stages/${encodeURIComponent(v.ville.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB might not be available during build
  }

  return [...staticPages, ...formationPages, ...centrePages, ...villePages];
}
