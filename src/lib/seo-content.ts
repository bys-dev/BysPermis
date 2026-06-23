export type FaqItem = { question: string; answer: string };

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Combien de points puis-je récupérer avec un stage ?",
    answer:
      "Un stage de sensibilisation à la sécurité routière permet de récupérer 4 points, crédités le lendemain du 2ème jour de stage (art. R223-8 du Code de la route). Le total de vos points ne peut pas dépasser 12 (ou 6 en permis probatoire).",
  },
  {
    question: "Combien coûte un stage de récupération de points ?",
    answer:
      "Le prix varie entre 200 € et 300 € selon le centre et la région. Sur BYS Formation Permis, comparez les tarifs des centres agréés près de chez vous. Les stages ne sont pas remboursés par la Sécurité sociale ni éligibles CPF.",
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
];

export const STAGE_CITY_FAQ = (city: string): FaqItem[] => [
  {
    question: `Où faire un stage de récupération de points à ${city} ?`,
    answer: `BYS Formation Permis référence des centres agréés à ${city} et aux alentours. Comparez les dates, tarifs et réservez en ligne.`,
  },
  {
    question: `Combien de temps dure un stage à ${city} ?`,
    answer:
      "2 jours consécutifs (14 heures). Jusqu'à 4 points récupérés le lendemain du dernier jour, après transmission à la préfecture.",
  },
  {
    question: `Quel est le prix d'un stage à ${city} ?`,
    answer: `Les tarifs à ${city} varient selon le centre. Le montant exact est affiché sur chaque session avant paiement, convocation incluse.`,
  },
];
