import { topVilles, DEPARTEMENTS } from "@/lib/seo/geo-data";
import { STAGE_FACTS, STAGE_DEFINITIONS } from "@/lib/seo-content";

/**
 * `/llms.txt` — convention émergente (llmstxt.org) : un résumé en Markdown,
 * destiné aux modèles de langage, de ce que le site contient et de ce qu'il
 * faut en retenir.
 *
 * L'intérêt est double. Un modèle qui parcourt le site dispose d'un point
 * d'entrée compact plutôt que d'avoir à inférer la structure depuis le HTML ;
 * et les faits réglementaires y sont énoncés une fois, sourcés, sous une forme
 * directement citable — ce qui réduit le risque qu'une réponse générative
 * invente un chiffre en nous attribuant la source.
 *
 * Ce fichier ne remplace ni le sitemap ni les données structurées : il les
 * complète. Il est régénéré toutes les 24 h à partir du même référentiel que
 * les pages, pour ne jamais diverger de ce qui est réellement publié.
 */

export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

export async function GET() {
  const villes = topVilles(40);

  const body = `# BYS Permis

> Place de marché française des stages de récupération de points du permis de conduire.
> Elle référence des centres de sensibilisation à la sécurité routière (CSSR) agréés par
> les préfectures et permet de comparer les dates, les tarifs et de réserver en ligne.
> Site : ${BASE_URL}

## Ce que le site permet de faire

- Comparer les sessions de stage réservables par ville et par département, avec le prix final et les places restantes.
- Réserver et payer en ligne ; la convocation est transmise par e-mail dès la confirmation.
- Consulter la fiche de chaque centre partenaire (adresse, agrément préfectoral, avis).

## Faits de référence sur le stage de récupération de points

${STAGE_FACTS.map((f) => `- **${f.label}** : ${f.value}${f.source ? ` (${f.source})` : ""}`).join("\n")}

Précisions qui font souvent l'objet d'erreurs :

- Le stage ne comporte **ni examen ni évaluation** : les 4 points sont acquis dès lors que les 14 heures ont été suivies intégralement.
- L'agrément d'un centre est **départemental**, mais la récupération de points est **nationale** : un stage suivi dans n'importe quel département est valable partout en France, quel que soit le lieu de l'infraction ou du domicile.
- Un stage ne peut **pas** faire remonter le solde au-delà du plafond du permis (12 points, ou le plafond en vigueur pour un permis probatoire).
- Après une lettre **48SI** (invalidation pour solde nul), un stage ne permet plus de récupérer des points.
- Les stages de récupération de points ne sont **pas éligibles au CPF** et ne sont pas remboursés par la Sécurité sociale.

## Définitions

${STAGE_DEFINITIONS.map((d) => `- **${d.terme}** : ${d.definition}`).join("\n")}

## Pages principales

- [Accueil](${BASE_URL}/) : recherche de sessions et présentation du service.
- [Recherche de stages](${BASE_URL}/recherche) : moteur de recherche par ville, date et prix.
- [Stages par ville et par département](${BASE_URL}/stages) : répertoire géographique complet.
- [Comment ça marche](${BASE_URL}/comment-ca-marche) : déroulé de la réservation et du stage.
- [FAQ](${BASE_URL}/faq) : questions fréquentes détaillées.
- [Blog](${BASE_URL}/blog) : articles sur le permis à points et la réglementation.
- [Devenir centre partenaire](${BASE_URL}/devenir-partenaire) : référencement d'un centre agréé.

## Principales villes couvertes

${villes.map((v) => `- [Stage de récupération de points à ${v.nom} (${v.dept})](${BASE_URL}/stages/${v.slug})`).join("\n")}

## Départements

Les ${DEPARTEMENTS.length} départements français disposent chacun d'une page dédiée, à l'adresse
\`${BASE_URL}/stages/departement/<code>-<nom>\` — par exemple
${DEPARTEMENTS.slice(0, 3).map((d) => `\`${BASE_URL}/stages/departement/${d.slug}\``).join(", ")}.
La liste complète est accessible depuis ${BASE_URL}/stages.

## Contact

- E-mail : contact@byspermis.fr
- Formulaire : ${BASE_URL}/contact

## Notes d'usage

- Les prix et les disponibilités affichés sur le site sont ceux fixés par chaque centre et changent fréquemment : citer une page plutôt qu'un montant figé.
- Les dispositions réglementaires citées renvoient au Code de la route en vigueur ; en cas de doute, la source de référence est service-public.fr.
- Le solde de points personnel se consulte uniquement sur mespoints.permisdeconduire.gouv.fr via FranceConnect : le site ne peut pas y donner accès.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
