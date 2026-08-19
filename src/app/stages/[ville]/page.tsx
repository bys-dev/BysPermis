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
import { pageMetadata, stageCityBreadcrumb } from "@/lib/seo";
import { STAGE_CITY_FAQ, STAGE_STEPS } from "@/lib/seo-content";
import {
  getDepartement,
  getVille,
  VILLES,
  villesProches,
} from "@/lib/seo/geo-data";
import { formationsAutourDe, fourchettePrix } from "@/lib/seo/stages-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faShieldHalved, faCalendarDays } from "@fortawesome/free-solid-svg-icons";

interface Props {
  params: Promise<{ ville: string }>;
}

export const revalidate = 3600;

/**
 * `dynamicParams = false` fait rejeter par le routeur tout slug absent de
 * `generateStaticParams`, avec un vrai 404 émis avant tout rendu.
 *
 * C'est volontairement plus strict qu'un `notFound()` dans le corps de la
 * page : une fois le shell HTML streamé, le statut est figé à 200 et un
 * `notFound()` ne produit plus qu'un soft 404 — page d'erreur affichée, code
 * 200 renvoyé, donc URL indexable. Comme la liste des communes valides est
 * connue statiquement, autant la faire appliquer par le routeur.
 *
 * Corollaire : les 240 communes sont prérendues au build, et non plus les 30
 * premières. Le surcoût est contenu par la mémoïsation de la requête dans
 * `stages-query.ts`, qui ramène ces 240 pages à une seule interrogation.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return VILLES.map((v) => ({ ville: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville: slug } = await params;
  const ville = getVille(slug);

  if (!ville) {
    return { title: "Ville introuvable", robots: { index: false, follow: false } };
  }

  const dept = getDepartement(ville.dept);

  return pageMetadata({
    title: `Stage de récupération de points à ${ville.nom} (${ville.dept}) — Centres agréés`,
    // Le nom du département n'est ajouté que s'il apporte une information :
    // « à Paris (Paris) » ou « à Nice (Alpes-Maritimes) » — seul le second aide.
    description: `Réservez votre stage de récupération de points à ${ville.nom}${
      dept && dept.nom !== ville.nom ? ` (${dept.nom})` : ""
    } : centres agréés préfecture, 4 points en 2 jours, prix affiché tout compris et places disponibles en temps réel.`,
    path: `/stages/${ville.slug}`,
    keywords: [
      `stage récupération points ${ville.nom}`,
      `stage récupération de points ${ville.nom}`,
      `stage permis ${ville.nom}`,
      `stage points ${ville.cp}`,
      `stage 48N ${ville.nom}`,
      `stage sensibilisation sécurité routière ${ville.nom}`,
      `centre agréé récupération points ${ville.nom}`,
      ...(dept ? [`stage récupération points ${dept.nom}`] : []),
    ],
  });
}

export default async function StagesVillePage({ params }: Props) {
  const { ville: slug } = await params;
  const ville = getVille(slug);

  // Une commune hors référentiel ne doit pas produire une page indexable :
  // ce serait une page sans contenu propre, que Google classe en soft 404.
  if (!ville) notFound();

  const dept = getDepartement(ville.dept);
  const formations = await formationsAutourDe(ville);
  const prix = fourchettePrix(formations);
  const proches = villesProches(ville);
  const surPlace = formations.filter((f) => f.memeVille).length;

  const faq = STAGE_CITY_FAQ(ville.nom);
  const path = `/stages/${ville.slug}`;

  const jsonLd = [
    webPageJsonLd({
      name: `Stage de récupération de points à ${ville.nom}`,
      description: `Centres agréés et sessions de stage de récupération de points à ${ville.nom} et alentours.`,
      path,
      dateModifiedISO: new Date().toISOString(),
    }),
    breadcrumbJsonLd(stageCityBreadcrumb(ville.nom, ville.slug)),
    serviceJsonLd({
      city: ville.nom,
      url: path,
      geo: { lat: ville.lat, lng: ville.lng, rayonKm: 50 },
      ...(prix ? { averagePrice: prix } : {}),
    }),
    howToJsonLd({
      name: `Récupérer 4 points sur son permis à ${ville.nom}`,
      description: `Les 5 étapes pour suivre un stage de sensibilisation à la sécurité routière à ${ville.nom} et récupérer 4 points.`,
      steps: STAGE_STEPS,
      estimatedCost: prix ?? { min: 200, max: 300 },
    }),
    faqJsonLd(faq),
    ...(formations.length > 0
      ? [
          itemListJsonLd({
            name: `Stages de récupération de points à ${ville.nom} et alentours`,
            items: formations.map((f) => ({
              name: `${f.titre} — ${f.centre.nom}`,
              url: `/formations/${f.slug}`,
              description: `${f.centre.adresse}, ${f.centre.codePostal} ${f.centre.ville} — ${f.prix} €`,
            })),
          }),
        ]
      : []),
  ];

  return (
    <>
      <JsonLd id={`ld-stages-${ville.slug}`} data={jsonLd} />
      <Header />
      <main className="min-h-screen bg-brand-bg">
        {/* Hero */}
        <section className="bg-navy-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
              <Link href="/" className="transition-colors hover:text-white">Accueil</Link>
              <span aria-hidden>/</span>
              <Link href="/stages" className="transition-colors hover:text-white">Stages par ville</Link>
              {dept && (
                <>
                  <span aria-hidden>/</span>
                  <Link
                    href={`/stages/departement/${dept.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {dept.nom}
                  </Link>
                </>
              )}
              <span aria-hidden>/</span>
              <span className="text-white">{ville.nom}</span>
            </nav>

            <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Stage de récupération de points à {ville.nom}
            </h1>

            {/* Réponse directe : c'est ce paragraphe que les moteurs de réponse
                reprennent en extrait, il doit tenir seul hors contexte. */}
            <p className="max-w-3xl text-lg text-gray-300">
              Un stage de récupération de points à {ville.nom} dure 2 jours consécutifs
              (14 heures) et permet de récupérer <strong className="text-white">4 points</strong>{" "}
              sur votre permis de conduire, crédités le lendemain du second jour. Il est
              organisé par un centre agréé par le préfet {dept ? `du ${dept.nom}` : "du département"}{" "}
              et coûte généralement entre 200 € et 300 €.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2 text-blue-400">
                <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                {ville.nom} ({ville.cp})
              </span>
              <span className="text-gray-600" aria-hidden>|</span>
              <span className="inline-flex items-center gap-2 text-gray-300">
                <FontAwesomeIcon icon={faCalendarDays} className="text-xs" />
                {formations.length === 0
                  ? "Aucune session programmée"
                  : `${formations.length} session${formations.length > 1 ? "s" : ""} réservable${formations.length > 1 ? "s" : ""}`}
                {surPlace > 0 && ` — dont ${surPlace} à ${ville.nom}`}
              </span>
              <span className="text-gray-600" aria-hidden>|</span>
              <span className="inline-flex items-center gap-2 text-gray-300">
                <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                Centres agréés préfecture
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-14 px-6 py-12">
          <FormationsList formations={formations} lieu={ville.nom} />

          <FaitsCles lieu={ville.nom} />

          <EtapesStage lieu={ville.nom} />

          {/* Contenu éditorial propre à la ville */}
          <section aria-labelledby="contexte-local">
            <h2 id="contexte-local" className="mb-4 font-display text-2xl font-bold text-gray-900">
              Faire son stage à {ville.nom} : ce qu&apos;il faut savoir
            </h2>
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
              <p>
                Les centres de sensibilisation à la sécurité routière de {ville.nom} sont agréés
                individuellement par le préfet {dept ? `du ${dept.nom} (${dept.code})` : "du département"}.
                Cet agrément est la seule condition pour qu&apos;un stage ouvre droit à la
                récupération de 4 points : ni le label du centre, ni son ancienneté, ni son
                prix n&apos;entrent en compte.
              </p>
              <p>
                L&apos;agrément est départemental, la récupération de points est nationale.
                Autrement dit, vous n&apos;êtes pas tenu de suivre votre stage à {ville.nom} parce
                que vous y résidez, ni parce que l&apos;infraction y a été commise : un stage
                effectué dans n&apos;importe quel centre agréé de France produit exactement le
                même effet sur votre solde de points.
              </p>
              <p>
                {prix ? (
                  <>
                    Les sessions actuellement réservables autour de {ville.nom} se situent entre{" "}
                    <strong>{prix.min} €</strong> et <strong>{prix.max} €</strong>. Le prix
                    affiché est le prix final : convocation, support pédagogique et attestation
                    de suivi sont inclus, sans frais de dossier ajoutés au paiement.
                  </>
                ) : (
                  <>
                    Le tarif d&apos;un stage est libre : chaque centre fixe le sien, dans une
                    fourchette généralement comprise entre 200 € et 300 €. Le prix affiché sur
                    BYS Formation Permis est le prix final, convocation et attestation de suivi
                    comprises.
                  </>
                )}
              </p>
              <p>
                Attention au calendrier si vous avez reçu une lettre 48N : le stage doit être
                effectué dans les 4 mois suivant sa réception. Les places partant vite sur les
                périodes chargées, réservez plutôt 2 à 3 semaines à l&apos;avance.
              </p>
            </div>
          </section>

          <BaremeRetraits />

          <Definitions />

          <FaqSection items={faq} titre={`Questions fréquentes sur les stages à ${ville.nom}`} />

          <MaillageGeo
            villes={proches}
            departement={dept}
            titre={`Stages de récupération de points près de ${ville.nom}`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
