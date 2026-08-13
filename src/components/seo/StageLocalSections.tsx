/**
 * Blocs de contenu partagés par les pages SEO locales (ville, département).
 *
 * Server Components : aucun JavaScript n'est envoyé au client, tout le texte
 * est présent dans le HTML initial — condition nécessaire pour être lu aussi
 * bien par Googlebot que par les crawlers des moteurs génératifs, dont
 * plusieurs n'exécutent pas JavaScript.
 */

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCalendarDays,
  faClock,
  faEuroSign,
  faLocationDot,
  faMagnifyingGlass,
  faShieldHalved,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import { formatPlacesDisponibles, getPlacesToneClass } from "@/lib/utils";
import type { FormationProche } from "@/lib/seo/stages-query";
import {
  BAREME_RETRAITS,
  STAGE_DEFINITIONS,
  STAGE_FACTS,
  STAGE_STEPS,
  type FaqItem,
} from "@/lib/seo-content";
import type { Ville, Departement } from "@/lib/seo/geo-data";

// ─── Liste des sessions ────────────────────────────────────────────

export function FormationsList({
  formations,
  lieu,
}: {
  formations: FormationProche[];
  lieu: string;
}) {
  if (formations.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="mb-4 text-4xl text-gray-300" />
        <h2 className="mb-2 text-xl font-semibold text-gray-700">
          Aucune session programmée à {lieu} pour le moment
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-gray-500">
          Un stage suivi dans n&apos;importe quel centre agréé de France est valable
          partout : élargissez la recherche pour trouver une date proche.
        </p>
        <Link
          href="/recherche"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
          Voir toutes les sessions
        </Link>
      </div>
    );
  }

  const surPlace = formations.filter((f) => f.memeVille);
  const alentours = formations.filter((f) => !f.memeVille);

  return (
    <div className="space-y-10">
      {surPlace.length > 0 && (
        <div>
          <h2 className="mb-6 font-display text-2xl font-bold text-gray-900">
            {surPlace.length} centre{surPlace.length > 1 ? "s" : ""} agréé
            {surPlace.length > 1 ? "s" : ""} à {lieu}
          </h2>
          <div className="grid gap-6">
            {surPlace.map((f) => (
              <FormationCard key={f.id} formation={f} />
            ))}
          </div>
        </div>
      )}

      {alentours.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-2xl font-bold text-gray-900">
            {surPlace.length > 0 ? `Autres sessions près de ${lieu}` : `Sessions les plus proches de ${lieu}`}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Classées par distance. Un stage effectué dans un autre département reste
            valable dans toute la France.
          </p>
          <div className="grid gap-6">
            {alentours.map((f) => (
              <FormationCard key={f.id} formation={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FormationCard({ formation: f }: { formation: FormationProche }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" /> Agréé préfecture
            </span>
            {f.distanceKm !== null && !f.memeVille && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                <FontAwesomeIcon icon={faLocationDot} className="text-[9px]" />
                à {f.distanceKm} km
              </span>
            )}
          </div>

          <Link href={`/formations/${f.slug}`} className="transition-colors hover:text-blue-600">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">{f.titre}</h3>
          </Link>
          <p className="mb-3 text-sm text-gray-500">
            <Link href={`/centres/${f.centre.slug}`} className="hover:underline">
              {f.centre.nom}
            </Link>{" "}
            — {f.centre.adresse}, {f.centre.codePostal} {f.centre.ville}
          </p>
          <p className="line-clamp-2 text-sm text-gray-600">{f.description}</p>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="text-xs text-gray-400" />
              {f.duree}
            </span>
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faEuroSign} className="text-xs text-gray-400" />
              À partir de {f.prix} €
            </span>
          </div>

          {f.sessions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {f.sessions.map((sess) => (
                <Link
                  key={sess.id}
                  href={`/reserver/${sess.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <FontAwesomeIcon icon={faCalendarDays} className="text-[10px]" />
                  {new Date(sess.dateDebut).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                  <span
                    className={`inline-flex items-center gap-1 ${getPlacesToneClass(sess.placesRestantes)}`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="text-[9px]" />
                    {formatPlacesDisponibles(sess.placesRestantes)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{f.prix} €</p>
            <p className="text-xs text-gray-500">TVA incluse</p>
          </div>
          <Link
            href={`/formations/${f.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Voir les dates
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Faits clés ────────────────────────────────────────────────────

/**
 * Tableau de synthèse placé haut dans la page. Sa forme tabulaire et la
 * présence de la source légale en font le bloc le plus repris tel quel par les
 * moteurs de réponse.
 */
export function FaitsCles({ lieu }: { lieu: string }) {
  return (
    <section aria-labelledby="faits-cles">
      <h2 id="faits-cles" className="mb-4 font-display text-2xl font-bold text-gray-900">
        L&apos;essentiel du stage de récupération de points à {lieu}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Caractéristiques réglementaires d&apos;un stage de récupération de points
          </caption>
          <tbody className="divide-y divide-gray-100">
            {STAGE_FACTS.map((f) => (
              <tr key={f.label}>
                <th scope="row" className="w-56 px-5 py-3 text-left font-medium text-gray-500">
                  {f.label}
                </th>
                <td className="px-5 py-3 text-gray-900">
                  {f.value}
                  {f.source && (
                    <span className="ml-2 text-xs text-gray-400">({f.source})</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Étapes ────────────────────────────────────────────────────────

export function EtapesStage({ lieu }: { lieu: string }) {
  return (
    <section aria-labelledby="etapes">
      <h2 id="etapes" className="mb-4 font-display text-2xl font-bold text-gray-900">
        Comment récupérer 4 points à {lieu}, étape par étape
      </h2>
      <ol className="space-y-4">
        {STAGE_STEPS.map((step, i) => (
          <li key={step.name} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">{step.name}</h3>
              <p className="text-sm text-gray-600">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Barème ────────────────────────────────────────────────────────

export function BaremeRetraits() {
  return (
    <section aria-labelledby="bareme">
      <h2 id="bareme" className="mb-4 font-display text-2xl font-bold text-gray-900">
        Combien de points perd-on selon l&apos;infraction ?
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Barème des retraits de points par infraction au Code de la route
          </caption>
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Infraction</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Points retirés</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {BAREME_RETRAITS.map((b) => (
              <tr key={b.infraction}>
                <td className="px-5 py-3 text-gray-700">{b.infraction}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  −{b.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Un stage restitue 4 points au maximum, sans jamais dépasser le plafond de votre
        permis (12 points, ou le plafond en vigueur pour un permis probatoire).
      </p>
    </section>
  );
}

// ─── Définitions ───────────────────────────────────────────────────

export function Definitions() {
  return (
    <section aria-labelledby="definitions">
      <h2 id="definitions" className="mb-4 font-display text-2xl font-bold text-gray-900">
        Les termes à connaître
      </h2>
      <dl className="grid gap-4 md:grid-cols-2">
        {STAGE_DEFINITIONS.map((d) => (
          <div key={d.terme} className="rounded-xl border border-gray-200 bg-white p-5">
            <dt className="mb-1 font-semibold text-gray-900">{d.terme}</dt>
            <dd className="text-sm text-gray-600">{d.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────

export function FaqSection({ items, titre }: { items: FaqItem[]; titre: string }) {
  return (
    <section aria-labelledby="faq">
      <h2 id="faq" className="mb-4 font-display text-2xl font-bold text-gray-900">
        {titre}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-gray-200 bg-white p-5 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:content-none">
              <h3 className="inline">{item.question}</h3>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── Maillage interne ──────────────────────────────────────────────

export function MaillageGeo({
  villes,
  departement,
  titre,
}: {
  villes: Ville[];
  departement?: Departement;
  titre: string;
}) {
  if (villes.length === 0 && !departement) return null;

  return (
    <section aria-labelledby="maillage">
      <h2 id="maillage" className="mb-4 font-display text-2xl font-bold text-gray-900">
        {titre}
      </h2>
      <div className="flex flex-wrap gap-2">
        {departement && (
          <Link
            href={`/stages/departement/${departement.slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
            Tout le {departement.nom} ({departement.code})
          </Link>
        )}
        {villes.map((v) => (
          <Link
            key={v.slug}
            href={`/stages/${v.slug}`}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Stage à {v.nom}
          </Link>
        ))}
      </div>
    </section>
  );
}
