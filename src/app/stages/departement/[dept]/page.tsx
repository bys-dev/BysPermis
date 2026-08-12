import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";
import {
  BaremeRetraits,
  Definitions,
  EtapesStage,
  FaitsCles,
  FaqSection,
  FormationsList,
  MaillageGeo,
} from "@/components/seo/StageLocalSections";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  itemListJsonLd,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo/jsonld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { STAGE_DEPT_FAQ, STAGE_STEPS } from "@/lib/seo-content";
import { DEPARTEMENTS, getDepartement, villesOfDepartement } from "@/lib/seo/geo-data";
import { formationsDuDepartement, fourchettePrix } from "@/lib/seo/stages-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faLocationDot, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

interface Props {
  params: Promise<{ dept: string }>;
}

export const revalidate = 3600;

/**
 * Comme pour les communes, le routeur rejette lui-même tout code inconnu :
 * voir la note sur `dynamicParams` dans `/stages/[ville]/page.tsx`.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return DEPARTEMENTS.map((d) => ({ dept: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dept: slug } = await params;
  const dept = getDepartement(slug);

  if (!dept) {
    return { title: "Département introuvable", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: `Stage de récupération de points dans le ${dept.nom} (${dept.code})`,
    description: `Tous les stages de récupération de points du ${dept.nom} (${dept.code}) : centres agréés préfecture, dates disponibles, prix affiché tout compris. 4 points récupérés en 2 jours.`,
    path: `/stages/departement/${dept.slug}`,
    keywords: [
      `stage récupération points ${dept.nom}`,
      `stage récupération points ${dept.code}`,
      `stage permis ${dept.nom}`,
      `centre agréé ${dept.nom}`,
      `stage points ${dept.prefecture}`,
      `stage sensibilisation sécurité routière ${dept.nom}`,
    ],
  });
}

export default async function StagesDepartementPage({ params }: Props) {
  const { dept: slug } = await params;
  const dept = getDepartement(slug);

  if (!dept) notFound();

  const villes = villesOfDepartement(dept.code);
  const formations = await formationsDuDepartement(dept.code, { lat: dept.lat, lng: dept.lng });
  const prix = fourchettePrix(formations);
  const dansLeDept = formations.filter((f) => f.memeVille).length;

  const faq = STAGE_DEPT_FAQ(dept.nom, dept.code);
  const path = `/stages/departement/${dept.slug}`;

  const jsonLd = [
    webPageJsonLd({
      name: `Stage de récupération de points dans le ${dept.nom} (${dept.code})`,
      description: `Centres agréés et sessions de stage de récupération de points dans le ${dept.nom}.`,
      path,
      dateModifiedISO: new Date().toISOString(),
    }),
    breadcrumbJsonLd([
      { name: "Accueil", url: SITE_URL },
      { name: "Stages par ville", url: `${SITE_URL}/stages` },
      { name: `${dept.nom} (${dept.code})`, url: `${SITE_URL}${path}` },
    ]),
    serviceJsonLd({
      departement: { code: dept.code, nom: dept.nom },
      url: path,
      geo: { lat: dept.lat, lng: dept.lng, rayonKm: 60 },
      ...(prix ? { averagePrice: prix } : {}),
    }),
    howToJsonLd({
      name: `Récupérer 4 points sur son permis dans le ${dept.nom}`,
      description: `Les 5 étapes pour suivre un stage de sensibilisation à la sécurité routière dans le ${dept.nom}.`,
      steps: STAGE_STEPS,
      estimatedCost: prix ?? { min: 200, max: 300 },
    }),
    faqJsonLd(faq),
    ...(villes.length > 0
      ? [
          itemListJsonLd({
            name: `Villes du ${dept.nom} couvertes`,
            items: villes.map((v) => ({
              name: `Stage de récupération de points à ${v.nom}`,
              url: `/stages/${v.slug}`,
            })),
          }),
        ]
      : []),
  ];

  return (
    <>
      <JsonLd id={`ld-dept-${dept.slug}`} data={jsonLd} />
      <Header />
      <main className="min-h-screen bg-brand-bg">
        <section className="bg-navy-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <Link href="/" className="transition-colors hover:text-white">Accueil</Link>
              <span aria-hidden>/</span>
              <Link href="/stages" className="transition-colors hover:text-white">Stages par ville</Link>
              <span aria-hidden>/</span>
              <span className="text-white">{dept.nom} ({dept.code})</span>
            </nav>

            <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Stage de récupération de points dans le {dept.nom} ({dept.code})
            </h1>

            <p className="max-w-3xl text-lg text-gray-300">
              Dans le {dept.nom}, les stages de récupération de points sont dispensés par des
              centres agréés par le préfet, dont la préfecture siège à {dept.prefecture}. Le
              stage dure 2 jours (14 heures) et restitue{" "}
              <strong className="text-white">4 points</strong>, crédités le lendemain du second
              jour, pour un tarif généralement compris entre 200 € et 300 €.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2 text-blue-400">
                <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                {dept.region}
              </span>
              <span className="text-gray-600" aria-hidden>|</span>
              <span className="inline-flex items-center gap-2 text-gray-300">
                <FontAwesomeIcon icon={faCalendarDays} className="text-xs" />
                {formations.length === 0
                  ? "Aucune session programmée"
                  : `${formations.length} session${formations.length > 1 ? "s" : ""} réservable${formations.length > 1 ? "s" : ""}`}
                {dansLeDept > 0 && ` — dont ${dansLeDept} dans le département`}
              </span>
              <span className="text-gray-600" aria-hidden>|</span>
              <span className="inline-flex items-center gap-2 text-gray-300">
                <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                Agrément préfectoral vérifié
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-14 px-6 py-12">
          <FormationsList formations={formations} lieu={`dans le ${dept.nom}`} />

          <FaitsCles lieu={`dans le ${dept.nom}`} />

          <section aria-labelledby="contexte-dept">
            <h2 id="contexte-dept" className="mb-4 font-display text-2xl font-bold text-gray-900">
              L&apos;agrément préfectoral dans le {dept.nom}
            </h2>
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
              <p>
                Chaque centre de sensibilisation à la sécurité routière exerçant dans le{" "}
                {dept.nom} détient un agrément nominatif délivré par la préfecture de{" "}
                {dept.prefecture}, renouvelable et assorti d&apos;un numéro. C&apos;est cet
                agrément — et lui seul — qui donne au stage sa valeur juridique au regard de
                l&apos;article R223-5 du Code de la route.
              </p>
              <p>
                BYS Formation Permis contrôle l&apos;agrément, l&apos;assurance responsabilité
                civile professionnelle et les pièces administratives de chaque centre avant sa
                mise en ligne. Un centre dont l&apos;agrément arrive à expiration est retiré de
                la marketplace tant que le renouvellement n&apos;est pas justifié.
              </p>
              <p>
                Le stage restant valable sur tout le territoire, les sessions ci-dessus incluent
                les départements limitrophes lorsque l&apos;offre locale est réduite —
                souvent à moins d&apos;une heure de route, et parfois sur des dates plus proches.
              </p>
            </div>
          </section>

          <EtapesStage lieu={`dans le ${dept.nom}`} />

          <BaremeRetraits />

          <Definitions />

          <FaqSection items={faq} titre={`Questions fréquentes — ${dept.nom} (${dept.code})`} />

          <MaillageGeo
            villes={villes}
            titre={`Stages de récupération de points par ville dans le ${dept.nom}`}
          />

          <p className="text-sm text-gray-500">
            <Link href="/stages" className="text-blue-600 hover:underline">
              ← Voir tous les départements et toutes les villes
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
