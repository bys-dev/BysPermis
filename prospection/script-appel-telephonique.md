# Script d'appel — prospection centres agréés

Beaucoup de centres listés dans les PDF préfecture n'ont qu'un numéro de téléphone (pas
d'email) — voir [`leads-centres-agrees.csv`](./leads-centres-agrees.csv). Ce script sert de
trame, pas de texte à réciter mot pour mot : s'adapter au ton de l'interlocuteur.

## Avant d'appeler

- Vérifier dans le CSV si le centre a déjà été contacté (colonne `Statut_Prospection`).
- Avoir sous les yeux : nom du centre, ville, et l'argumentaire ci-dessous.
- Meilleurs créneaux : en semaine, éviter le lundi matin et le vendredi après-midi.

## 1. Accroche (15 secondes)

> Bonjour, je suis [prénom nom] de BYS Permis. Je vous appelle parce que votre centre
> est agréé pour les stages de récupération de points à [ville], et je voulais vous
> présenter rapidement une solution qui pourrait vous amener des stagiaires
> supplémentaires. Vous avez deux minutes ?

**Si "non, pas le temps" :** proposer de rappeler.
> Pas de souci, à quel moment puis-je vous rappeler cette semaine ?
→ Noter le créneau dans le CSV (`Statut_Prospection` = "à rappeler" + date/heure en
`Commentaire`).

## 2. Découverte rapide (2-3 questions)

> Comment remplissez-vous vos sessions aujourd'hui ? Vous avez déjà de la visibilité en
> ligne, ou c'est surtout du bouche-à-oreille et des partenariats locaux ?

> Ça vous arrive d'avoir des sessions avec des places vides ?

→ Écouter la réponse : si le centre est déjà complet via ses propres canaux, l'argument
"remplissage" est moins fort — insister plutôt sur la simplification administrative
(convocations/attestations automatisées) et la commission uniquement sur résultat.

## 3. Présentation de l'offre (30-45 secondes)

> BYS Permis, c'est une plateforme dédiée uniquement aux stages de récupération de
> points. On met en relation les conducteurs qui cherchent un stage près de chez eux avec
> des centres agréés comme le vôtre.
>
> Trois points importants :
> - C'est gratuit pour démarrer, sans engagement de durée
> - On ne prend une commission que sur les réservations réellement confirmées — si on ne
>   vous amène personne, vous ne payez rien
> - Les convocations, attestations et l'encaissement sont automatisés, ça vous fait gagner
>   du temps sur l'administratif

## 4. Traitement des objections courantes

**"On a déjà notre clientèle, on n'a pas besoin de ça."**
> C'est très bien, dans ce cas ça ne coûte rien d'essayer : comme il n'y a pas
> d'engagement et pas de commission tant qu'on ne vous amène pas de stagiaire, il n'y a
> pas de risque pour vous. Beaucoup de centres l'utilisent juste pour les sessions les
> moins remplies.

**"Combien ça coûte ?"**
> L'inscription est gratuite. On propose ensuite un abonnement mensuel selon votre volume,
> avec une commission dégressive : de 10% à 5% selon la formule. Je peux vous envoyer le
> détail par email si vous voulez.

**"C'est qui, BYS Permis ? Je ne connais pas."**
> On est une plateforme française spécialisée exclusivement dans les stages de
> récupération de points — on ne fait que ça, contrairement à des annuaires généralistes.
> Vous pouvez voir le site sur byspermis.fr.

**"Envoyez-moi un email, je regarderai."**
> Avec plaisir. Quelle adresse email je peux utiliser ?
→ Noter l'email dans le CSV s'il n'y était pas, envoyer l'email 1 du fichier
[`emails-prospection.md`](./emails-prospection.md) avec la brochure en pièce jointe.

**"On n'est pas intéressés."**
> Pas de souci, merci pour votre temps. Bonne continuation !
→ Noter `Statut_Prospection` = "refus" dans le CSV, ne pas rappeler.

## 5. Conclusion et prochaine étape

> Le mieux, c'est de remplir le formulaire sur byspermis.fr/devenir-partenaire — ça prend
> deux minutes, et notre équipe revient vers vous sous 48h avec une proposition adaptée à
> votre volume. Je peux aussi vous envoyer le lien par SMS ou email si c'est plus simple.

→ Toujours terminer par une action concrète : email envoyé, rappel programmé, ou
formulaire rempli pendant l'appel si l'interlocuteur est disponible.

## Après l'appel

Mettre à jour immédiatement `leads-centres-agrees.csv` :
- `Statut_Prospection` : contacté / à rappeler / intéressé / refus / injoignable
- `Date_Contact` : date du jour
- `Commentaire` : point clé de l'échange (créneau de rappel, objection principale, email
  récupéré…)
