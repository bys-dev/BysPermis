# Kit de prospection — centres agréés

Ce dossier contient les outils pour démarcher les centres de stage de récupération de
points listés dans les PDF préfecture fournis, afin de les faire rejoindre BYS Permis
comme centres partenaires.

## Contenu

| Fichier | Usage |
|---|---|
| [`leads-centres-agrees.csv`](./leads-centres-agrees.csv) | 216 centres extraits des PDF préfecture (14 départements), à ouvrir dans Excel/Google Sheets pour piloter la campagne. |
| [`emails-prospection.md`](./emails-prospection.md) | 3 modèles d'email (premier contact, relance, dernière relance) + conseils d'envoi. |
| [`script-appel-telephonique.md`](./script-appel-telephonique.md) | Trame d'appel pour les centres sans email, avec traitement des objections courantes. |

La **brochure PDF** à joindre aux emails ou à laisser après un rendez-vous est générée
directement par le site : téléchargeable sur `/devenir-partenaire` (lien en bas du hero)
ou à l'URL `https://byspermis.fr/api/brochure-partenaire`.

## Démarrer une campagne

1. Ouvrir `leads-centres-agrees.csv` et filtrer par département prioritaire.
2. Pour chaque centre : email disponible → utiliser `emails-prospection.md` (email 1) en
   joignant la brochure ; sinon → utiliser `script-appel-telephonique.md`.
3. Après chaque contact, remplir `Statut_Prospection`, `Date_Contact` et `Commentaire`
   dans le CSV.
4. Programmer les relances (email 2 à J+5-7, email 3 à J+15-20 si toujours sans réponse).

## Ce qu'il faut savoir sur les données

- **Ce CSV n'est pas une liste nationale exhaustive** : il ne couvre que les 14
  départements pour lesquels une liste préfecture a été fournie (01, 12, 14, 26, 33, 47,
  56, 64, 69, 75, 91, 92, 95, 2B). Pour les autres départements, chaque préfecture publie
  sa propre liste (généralement sur le site `[département].gouv.fr`, rubrique « permis à
  points »).
- **Plusieurs listes sont anciennes** — colonne `Commentaire` renseignée en conséquence :
  - Val-d'Oise (95) : liste d'**août 2016**, à vérifier impérativement avant tout envoi
    (adresses/téléphones probablement obsolètes pour une partie des centres).
  - Paris (75) et Calvados (14) : listes de **2018**, à vérifier avant envoi.
- **Un même centre peut apparaître dans plusieurs départements** (ex. ACTI ROUTE, FRANCE
  STAGE PERMIS, ABC PERMIS A POINTS, AUTOMOBILE CLUB ASSOCIATION, SOS PERMIS, ID STAGES,
  ASSUR ASSOCIATION) : ce sont des réseaux nationaux avec un siège unique et plusieurs
  lieux de stage. Les lignes correspondantes sont annotées « doublon » dans le
  Lot-et-Garonne (47) où le même centre apparaît sous plusieurs arrondissements. Voir la
  note stratégique dans `emails-prospection.md` : ces réseaux ont moins à gagner à
  rejoindre une marketplace que les centres indépendants à un seul site — à prioriser en
  second.
- Les colonnes `Telephone` / `Email` / `Site_Web` sont vides quand l'information n'était
  pas indiquée dans le PDF source (certaines listes préfecture ne publient qu'un
  numéro d'agrément et une adresse).

## Compléter la liste

Pour élargir la campagne à d'autres départements : demander/télécharger la liste des
« centres agréés de stages de sensibilisation à la sécurité routière » sur le site de la
préfecture concernée, puis ajouter les lignes au CSV en respectant les mêmes colonnes.
