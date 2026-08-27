# Modèles d'email — BYS Permis

Bibliothèque de modèles prêts à coller dans le champ **Contenu (HTML)** de
l'éditeur de campagnes (`/admin/campagnes`).

Habillage repris de la mécanique SL Formations (`baseLayout` / `wrapInBrandedTemplate`),
transposé à la charte BYS : navy, bleu, blanc, gris.

> Fichiers générés par `build.mjs`. Pour modifier un texte : éditer
> `contenus/<slug>.html` puis relancer `node prospection/modeles-emails/build.mjs`.
> Pour modifier la charte (couleurs, en-tête, pied) : éditer `habiller()` dans
> `build.mjs` — les 14 modèles sont régénérés d'un coup.

---

## Mode d'emploi

1. Ouvrir le fichier `.html` du modèle, tout sélectionner, copier.
2. Dans **Campagnes → Nouvelle campagne**, coller dans **Contenu (HTML)**.
3. Recopier l'un des **objets** proposés dans le champ *Objet de l'email*.
4. Régler le **ciblage**, puis **Aperçu** et **Test** sur votre adresse avant de créer.

### Ce que la plateforme ajoute automatiquement

Le module enveloppe votre HTML avec `wrapCampaignHtml()`
(`src/lib/prospects/template.ts`), qui ajoute sous le message l'identité de
l'expéditeur et le **lien de désinscription** — obligatoire pour le démarchage.
Ne le recopiez pas dans le contenu : il serait en double.

### Variables disponibles

Seules ces 15 clés sont acceptées ; toute autre **bloque l'enregistrement** de la
campagne (`validateCampaignTemplate`) :

`{{nom}}` `{{raisonSociale}}` `{{ville}}` `{{codePostal}}` `{{departement}}`
`{{contactNom}}` `{{contactPrenom}}` `{{contactFonction}}` `{{salutation}}`
`{{telephone}}` `{{siteWeb}}` `{{agrementNumber}}` `{{lienInscription}}`
`{{lienSite}}` `{{lienDesinscription}}`

**Toujours prévoir un repli** avec la syntaxe `{{ville|votre secteur}}` : le
fichier de prospection est incomplet, et une variable vide sans repli laisse un
trou dans la phrase.

### Deux habillages

| Habillage | Ce que c'est | Pour quoi |
|---|---|---|
| **sobre** | En-tête discret sur fond blanc, pas de bandeau plein | Démarchage à froid. Un mail visuellement « marketing » part plus souvent en spam et ressemble moins à un email écrit à la main. |
| **complet** | Bandeau navy pleine largeur + logo | Destinataires qui vous connaissent déjà : partenaires, annonces, offres, grand public. |

---

## Règles d'envoi

- **Volume** : 30 à 50 emails par jour maximum sur du froid. Le module envoie par
  lots de 100 (`BATCH_SIZE`), c'est le ciblage qui doit rester petit.
- **Expéditeur** : une adresse nominative (`sebastien@byspermis.fr`) répond mieux
  qu'un `contact@`. Renseigner systématiquement l'**adresse de réponse**.
- **Un seul lien cliquable** sur les modèles à froid : plusieurs liens et images
  dégradent la délivrabilité.
- **Jamais deux campagnes à froid le même jour** vers le même prospect : utiliser
  « exclure les campagnes » dans le ciblage.
- **Chiffres** : ne publier que des chiffres réels. Aucun modèle de cette
  bibliothèque n'affiche de statistique inventée.
- **Cadre légal (B2B)** : la prospection vers une adresse professionnelle est
  autorisée sans consentement préalable (art. L34-5 CPCE) à condition d'identifier
  l'expéditeur et d'offrir un moyen simple de refus — les deux sont gérés par
  l'habillage automatique.
- **Images** : les modèles n'utilisent qu'une seule image, le logo servi par
  `https://byspermis.fr/colored-logo.png`. Vérifier que cette URL répond avant la
  première campagne — sinon le texte de remplacement prend le relais.

---

## Prospection centres

### Premier contact

[`01-prospection-premier-contact.html`](./01-prospection-premier-contact.html) · habillage **sobre** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `{{nom}} — vos places libres visibles à {{ville|votre secteur}}`
  - `Des stagiaires en plus pour {{nom}} ?`
- **Pré-en-tête** : Inscription gratuite, commission uniquement sur les réservations confirmées.
- **Ciblage** : Statuts : Nouveau + À contacter · « jamais contactés » coché
- **Quand l'envoyer** : Premier email de la séquence.

### Relance courte

[`02-prospection-relance-courte.html`](./02-prospection-relance-courte.html) · habillage **sobre** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `Re : {{nom}} — vos places libres`
  - `Une minute pour {{nom}} ?`
- **Pré-en-tête** : Zéro frais fixe, zéro engagement — une commission seulement si un stagiaire réserve.
- **Ciblage** : Statut : Contacté · exclure la campagne « Premier contact » pour les répondeurs
- **Quand l'envoyer** : J+5 à J+7 après le premier contact.

### Réponse aux objections

[`03-prospection-objections.html`](./03-prospection-objections.html) · habillage **sobre** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `« Et si ça me prend des inscriptions que j'aurais eues quand même ? »`
  - `Les 4 questions que posent les centres avant de se lancer`
- **Pré-en-tête** : Les 4 questions que nous posent les centres agréés avant de se lancer.
- **Ciblage** : Statuts : Contacté + Relancé
- **Quand l'envoyer** : J+12 — relance à valeur ajoutée, remplace une relance « molle ».

### Dernière relance (soft close)

[`04-prospection-derniere-relance.html`](./04-prospection-derniere-relance.html) · habillage **sobre** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `Je referme le dossier {{nom}} ?`
  - `Dernier message de ma part`
- **Pré-en-tête** : Dernier message de ma part — l'offre reste ouverte si vous changez d'avis.
- **Ciblage** : Statut : Relancé
- **Quand l'envoyer** : J+15 après la dernière relance. Génère souvent le meilleur taux de réponse.

### Offre de lancement 0 %

[`05-prospection-offre-lancement.html`](./05-prospection-offre-lancement.html) · habillage **complet** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `{{nom}} : 0 % de commission sur vos premières sessions`
  - `Offre de lancement pour les centres du {{departement|secteur}}`
- **Pré-en-tête** : 0 % de commission sur vos premières sessions — offre de lancement réservée aux centres agréés.
- **Ciblage** : Statuts : Contacté + Relancé + Intéressé (jamais en premier contact)
- **Quand l'envoyer** : Quand la séquence classique n'a rien donné, ou pour ouvrir un nouveau département.
- **À compléter avant envoi** : nombre de sessions offertes · date limite de l'offre — repérables aux `[[doubles crochets]]`.

### Invitation à un échange de 15 min

[`06-prospection-invitation-echange.html`](./06-prospection-invitation-echange.html) · habillage **sobre** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `15 minutes pour voir si on peut remplir vos sessions ?`
  - `{{nom}} — un créneau cette semaine ?`
- **Pré-en-tête** : 15 minutes au téléphone pour voir si la plateforme peut remplir vos sessions.
- **Ciblage** : Statuts : Contacté + Intéressé
- **Quand l'envoyer** : Sur les prospects qui ont ouvert sans répondre, ou après un appel manqué.
- **À compléter avant envoi** : les 3 créneaux proposés (ne jamais laisser une date passée) — repérables aux `[[doubles crochets]]`.

### Pic saisonnier / remplissage

[`07-prospection-pic-saisonnier.html`](./07-prospection-pic-saisonnier.html) · habillage **complet** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `Vos dates sont-elles visibles là où les conducteurs cherchent ?`
  - `Rentrée : la demande de stages repart`
- **Pré-en-tête** : Vos sessions sont-elles visibles là où les conducteurs cherchent une date ?
- **Ciblage** : Tous statuts contactables, hors Intéressé (qui reçoivent l'offre 05)
- **Quand l'envoyer** : Rentrée de septembre, janvier, avant les grands départs.
---

## Partenaires

### Bienvenue & activation

[`08-partenaire-bienvenue.html`](./08-partenaire-bienvenue.html) · habillage **complet** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `Bienvenue sur BYS Permis, {{nom}}`
  - `{{nom}} : 3 étapes avant votre première réservation`
- **Pré-en-tête** : 3 étapes pour publier votre première session et recevoir vos premières réservations.
- **Ciblage** : Statut : Intéressé / Inscrit
- **Quand l'envoyer** : Dès la validation du dossier partenaire.

### Réactivation (aucune session publiée)

[`09-partenaire-reactivation.html`](./09-partenaire-reactivation.html) · habillage **sobre** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `{{nom}} : vos places ne sont pas encore visibles`
  - `Votre compte est prêt, vos dates manquent`
- **Pré-en-tête** : Votre compte est actif mais aucune session n'est publiée — 2 minutes suffisent.
- **Ciblage** : Statut : Inscrit, sans session publiée (à filtrer à la main pour l'instant)
- **Quand l'envoyer** : 15 jours après l'inscription si aucune session n'est en ligne.

### Annonce d'une nouveauté

[`10-partenaire-annonce-nouveaute.html`](./10-partenaire-annonce-nouveaute.html) · habillage **complet** · envoyable depuis **/admin/campagnes**

- **Objets à tester** :
  - `Nouveau sur BYS Permis : [[nom de la nouveauté]]`
  - `Une nouveauté qui va vous faire gagner du temps`
- **Pré-en-tête** : Une nouveauté disponible dès aujourd'hui dans votre espace centre.
- **Ciblage** : Statuts : Intéressé + Inscrit
- **Quand l'envoyer** : À chaque livraison de fonctionnalité visible côté centre.
- **À compléter avant envoi** : nom de la nouveauté · les 3 bénéfices · le lien de destination — repérables aux `[[doubles crochets]]`.
---

## Grand public

### Offre promotionnelle (code promo)

[`11-grand-public-offre-promo.html`](./11-grand-public-offre-promo.html) · habillage **complet** · **hors module Campagnes**

- **Objets à tester** :
  - `[[-XX €]] sur votre stage de récupération de points`
  - `Votre code [[CODE]] est actif jusqu'au [[date]]`
- **Pré-en-tête** : Votre code promo est actif — 4 points récupérés en 2 jours.
- **Ciblage** : Liste opt-in stagiaires (hors module Campagnes)
- **Quand l'envoyer** : Opérations commerciales, périodes creuses.
- **À compléter avant envoi** : le code · le montant de la remise · la date de fin — repérables aux `[[doubles crochets]]`.

### Réservation non finalisée

[`12-grand-public-reservation-non-finalisee.html`](./12-grand-public-reservation-non-finalisee.html) · habillage **complet** · **hors module Campagnes**

- **Objets à tester** :
  - `Votre place n'est pas encore réservée`
  - `Il reste des places sur votre stage du [[date]]`
- **Pré-en-tête** : Votre place n'est pas encore confirmée — le stage peut afficher complet.
- **Ciblage** : Réservations en statut PENDING depuis plus de 2 h
- **Quand l'envoyer** : Relance automatique H+2, puis J+1.
- **À compléter avant envoi** : les infos de session (date, ville, prix) — repérables aux `[[doubles crochets]]`.

### Newsletter / actualité permis à points

[`13-grand-public-newsletter.html`](./13-grand-public-newsletter.html) · habillage **complet** · **hors module Campagnes**

- **Objets à tester** :
  - `Permis à points : ce qu'il faut savoir ce mois-ci`
  - `Combien de points vous reste-t-il vraiment ?`
- **Pré-en-tête** : L'essentiel du mois sur le permis à points, et les prochaines sessions près de chez vous.
- **Ciblage** : Liste opt-in stagiaires + visiteurs inscrits
- **Quand l'envoyer** : Mensuel.
- **À compléter avant envoi** : l'article mis en avant · les 3 sessions listées — repérables aux `[[doubles crochets]]`.

### Demande d'avis après stage

[`14-grand-public-demande-avis.html`](./14-grand-public-demande-avis.html) · habillage **sobre** · **hors module Campagnes**

- **Objets à tester** :
  - `Comment s'est passé votre stage ?`
  - `2 minutes pour aider les prochains stagiaires`
- **Pré-en-tête** : Votre avis aide les prochains conducteurs à choisir leur centre.
- **Ciblage** : Stagiaires dont le stage est terminé depuis 48 h
- **Quand l'envoyer** : J+2 après la fin du stage.
- **À compléter avant envoi** : le lien du formulaire d'avis — repérables aux `[[doubles crochets]]`.
---

## Blocs réutilisables

Pour composer un modèle sur mesure, voir [`kit-blocs.html`](./kit-blocs.html) :
bouton, encart bleu, carte grise, séparateur, comparatif deux colonnes, étapes
numérotées, ligne de statistiques, signature.
