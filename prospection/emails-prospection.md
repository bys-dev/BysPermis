# Modèles d'email — prospection centres agréés

À utiliser pour contacter les centres de stage de récupération de points listés dans
[`leads-centres-agrees.csv`](./leads-centres-agrees.csv). Joindre la brochure PDF téléchargeable
sur `byspermis.fr/devenir-partenaire` (bouton en bas du hero) ou générée directement via
`https://byspermis.fr/api/brochure-partenaire`.

**Rappel légal (B2B, France) :** la prospection par email vers une adresse professionnelle
(société, association) est autorisée sans consentement préalable (art. L34-5 CPCE), à condition
de préciser l'identité de l'expéditeur et de proposer un moyen simple de se désinscrire dans
chaque email («répondez STOP» ou lien de désinscription).

---

## Email 1 — Premier contact

**Objet (à tester, choisir un des deux) :**
- `[Nom du centre] — remplissez vos sessions de stage de récupération de points`
- `Des stagiaires supplémentaires pour vos stages à [Ville] ?`

**Corps :**

```text
Bonjour,

Je me permets de vous contacter car [Nom du centre] est agréé pour dispenser des stages
de récupération de points à [Ville / département], et je pense que notre plateforme
pourrait vous intéresser.

BYS Permis est une marketplace dédiée exclusivement aux stages de récupération de
points : elle met en relation les conducteurs qui cherchent un stage près de chez eux
avec des centres agréés comme le vôtre.

Concrètement :
- Inscription gratuite, sans engagement de durée
- Une commission uniquement sur les réservations réellement confirmées
- Vos sessions visibles immédiatement sur la marketplace et référencées sur nos pages
  ville (SEO local)
- Convocations, attestations et encaissement automatisés — vous gardez le temps pour
  animer vos stages

Vous trouverez le détail de l'offre dans la brochure jointe, et le formulaire de demande
en 2 minutes sur : https://byspermis.fr/devenir-partenaire

Seriez-vous disponible pour un court échange téléphonique cette semaine pour en discuter ?

Bien cordialement,
[Votre prénom nom]
BYS Permis
contact@byspermis.fr — byspermis.fr

---
Vous ne souhaitez plus recevoir nos messages ? Répondez "STOP" à cet email.
```

---

## Email 2 — Relance (5 à 7 jours après, si pas de réponse)

**Objet :** `Re: [Nom du centre] — remplissez vos sessions de stage de récupération de points`

**Corps :**

```text
Bonjour,

Je me permets de revenir vers vous suite à mon message du [date] au sujet de BYS
Formation, notre marketplace de stages de récupération de points.

En résumé : zéro frais pour démarrer, une commission uniquement sur les réservations
confirmées, et une visibilité supplémentaire pour vos sessions — sans aucun engagement
de durée si l'expérience ne vous convient pas.

Si le sujet vous intéresse, le formulaire de demande prend 2 minutes :
https://byspermis.fr/devenir-partenaire

Je reste bien sûr disponible si vous avez des questions avant de vous lancer.

Bien cordialement,
[Votre prénom nom]
BYS Permis
contact@byspermis.fr — byspermis.fr

---
Vous ne souhaitez plus recevoir nos messages ? Répondez "STOP" à cet email.
```

---

## Email 3 — Dernière relance (soft close, 10-15 jours après la relance)

**Objet :** `On referme le dossier [Nom du centre] ?`

**Corps :**

```text
Bonjour,

Je n'ai pas eu de retour de votre part suite à mes précédents messages — je comprends
que ce n'est peut-être pas le bon moment pour vous.

Je referme donc le dossier de mon côté, mais l'offre reste disponible si vous changez
d'avis : https://byspermis.fr/devenir-partenaire

Bonne continuation à vous et à votre centre.

Bien cordialement,
[Votre prénom nom]
BYS Permis
contact@byspermis.fr — byspermis.fr
```

---

## Conseils d'envoi

- **Personnaliser** au minimum `[Nom du centre]` et `[Ville]` — un email visiblement
  générique part directement à la corbeille.
- **Volume** : envoyer par petits lots (30-50/jour) plutôt qu'en masse d'un coup, pour
  limiter le risque d'être marqué comme spam par les fournisseurs mail (Gmail, Outlook…).
- **Expéditeur** : utiliser une adresse `@byspermis.fr` nominative si possible
  (ex. `sebastien@byspermis.fr`) plutôt que `contact@`, ça augmente le taux de réponse.
- **Suivi** : reporter la date d'envoi et la réponse dans `leads-centres-agrees.csv`
  (colonnes `Statut_Prospection` et `Date_Contact`).
- Les centres qui font partie d'un **réseau national** (ACTI ROUTE, ABC PERMIS A POINTS,
  FRANCE STAGE PERMIS, AUTOMOBILE CLUB ASSOCIATION, SOS PERMIS, ID STAGES…) ont souvent
  déjà une forte visibilité et peu d'incitation à rejoindre une marketplace — ils
  répondent moins bien à ce type de démarche. Prioriser plutôt les **centres
  indépendants** à un seul site, qui ont davantage à gagner en visibilité.
