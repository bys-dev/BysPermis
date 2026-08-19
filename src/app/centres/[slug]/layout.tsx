import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { deptFromCodePostal, getDepartement, getVille, slugifyVille } from "@/lib/seo/geo-data";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

/** Champs communs à la metadata et au JSON-LD — une seule lecture par requête. */
const SELECT = {
  nom: true,
  description: true,
  adresse: true,
  ville: true,
  codePostal: true,
  telephone: true,
  email: true,
  latitude: true,
  longitude: true,
  logo: true,
} as const;

async function loadCentre(slug: string) {
  try {
    return await prisma.centre.findUnique({ where: { slug }, select: SELECT });
  } catch {
    return null; // base indisponible (build, incident) : la page reste servie
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const centre = await loadCentre(slug);

    if (!centre) {
      return { title: "Centre introuvable", robots: { index: false, follow: false } };
    }

    const description =
      centre.description?.slice(0, 155) ??
      `${centre.nom} — centre agréé préfecture à ${centre.ville} (${centre.codePostal}). Stage de récupération de points : dates, tarifs et réservation en ligne.`;

    return pageMetadata({
      title: `${centre.nom} — stage de récupération de points à ${centre.ville}`,
      description,
      path: `/centres/${slug}`,
      keywords: [
        centre.nom,
        `stage récupération points ${centre.ville}`,
        `centre agréé ${centre.ville}`,
        `stage permis ${centre.codePostal}`,
      ],
    });
  } catch {
    return { title: "Centre" };
  }
}

export default async function CentreSlugLayout({ params, children }: Props) {
  const { slug } = await params;

  const centre = await loadCentre(slug);

  if (!centre) return <>{children}</>;

  // Les coordonnées saisies priment ; à défaut on retombe sur celles de la
  // commune. Approximatif mais suffisant pour rattacher l'établissement à une
  // aire géographique — et bien préférable à l'absence de `geo`, qui prive la
  // fiche de tout signal de proximité.
  const refVille = getVille(slugifyVille(centre.ville));
  const lat = centre.latitude ?? refVille?.lat;
  const lng = centre.longitude ?? refVille?.lng;

  const dept = getDepartement(deptFromCodePostal(centre.codePostal) ?? "");

  const jsonLd = [
    localBusinessJsonLd({
      name: centre.nom,
      slug,
      description: centre.description ?? undefined,
      address: centre.adresse,
      postalCode: centre.codePostal,
      city: centre.ville,
      phone: centre.telephone ?? undefined,
      email: centre.email ?? undefined,
      image: centre.logo ?? undefined,
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    }),
    breadcrumbJsonLd([
      { name: "Accueil", url: SITE_URL },
      { name: "Centres agréés", url: `${SITE_URL}/centres` },
      ...(dept
        ? [{ name: dept.nom, url: `${SITE_URL}/stages/departement/${dept.slug}` }]
        : []),
      { name: centre.nom, url: `${SITE_URL}/centres/${slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd id={`ld-centre-${slug}`} data={jsonLd} />
      {children}
    </>
  );
}
