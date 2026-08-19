import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { DEPARTEMENTS, VILLES } from "@/lib/seo/geo-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/recherche`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/stages`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/politique-de-confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/comment-ca-marche`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tarifs-partenaires`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/devenir-partenaire`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/centres`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Landing pages géographiques — issues du référentiel statique, donc
  // présentes dans le sitemap même quand aucun centre n'est encore référencé
  // dans la commune ou le département.
  const villePages: MetadataRoute.Sitemap = VILLES.map((v) => ({
    url: `${BASE_URL}/stages/${v.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const deptPages: MetadataRoute.Sitemap = DEPARTEMENTS.map((d) => ({
    url: `${BASE_URL}/stages/departement/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

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

  // Dynamic: blog articles
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
    blogPages = articles.map((a) => ({
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB might not be available during build
  }

  return [
    ...staticPages,
    ...villePages,
    ...deptPages,
    ...formationPages,
    ...centrePages,
    ...blogPages,
  ];
}
