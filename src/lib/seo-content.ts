/**
 * Contenu éditorial réutilisé par les pages SEO et les blocs JSON-LD.
 *
 * Deux publics, un seul corpus :
 *  - les moteurs classiques, qui indexent le texte rendu ;
 *  - les moteurs génératifs (AI Overviews, Perplexity, ChatGPT Search), qui
 *    reprennent des réponses courtes, chiffrées et rattachables à une source.
 *
 * D'où le parti pris : des faits atomiques, sourcés par un article du Code de
 * la route quand il existe, plutôt que des paragraphes marketing. Un fait que
 * l'on ne peut pas sourcer ne figure pas ici.
 */

export type FaqItem = { question: string; answer: string };

// ─── Faits de référence ────────────────────────────────────────────

export interface StageFact {
  label: string;
  value: string;
  /** Référence légale ou administrative, affichée telle quelle. */
  source?: string;
}

/**
 * Le tableau de synthèse repris en haut des pages villes/départements.
 * Format volontairement tabulaire : c'est la forme la plus souvent extraite
 * par les moteurs de réponse.
 */
export const STAGE_FACTS: StageFact[] = [
  {
    label: "Points récupérés",
    value: "4 points maximum",
    source: "art. L223-6 du Code de la route",
  },
  {
    label: "Durée",
    value: "2 jours consécutifs, 14 heures",
    source: "art. R223-8 du Code de la route",
  },
  {
    label: "Prix constaté",
    value: "200 € à 300 € selon le centre et la région",
    source: "tarif libre, fixé par chaque centre",
  },
  {
    label: "Délai entre deux stages",
    value: "1 an à compter du dernier jour du stage précédent",
    source: "art. L223-6 du Code de la route",
  },
  {
    label: "Crédit des points",
    value: "Le lendemain du 2ᵉ jour de stage",
    source: "art. R223-8 du Code de la route",
  },
  {
    label: "Agrément",
    value: "Centre agréé par le préfet du département",
    source: "art. R223-5 du Code de la route",
  },
  {
    label: "Solde de points",
    value: "Consultable sur mespoints.permisdeconduire.gouv.fr via FranceConnect",
    source: "service public",
  },
];

/** Définitions courtes des termes que les internautes tapent tels quels. */
export const STAGE_DEFINITIONS: Array<{ terme: string; definition: string }> = [
  {
    terme: "Stage de récupération de points",
    definition:
      "Formation de 2 jours (14 heures) dispensée par un centre agréé par la préfecture, appelée officiellement « stage de sensibilisation à la sécurité routière ». Elle permet de récupérer jusqu'à 4 points sur le permis de conduire, sans examen ni évaluation.",
  },
  {
    terme: "Lettre 48N",
    definition:
      "Courrier adressé aux titulaires d'un permis probatoire ayant perdu 3 points ou plus lors d'une même infraction. Le stage devient obligatoire dans un délai de 4 mois ; il ouvre droit au remboursement de l'amende correspondante.",
  },
  {
    terme: "Lettre 48SI",
    definition:
      "Notification d'invalidation du permis pour solde de points nul. Un stage ne permet plus de récupérer des points à ce stade : il faut repasser le permis après le délai d'interdiction.",
  },
  {
    terme: "Stage volontaire",
    definition:
      "Stage effectué à l'initiative du conducteur, sans obligation, dès lors qu'il lui reste au moins 1 point et que le délai d'un an depuis son précédent stage est écoulé.",
  },
  {
    terme: "Permis probatoire",
    definition:
      "Permis délivré avec 6 points, majoré de 2 points par an sans infraction (3 points par an après conduite accompagnée), jusqu'à atteindre 12 points.",
  },
  {
    terme: "Centre agréé CSSR",
    definition:
      "Centre de sensibilisation à la sécurité routière titulaire d'un agrément préfectoral nominatif, seul habilité à organiser des stages ouvrant droit à récupération de points.",
  },
];

/** Étapes du parcours, réutilisées en JSON-LD `HowTo` et à l'écran. */
export const STAGE_STEPS: Array<{ name: string; text: string; url?: string }> = [
  {
    name: "Vérifier son solde de points",
    text: "Consultez votre solde sur mespoints.permisdeconduire.gouv.fr via FranceConnect. Il faut conserver au moins 1 point pour pouvoir suivre un stage de récupération.",
  },
  {
    name: "Choisir une session",
    text: "Comparez les centres agréés proches de chez vous : date, adresse, prix et places restantes sont affichés avant toute réservation.",
    url: "/recherche",
  },
  {
    name: "Réserver et payer en ligne",
    text: "La réservation est confirmée après paiement sécurisé. La convocation est transmise par e-mail immédiatement.",
  },
  {
    name: "Suivre les 2 jours de stage",
    text: "14 heures réparties sur 2 jours consécutifs, animées par un psychologue et un expert en sécurité routière. Présence obligatoire à l'intégralité du stage.",
  },
  {
    name: "Récupérer ses points",
    text: "Le centre transmet l'attestation de suivi au fichier national. Les 4 points sont crédités le lendemain du 2ᵉ jour de stage, dans la limite du plafond de votre permis.",
  },
];

/** Barème des retraits les plus fréquents — contenu très recherché. */
export const BAREME_RETRAITS: Array<{ infraction: string; points: number }> = [
  { infraction: "Excès de vitesse inférieur à 20 km/h", points: 1 },
  { infraction: "Excès de vitesse de 20 à moins de 30 km/h", points: 2 },
  { infraction: "Excès de vitesse de 30 à moins de 40 km/h", points: 3 },
  { infraction: "Excès de vitesse de 40 à moins de 50 km/h", points: 4 },
  { infraction: "Excès de vitesse de 50 km/h et plus", points: 6 },
  { infraction: "Téléphone tenu en main au volant", points: 3 },
  { infraction: "Non-port de la ceinture de sécurité", points: 3 },
  { infraction: "Non-respect d'un feu rouge ou d'un stop", points: 4 },
  { infraction: "Conduite avec un taux d'alcool de 0,5 à 0,8 g/l de sang", points: 6 },
  { infraction: "Conduite après usage de stupéfiants", points: 6 },
  { infraction: "Refus de priorité à un piéton", points: 6 },
  { infraction: "Circulation en sens interdit", points: 4 },
];

// ─── FAQ ───────────────────────────────────────────────────────────

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Combien de points puis-je récupérer avec un stage ?",
    answer:
      "Un stage de sensibilisation à la sécurité routière permet de récupérer 4 points, crédités le lendemain du 2ème jour de stage (art. R223-8 du Code de la route). Le total de vos points ne peut pas dépasser 12 (ou 6 en permis probatoire).",
  },
  {
    question: "Combien coûte un stage de récupération de points ?",
    answer:
      "Le prix varie entre 200 € et 300 € selon le centre et la région. Sur BYS Permis, comparez les tarifs des centres agréés près de chez vous. Les stages ne sont pas remboursés par la Sécurité sociale ni éligibles CPF.",
  },
  {
    question: "Quels documents dois-je apporter le jour du stage ?",
    answer:
      "Permis de conduire original, pièce d'identité en cours de validité et convocation reçue par e-mail (imprimée ou sur smartphone).",
  },
  {
    question: "Puis-je faire un stage avec un permis suspendu ?",
    answer:
      "Oui, une suspension administrative ou judiciaire ne vous empêche pas de suivre un stage. En revanche, si votre permis est invalidé (lettre 48SI), vous ne pouvez plus faire de stage.",
  },
  {
    question: "À quelle fréquence puis-je faire un stage ?",
    answer:
      "Un stage volontaire est possible 1 fois par an maximum (délai de 12 mois entre deux stages, art. L223-6 du Code de la route).",
  },
  {
    question: "Comment vérifier mon solde de points ?",
    answer:
      "Consultez mespoints.permisdeconduire.gouv.fr avec France Connect pour obtenir votre solde et l'historique de vos infractions.",
  },
  {
    question: "Combien de temps dure un stage de récupération de points ?",
    answer:
      "Le stage dure 14 heures réparties sur 2 jours consécutifs, généralement de 8h30 à 12h30 et de 13h30 à 17h30. La présence à l'intégralité des deux journées est obligatoire : une absence, même partielle, annule la récupération des points.",
  },
  {
    question: "Y a-t-il un examen à la fin du stage ?",
    answer:
      "Non. Le stage ne comporte ni examen ni évaluation. Les 4 points sont acquis dès lors que vous avez assisté aux 14 heures de formation.",
  },
  {
    question: "Quelle est la différence entre un stage volontaire et un stage obligatoire ?",
    answer:
      "Le stage volontaire est choisi librement pour reconstituer son capital de points, dans la limite d'un stage par an. Le stage obligatoire fait suite à une lettre 48N (permis probatoire, perte de 3 points ou plus) et doit être effectué dans les 4 mois ; il ouvre droit au remboursement de l'amende.",
  },
  {
    question: "Comment savoir si un centre est réellement agréé ?",
    answer:
      "Un centre agréé détient un numéro d'agrément délivré par le préfet de son département (art. R223-5 du Code de la route). Tous les centres référencés sur BYS Permis sont vérifiés : agrément, assurance et pièces administratives sont contrôlés avant mise en ligne.",
  },
];

export const STAGE_CITY_FAQ = (city: string): FaqItem[] => [
  {
    question: `Où faire un stage de récupération de points à ${city} ?`,
    answer: `BYS Permis référence des centres agréés à ${city} et aux alentours. Comparez les dates, tarifs et réservez en ligne.`,
  },
  {
    question: `Combien de temps dure un stage à ${city} ?`,
    answer:
      "2 jours consécutifs (14 heures). Jusqu'à 4 points récupérés le lendemain du dernier jour, après transmission à la préfecture.",
  },
  {
    question: `Quel est le prix d'un stage à ${city} ?`,
    answer: `Les tarifs à ${city} varient selon le centre, généralement entre 200 € et 300 €. Le montant exact est affiché sur chaque session avant paiement, convocation incluse.`,
  },
  {
    question: `Faut-il faire son stage à ${city} si l'infraction a eu lieu ailleurs ?`,
    answer: `Non. Vous pouvez suivre votre stage dans n'importe quel centre agréé de France, quel que soit le département où l'infraction a été commise ou celui de votre domicile. Un stage à ${city} est donc valable partout.`,
  },
  {
    question: `Combien de temps à l'avance réserver un stage à ${city} ?`,
    answer: `Les sessions affichent leurs places restantes en temps réel. Sur les périodes chargées, comptez 2 à 3 semaines d'avance ; en cas de lettre 48N, anticipez pour respecter le délai de 4 mois.`,
  },
  {
    question: `Les points sont-ils crédités plus vite selon le centre à ${city} ?`,
    answer:
      "Non. Le délai est identique partout : le centre transmet l'attestation de suivi et les points sont crédités le lendemain du 2ᵉ jour de stage, indépendamment du centre choisi.",
  },
];

export const STAGE_DEPT_FAQ = (dept: string, code: string): FaqItem[] => [
  {
    question: `Combien de centres agréés y a-t-il dans le ${dept} (${code}) ?`,
    answer: `Les centres de sensibilisation à la sécurité routière sont agréés individuellement par le préfet du ${dept}. BYS Permis affiche les centres partenaires du département ainsi que les sessions disponibles dans les départements limitrophes.`,
  },
  {
    question: `Un stage suivi dans le ${dept} est-il valable dans toute la France ?`,
    answer:
      "Oui. L'agrément préfectoral est départemental, mais la récupération de points qui en découle est nationale : le stage est valable quel que soit votre département de résidence.",
  },
  {
    question: `Quel est le prix moyen d'un stage dans le ${dept} ?`,
    answer:
      "Le tarif est libre et fixé par chaque centre : il se situe généralement entre 200 € et 300 €. Le prix affiché sur BYS Permis est le prix final, convocation et attestation comprises.",
  },
  {
    question: `Que faire s'il n'y a aucune session disponible dans le ${dept} ?`,
    answer: `Vous pouvez suivre votre stage dans n'importe quel département. La recherche par proximité affiche les sessions des départements voisins, souvent à moins d'une heure de route.`,
  },
];
