import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";
import {
  BaremeRetraits,
  Definitions,
  EtapesStage,
  FaitsCles,
  FaqSection,
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
import { HOME_FAQ, STAGE_STEPS } from "@/lib/seo-content";
import { departementsByRegion, topVilles, VILLES } from "@/lib/seo/geo-data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export const revalidate = 86400;

const TOP_VILLES = topVilles(60);

export const metadata: Metadata = pageMetadata({
  title: "Stage de récupération de points par ville et par département",
  description:
    "Trouvez un stage de récupération de points partout en France : accès direct par ville et par département, centres agréés préfecture, 4 points récupérés en 2 jours.",
  path: "/stages",
  keywords: [
    "stage récupération de points",
    "stage récupération points par ville",
    "stage points département",
    "centre agréé récupération points France",
    "stage sensibilisation sécurité routière",
    "récupérer 4 points permis",
  ],
});

export default function StagesIndexPage() {
  const regions = departementsByRegion();

  const jsonLd = [
    webPageJsonLd({
      name: "Stage de récupération de points par ville et par département",
      description:
        "Répertoire national des stages de récupération de points : accès par ville et par département.",
      path: "/stages",
      dateModifiedISO: new Date().toISOString(),
    }),
    breadcrumbJsonLd([
      { name: "Accueil", url: SITE_URL },
      { name: "Stages par ville", url: `${SITE_URL}/stages` },
    ]),
    serviceJsonLd({ averagePrice: { min: 200, max: 300 }, url: "/stages" }),
    howToJsonLd({
      name: "Récupérer 4 points sur son permis de conduire",
      description:
        "Les 5 étapes pour suivre un stage de sensibilisation à la sécurité routière agréé et récupérer 4 points.",
      steps: STAGE_STEPS,
      estimatedCost: { min: 200, max: 300 },
    }),
    itemListJsonLd({
      name: "Stages de récupération de points par ville",
      items: TOP_VILLES.map((v) => ({
        name: `Stage de récupération de points à ${v.nom}`,
        url: `/stages/${v.slug}`,
      })),
    }),
    faqJsonLd(HOME_FAQ),
  ];

  return (
    <>
      <JsonLd id="ld-stages-index" data={jsonLd} />
      <Header />
      <main className="min-h-screen bg-brand-bg">
        <section className="bg-brand-navy py-16 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-2 text-sm text-blue-100/70">
              <Link href="/" className="transition-colors hover:text-white">Accueil</Link>
              <span aria-hidden>/</span>
              <span className="text-white">Stages par ville</span>
            </nav>
            <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Stage de récupération de points : toutes les villes et départements
            </h1>
            <p className="max-w-3xl text-lg text-blue-100/85">
              Le stage de sensibilisation à la sécurité routière permet de récupérer{" "}
              <strong className="text-white">4 points</strong> en 2 jours (14 heures), dans un
              centre agréé par la préfecture. Un stage suivi dans n&apos;importe quel département
              est valable partout en France : choisissez le centre le plus pratique pour vous.
            </p>
            <Link
              href="/recherche"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
              Rechercher une date près de chez moi
            </Link>
          </div>
        </section>

        <div className="tricolore-rule" aria-hidden="true" />
        <div className="relative overflow-hidden bg-section-tint-reverse">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-dots-blue mask-fade-radial opacity-60" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl space-y-14 px-6 py-12">
            {/* Villes */}
            <section aria-labelledby="villes">
              <h2 id="villes" className="heading-accent mb-2 font-display text-2xl font-bold text-gray-900">
                Les {TOP_VILLES.length} villes les plus recherchées
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                {VILLES.length} communes couvertes au total — chaque page affiche les sessions
                réservables sur place puis, par ordre de distance, celles des communes voisines.
              </p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {TOP_VILLES.map((v) => (
                  <li key={v.slug}>
                    <Link
                      href={`/stages/${v.slug}`}
                      className="chip-link group flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                    >
                      <FontAwesomeIcon icon={faLocationDot} className="text-xs text-blue-400 group-hover:text-blue-600" />
                      <span className="truncate">{v.nom}</span>
                      <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{v.dept}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Départements par région */}
            <section aria-labelledby="departements">
              <h2 id="departements" className="heading-accent mb-6 font-display text-2xl font-bold text-gray-900">
                Tous les départements
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {regions.map(({ region, departements }) => (
                  <div key={region} className="card-lift card-accent-top p-5">
                    <h3 className="mb-3 mt-1 text-sm font-bold uppercase tracking-wide text-blue-900">
                      {region}
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {departements.map((d) => (
                        <li key={d.code}>
                          <Link
                            href={`/stages/departement/${d.slug}`}
                            className="chip-link inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-1.5 text-sm text-gray-700 hover:border-blue-300 hover:bg-white hover:text-blue-700"
                          >
                            <span className="font-mono text-xs font-semibold text-blue-600">{d.code}</span>
                            {d.nom}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <FaitsCles lieu="France" />

            <EtapesStage lieu="proximité de chez vous" />

            <BaremeRetraits />

            <Definitions />

            <FaqSection items={HOME_FAQ} titre="Questions fréquentes sur les stages de récupération de points" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
