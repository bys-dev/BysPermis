/**
 * Catalogue de modèles d'email de prospection livrés avec la plateforme.
 *
 * Reprend le kit rédigé dans `prospection/emails-prospection.md`, mais sous une
 * forme exploitable par l'éditeur de campagne : les crochets à remplir à la main
 * (`[Nom du centre]`, `[Ville]`) deviennent des variables `{{nom}}` / `{{ville}}`
 * résolues à l'envoi pour chaque destinataire.
 *
 * Ce fichier n'est **pas** la source de vérité de l'application : il sert de
 * catalogue d'amorçage. Au premier chargement de la bibliothèque, ces modèles
 * sont copiés dans `ProspectEmailTemplate` (table `prospect_email_templates`),
 * où le staff les modifie, les duplique ou en crée d'autres librement. Le `slug`
 * permet de réinstaller un modèle de base sans dupliquer ceux déjà présents.
 *
 * Le module est volontairement sans dépendance serveur (pas de Prisma, pas de
 * `process.env` sensible) : il reste importable depuis un composant client.
 */

/**
 * Sous-ensemble du ciblage réellement utile à un modèle. Défini ici plutôt
 * qu'importé de `campaign.ts` : ce dernier tire Prisma et Resend, qui n'ont
 * rien à faire dans le bundle client de l'éditeur.
 */
export interface FiltreSuggere {
  statuts?: (
    | "NOUVEAU"
    | "A_CONTACTER"
    | "CONTACTE"
    | "RELANCE"
    | "INTERESSE"
    | "REFUSE"
  )[];
  exclureDejaContactes?: boolean;
}

export interface ModeleEmail {
  /** Identifiant stable du modèle de base — devient le `slug` en base. */
  id: string;
  /** Libellé court affiché sur la carte cliquable. */
  nom: string;
  /** À quel moment de la séquence ce modèle s'emploie. */
  moment: string;
  /** Une phrase : ce que le message cherche à obtenir. */
  objectif: string;
  /** Nom de campagne pré-rempli (le staff peut le changer). */
  nomCampagne: string;
  sujet: string;
  /** Objets alternatifs, à tester l'un contre l'autre. */
  sujetsAlternatifs?: string[];
  contenu: string;
  /**
   * Ciblage cohérent avec le moment de la séquence : un premier contact ne
   * s'adresse qu'aux fiches jamais écrites, une relance qu'aux fiches déjà
   * contactées.
   */
  filtreSuggere: FiltreSuggere;
  /** Délai indicatif depuis l'étape précédente, en jours. */
  delaiJours?: number;
}

/** Signature commune : identité de l'expéditeur, exigée pour tout démarchage. */
const SIGNATURE = `<p>Bien cordialement,<br/>
Sébastien — BYS Permis<br/>
<a href="{{lienSite}}">{{lienSite}}</a></p>`;

export const MODELES_EMAIL: ModeleEmail[] = [
  {
    id: "premier-contact",
    nom: "Premier contact",
    moment: "Étape 1 — prise de contact",
    objectif: "Présenter la plateforme et obtenir un échange téléphonique.",
    nomCampagne: "Premier contact — centres agréés",
    sujet: "{{nom}} — remplissez vos stages de récupération de points",
    sujetsAlternatifs: [
      "Des stagiaires supplémentaires pour vos stages à {{ville|votre secteur}} ?",
      "{{nom}} : votre agrément, plus de visibilité",
    ],
    contenu: `<p>{{salutation}}</p>

<p>Je me permets de vous contacter car <strong>{{nom}}</strong> est agréé pour dispenser
des stages de récupération de points {{ville|dans votre département}}, et je pense que
notre plateforme peut vous être utile.</p>

<p>BYS Permis est une marketplace dédiée exclusivement aux stages de récupération de
points : elle met en relation les conducteurs qui cherchent un stage près de chez eux
avec des centres agréés comme le vôtre.</p>

<p>Concrètement :</p>
<ul>
  <li>Inscription gratuite, sans engagement de durée</li>
  <li>Une commission uniquement sur les réservations réellement confirmées</li>
  <li>Vos sessions visibles immédiatement, et référencées sur nos pages ville</li>
  <li>Convocations, attestations et encaissement automatisés</li>
</ul>

<p>Le formulaire de demande prend 2 minutes :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>Seriez-vous disponible pour un court échange téléphonique cette semaine ?</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
  },
  {
    id: "premier-contact-court",
    nom: "Premier contact — version courte",
    moment: "Étape 1 — variante à tester",
    objectif: "Même objectif que le premier contact, en cinq lignes lues sur mobile.",
    nomCampagne: "Premier contact — version courte",
    sujet: "Des stagiaires pour {{nom}} ?",
    sujetsAlternatifs: ["Une question rapide, {{contactPrenom|bonjour}}"],
    contenu: `<p>{{salutation}}</p>

<p>Nous orientons les conducteurs qui cherchent un stage de récupération de points
{{ville|dans leur département}} vers les centres agréés proches de chez eux.
{{nom}} pourrait y figurer.</p>

<p>Gratuit à l'inscription, commission uniquement sur les réservations confirmées,
aucun engagement de durée.</p>

<p><a href="{{lienInscription}}">Déposer votre demande (2 minutes)</a></p>

<p>Un échange de 10 minutes vous conviendrait-il pour en parler ?</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
  },
  {
    id: "visibilite-locale",
    nom: "Angle visibilité locale",
    moment: "Étape 1 — variante orientée référencement",
    objectif: "Accrocher les centres sensibles à leur visibilité sur leur ville.",
    nomCampagne: "Visibilité locale — pages ville",
    sujet: "Votre centre sur la page « stage récupération de points {{ville|près de chez vous}} »",
    contenu: `<p>{{salutation}}</p>

<p>Nous publions une page dédiée à la recherche de stages de récupération de points
pour chaque ville que nous couvrons. Les conducteurs y comparent les dates, les prix
et réservent directement.</p>

<p>{{ville|Votre secteur}} fait partie des zones où la demande dépasse aujourd'hui
l'offre référencée. <strong>{{nom}}</strong> y aurait toute sa place.</p>

<p>Le référencement de vos sessions est gratuit : nous ne sommes rémunérés que sur
les réservations que nous vous apportons réellement.</p>

<p><a href="{{lienInscription}}">Référencer {{nom}}</a></p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
  },
  {
    id: "relance-1",
    nom: "Relance",
    moment: "Étape 2 — 5 à 7 jours après le premier contact",
    objectif: "Rappeler l'offre en trois lignes, sans rejouer l'argumentaire complet.",
    nomCampagne: "Relance J+7 — sans réponse",
    sujet: "Re: {{nom}} — remplissez vos stages de récupération de points",
    contenu: `<p>{{salutation}}</p>

<p>Je me permets de revenir vers vous au sujet de BYS Permis, notre marketplace de
stages de récupération de points.</p>

<p>En résumé : zéro frais pour démarrer, une commission uniquement sur les réservations
confirmées, et une visibilité supplémentaire pour vos sessions {{ville|dans votre
secteur}} — sans aucun engagement de durée si l'expérience ne vous convient pas.</p>

<p>Si le sujet vous intéresse, le formulaire de demande prend 2 minutes :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>Je reste disponible si vous avez des questions avant de vous lancer.</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["CONTACTE"] },
    delaiJours: 7,
  },
  {
    id: "relance-question",
    nom: "Relance — une seule question",
    moment: "Étape 2 — variante très courte",
    objectif: "Provoquer une réponse en une ligne, même négative, pour trier le fichier.",
    nomCampagne: "Relance — une seule question",
    sujet: "{{nom}} : je m'adresse à la bonne personne ?",
    contenu: `<p>{{salutation}}</p>

<p>Je vous ai écrit il y a quelques jours au sujet du référencement de vos stages de
récupération de points sur BYS Permis, sans retour de votre côté.</p>

<p>Une seule question : suis-je bien en train d'écrire à la personne qui décide de ces
sujets pour {{nom}} ? Si ce n'est pas le cas, indiquez-moi simplement vers qui me
tourner — et si le sujet ne vous intéresse pas, un « non » me suffit, je n'insisterai
pas.</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["CONTACTE"] },
    delaiJours: 5,
  },
  {
    id: "derniere-relance",
    nom: "Dernière relance",
    moment: "Étape 3 — 10 à 15 jours après la relance",
    objectif: "Clore poliment le dossier — c'est souvent le message qui fait réagir.",
    nomCampagne: "Dernière relance — clôture de dossier",
    sujet: "On referme le dossier {{nom}} ?",
    contenu: `<p>{{salutation}}</p>

<p>Je n'ai pas eu de retour suite à mes précédents messages — je comprends que ce n'est
peut-être pas le bon moment pour {{nom}}.</p>

<p>Je referme donc le dossier de mon côté, mais l'offre reste disponible si vous changez
d'avis : <a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>Bonne continuation à vous et à votre centre.</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["RELANCE"] },
    delaiJours: 15,
  },
  {
    id: "suite-appel",
    nom: "Suite à un appel",
    moment: "Après un échange téléphonique",
    objectif: "Laisser une trace écrite et le lien d'inscription pendant que c'est chaud.",
    nomCampagne: "Suivi post-appel",
    sujet: "Suite à notre échange — {{nom}}",
    contenu: `<p>{{salutation}}</p>

<p>Merci pour le temps que vous m'avez accordé au téléphone. Comme convenu, voici
l'essentiel par écrit pour {{nom}} :</p>

<ul>
  <li>Inscription gratuite, aucun abonnement, aucun engagement de durée</li>
  <li>Commission prélevée uniquement sur les réservations confirmées</li>
  <li>Vous gardez la main sur vos dates, vos places et vos tarifs</li>
  <li>Mise en ligne de vos sessions dès la validation de votre agrément</li>
</ul>

<p>Pour démarrer, il suffit de compléter ce formulaire :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>N'hésitez pas à me rappeler si un point reste à clarifier.</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["INTERESSE"] },
  },
  {
    id: "message-absence",
    nom: "Message laissé sans réponse au téléphone",
    moment: "Après un appel non abouti",
    objectif: "Prendre le relais par écrit quand personne ne décroche.",
    nomCampagne: "Suite à un appel non abouti",
    sujet: "J'ai essayé de vous joindre — {{nom}}",
    contenu: `<p>{{salutation}}</p>

<p>J'ai tenté de vous joindre au {{telephone|numéro de votre centre}} sans succès —
je préfère donc vous écrire plutôt que de vous rappeler à un mauvais moment.</p>

<p>L'objet de mon appel : proposer les sessions de {{nom}} aux conducteurs qui cherchent
un stage de récupération de points {{ville|près de chez vous}}. L'inscription est
gratuite, et nous ne prélevons une commission que sur les réservations confirmées.</p>

<p>Dites-moi simplement quel créneau vous arrange pour un rappel, ou passez directement
par le formulaire :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["A_CONTACTER", "CONTACTE"] },
  },
  {
    id: "objection-commission",
    nom: "Réponse à l'objection « commission »",
    moment: "Après une objection sur le modèle économique",
    objectif: "Lever le frein tarifaire en repositionnant la commission sur le résultat.",
    nomCampagne: "Réponse objection — commission",
    sujet: "Votre question sur la commission — {{nom}}",
    contenu: `<p>{{salutation}}</p>

<p>Vous m'indiquiez que la commission était le point qui vous retenait. C'est une
question légitime, alors voici comment nous la voyons.</p>

<p>Elle ne s'applique que sur les réservations que nous vous apportons, une fois le
stagiaire réellement inscrit et payé. Une place que vous auriez remplie vous-même ne
nous rapporte rien : nous ne sommes payés que sur des places qui seraient autrement
restées vides.</p>

<p>Il n'y a ni abonnement, ni frais de mise en ligne, ni engagement de durée. Si le
volume apporté ne vous convient pas, vous retirez vos sessions et l'histoire s'arrête là.</p>

<p><a href="{{lienInscription}}">Essayer sur une ou deux sessions</a></p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["INTERESSE", "REFUSE"] },
  },
  {
    id: "places-vides",
    nom: "Remplir les places restantes",
    moment: "Argument saisonnier — sessions peu remplies",
    objectif: "Proposer la plateforme comme complément de remplissage de dernière minute.",
    nomCampagne: "Remplissage des places restantes",
    sujet: "Des places restantes sur vos prochaines sessions, {{contactPrenom|bonjour}} ?",
    contenu: `<p>{{salutation}}</p>

<p>Une session de récupération de points qui part avec la moitié de ses places coûte
autant qu'une session complète : même salle, même animateur, même journée.</p>

<p>C'est exactement ce que nous cherchons à corriger. Les conducteurs qui passent par
BYS Permis réservent souvent à quelques jours du stage — précisément les places que
vous avez encore à combler {{ville|dans votre secteur}}.</p>

<p>Vous publiez vos dates et vos places disponibles, nous les rendons visibles, et nous
ne sommes rémunérés que sur les réservations confirmées.</p>

<p><a href="{{lienInscription}}">Publier vos prochaines sessions</a></p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["NOUVEAU", "A_CONTACTER", "CONTACTE"] },
  },
  {
    id: "reactivation",
    nom: "Réactivation",
    moment: "Plusieurs mois après un refus ou un silence",
    objectif: "Reprendre contact avec les dossiers refroidis, sans insister.",
    nomCampagne: "Réactivation — dossiers dormants",
    sujet: "{{nom}} — la demande de stages a augmenté {{ville|près de chez vous}}",
    contenu: `<p>{{salutation}}</p>

<p>Nous nous étions écrit il y a quelque temps au sujet de BYS Permis. Depuis, notre
audience a progressé et nous recevons régulièrement des demandes de stages
{{ville|dans votre département}} sans centre partenaire pour y répondre.</p>

<p>Si vous souhaitez que vos prochaines sessions y soient proposées, l'inscription
reste gratuite et se fait ici :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

<p>Et si le sujet n'est toujours pas d'actualité, dites-le moi simplement : je ne vous
recontacterai plus.</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["REFUSE", "RELANCE"] },
  },
  {
    id: "ouverture-departement",
    nom: "Ouverture d'un département",
    moment: "Campagne géographique ciblée",
    objectif: "Justifier la prise de contact par une actualité locale concrète.",
    nomCampagne: "Ouverture département {{departement}}",
    sujet: "Nous ouvrons le {{departement|votre département}} — {{nom}}",
    contenu: `<p>{{salutation}}</p>

<p>Nous déployons actuellement BYS Permis sur le département {{departement|où vous
exercez}} et cherchons des centres agréés pour y proposer leurs stages de récupération
de points. <strong>{{nom}}</strong> figure parmi les centres que nous avons identifiés.</p>

<p>Les premiers centres référencés sur une zone sont naturellement ceux qui captent
les premières demandes — c'est la raison de mon message aujourd'hui plutôt que dans
six mois.</p>

<p>Inscription gratuite, commission sur les réservations confirmées uniquement :<br/>
<a href="{{lienInscription}}">{{lienInscription}}</a></p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["NOUVEAU", "A_CONTACTER"], exclureDejaContactes: true },
  },
  {
    id: "confirmation-partenariat",
    nom: "Confirmation d'inscription",
    moment: "Après dépôt du dossier partenaire",
    objectif: "Rassurer et annoncer les étapes suivantes une fois la demande déposée.",
    nomCampagne: "Confirmation — dossier partenaire reçu",
    sujet: "Bienvenue {{nom}} — les prochaines étapes",
    contenu: `<p>{{salutation}}</p>

<p>Merci d'avoir déposé la demande de partenariat de <strong>{{nom}}</strong>. Voici ce
qui vous attend :</p>

<ul>
  <li>Vérification de votre agrément préfectoral et de vos pièces justificatives</li>
  <li>Création de votre espace centre et de vos accès</li>
  <li>Publication de vos premières sessions, avec notre aide si besoin</li>
</ul>

<p>Vous pouvez compléter ou corriger votre dossier à tout moment depuis
<a href="{{lienSite}}">{{lienSite}}</a>.</p>

<p>Une question d'ici là ? Répondez simplement à ce message.</p>

${SIGNATURE}`,
    filtreSuggere: { statuts: ["INTERESSE"] },
  },
];

export function trouverModele(id: string): ModeleEmail | undefined {
  return MODELES_EMAIL.find((m) => m.id === id);
}
