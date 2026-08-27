/**
 * Compte à rebours avant le prochain lot d'une campagne.
 *
 * Logique volontairement pure et sans dépendance serveur : l'écran d'admin est
 * un composant client, il ne peut pas importer `campaign.ts` (qui tire Prisma
 * et Resend dans le bundle). La cadence elle-même reste côté serveur et
 * transite par l'API — ici on ne fait que du calcul.
 */

/** Le strict nécessaire au calcul : le reste de la campagne n'intervient pas. */
export interface CampagneCadence {
  statut: string;
  /** Date ISO du dernier lot réellement expédié, `null` si aucun. */
  dernierEnvoiAt: string | null;
}

/**
 * Millisecondes restantes avant le prochain lot automatique. 0 = plus d'attente.
 *
 * Trois cas rendent l'attente nulle :
 *   - la campagne n'est pas en cours d'envoi, donc le cron ne la traite pas ;
 *   - aucun lot n'est encore parti, il n'y a donc rien à espacer ;
 *   - `maintenant` vaut 0, c'est-à-dire que l'horloge du navigateur n'a pas
 *     encore démarré — mieux vaut ne rien afficher qu'un compte à rebours faux
 *     le temps du premier rendu.
 */
export function attenteRestante(
  campagne: CampagneCadence,
  maintenant: number,
  cadenceMinutes: number,
): number {
  if (campagne.statut !== "EN_COURS" || !campagne.dernierEnvoiAt || maintenant === 0) return 0;

  const dernier = new Date(campagne.dernierEnvoiAt).getTime();
  // Une date illisible ne doit pas produire un « NaN:NaN » à l'écran.
  if (Number.isNaN(dernier)) return 0;

  return Math.max(0, dernier + cadenceMinutes * 60_000 - maintenant);
}

/** « 4:07 » — lisible d'un coup d'œil, contrairement à un nombre de secondes. */
export function formatAttente(ms: number): string {
  const secondes = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, "0")}`;
}
