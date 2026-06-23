import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";
export const SITE_NAME = "BYS Formation Permis";

export const STAGE_KEYWORDS = [
  "stage récupération points",
  "stage récupération de points",
  "stage permis",
  "stage 48N",
  "stage 48SI",
  "récupérer points permis",
  "stage agréé préfecture",
  "stage sensibilisation sécurité routière",
  "BYS Formation Permis",
] as const;

export function canonical(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const url = canonical(opts.path);
  const ogTitle = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} | ${SITE_NAME}`;

  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords ?? [...STAGE_KEYWORDS],
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      locale: "fr_FR",
      type: "website",
      images: [{ url: opts.ogImage ?? "/opengraph-image", alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: opts.description,
      images: [opts.ogImage ?? "/opengraph-image"],
    },
    ...(opts.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function stageCityBreadcrumb(cityLabel: string, citySlug: string) {
  return [
    { name: "Accueil", url: SITE_URL },
    { name: "Stages par ville", url: `${SITE_URL}/recherche` },
    { name: `Stage ${cityLabel}`, url: canonical(`/stages/${citySlug}`) },
  ];
}
