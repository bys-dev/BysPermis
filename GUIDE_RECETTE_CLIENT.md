# Guide de recette — BYS Formation Permis

> Document à l'attention de **Sébastien (BYS Formation)**
> Préparé par Andrys MAGAR — Version du 20/05/2026
>
> **URL de test** : `https://bys-permis-git-staging.vercel.app`
> (sera mise à jour avec l'URL finale après mise en ligne)

---

## Comment utiliser ce document

1. Ce guide vous propose **5 parcours à tester** (Visiteur, Élève, Centre, Admin, Cas particuliers)
2. Suivez chaque parcours **dans l'ordre**, en cochant les cases ✅ au fur et à mesure
3. Si quelque chose ne fonctionne pas comme attendu, notez-le dans la section **« Bugs et retours »** à la fin
4. Une fois tout testé, renvoyez-moi le document avec vos commentaires

**Temps estimé** : 45 min à 1h pour tout tester.

---

## ⚠️ Mode test — informations importantes

Vous êtes sur un **environnement de test**. Concrètement :

- **Aucun paiement réel** ne sera effectué. Utilisez la carte de test ci-dessous.
- Les emails de test sont envoyés depuis `noreply@bys-permis.fr`. Vérifiez aussi vos **spams**.
- La base de données est **réinitialisable** : si vous cassez quelque chose, ce n'est pas grave.

### Carte bancaire de test Stripe

Pour TOUS les paiements, utilisez :

```
Numéro de carte  : 4242 4242 4242 4242
Date expiration : n'importe quelle date future (ex : 12/30)
CVC             : n'importe quel 3 chiffres (ex : 123)
Code postal     : n'importe quel code (ex : 75001)
```

Pour tester un **paiement refusé** : `4000 0000 0000 0002`
Pour tester un **paiement avec 3D Secure** : `4000 0027 6000 3184`

---

## Parcours 1 — Visiteur (sans compte)

Vous testez le site **sans être connecté**. C'est ce que verra un nouveau visiteur.

### 1.1 Page d'accueil
- [ ] Ouvrir l'URL du site
- [ ] Vérifier que le **logo BYS Formation** s'affiche en haut à gauche
- [ ] Vérifier que le bandeau « Agréé Ministère de l'Intérieur » est visible
- [ ] Lire le hero : « Récupérez vos points près de chez vous au meilleur prix »
- [ ] Tester la **barre de recherche** : taper « Paris » dans Où ? → cliquer Rechercher

### 1.2 Recherche de stages
- [ ] Vérifier que la liste des stages disponibles s'affiche
- [ ] Tester les **filtres** : prix, dates, Qualiopi
- [ ] Cliquer sur **« Ma position »** en haut à droite (autoriser la géolocalisation)
- [ ] Vérifier que le département s'affiche : « Cergy (95) » par exemple
- [ ] Vérifier que les stages affichés sont **proches de chez vous**

### 1.3 Carte interactive des centres
- [ ] Aller sur **« Nos Centres »** dans le menu
- [ ] Vérifier que la **carte interactive** s'affiche avec des marqueurs
- [ ] Cliquer sur un marqueur → vérifier qu'une popup s'affiche (nom, adresse, lien)
- [ ] Zoomer / dézoomer la carte

### 1.4 Fiche stage
- [ ] Cliquer sur un stage dans la recherche
- [ ] Vérifier les infos : prix, dates, durée, centre, ville, points récupérés
- [ ] Vérifier que la fiche affiche le **logo du centre**
- [ ] Vérifier les sessions disponibles dans le calendrier

### 1.5 Pages informationnelles
- [ ] Cliquer sur **« Comment ça marche »** → page lisible
- [ ] Cliquer sur **« FAQ »** → questions/réponses lisibles (pas de fond noir illisible)
- [ ] Cliquer sur **« Blog »** → articles affichés
- [ ] Cliquer sur **« Mentions légales »** → vos infos BYS et mon SIRET prestataire visibles
- [ ] Cliquer sur **« Contact »** → formulaire affiché

---

## Parcours 2 — Élève (parcours principal de réservation)

C'est le parcours le plus critique : un élève réserve un stage.

### 2.1 Inscription
- [ ] Cliquer sur **« Connexion »** en haut à droite
- [ ] Cliquer sur **« Pas encore de compte ? Inscrivez-vous »**
- [ ] Créer un compte avec un **vrai email à vous** (vous recevrez des emails)
- [ ] Vérifier que vous recevez l'**email de bienvenue**

### 2.2 Réserver un stage
- [ ] Retourner sur la page **Recherche**
- [ ] Choisir un stage et cliquer sur **« Réserver »**
- [ ] **Étape 1 — Données personnelles** : remplir civilité, nom, prénom, email, téléphone, date de naissance, adresse, code postal, ville, n° de permis
- [ ] **Étape 2 — Paiement** : carte de test `4242 4242 4242 4242`, expiration `12/30`, CVC `123`
- [ ] **Étape 3 — Confirmation** : vérifier que la page de succès s'affiche avec votre numéro de réservation

### 2.3 Emails reçus
Vérifier que vous recevez **2 emails** dans la minute qui suit :

- [ ] Email **« Confirmation de réservation »**
  - [ ] Logo BYS Formation visible en en-tête
  - [ ] Numéro de réservation affiché
  - [ ] **Facture PDF jointe** au mail
  - [ ] Ouvrir la facture → vérifier les infos (votre nom, montant, TVA 0%, SIRET BYS, IBAN BYS)
- [ ] Email **« Convocation »**
  - [ ] Logo visible
  - [ ] **Convocation PDF jointe** au mail
  - [ ] Ouvrir la convocation → vérifier date, lieu du centre, n° permis, mention agrément préfectoral

### 2.4 Espace élève
- [ ] Cliquer sur **« Mon espace »** dans le menu
- [ ] **Mes réservations** : vérifier que votre réservation s'affiche avec le statut « Confirmée »
- [ ] **Mes formations** : vérifier que la formation s'affiche dans « En cours »
- [ ] Cliquer sur **« Convocation »** → le PDF se télécharge
- [ ] **Documents** : vérifier que la facture et la convocation sont listées
- [ ] **Paiements** : vérifier l'historique du paiement
- [ ] **Mon profil** : modifier votre téléphone, sauvegarder, recharger → modif persistée
- [ ] **Favoris** : depuis la recherche, cliquer sur un cœur pour ajouter un favori, puis vérifier qu'il apparaît
- [ ] **Notifications** : vérifier la cloche en haut (badge avec le nombre d'événements)

### 2.5 Annulation (cas particulier)
- [ ] Aller dans **Mes réservations**
- [ ] Cliquer sur **« Annuler »** sur votre réservation
- [ ] Confirmer
- [ ] Vérifier que le statut passe à « Annulée »
- [ ] Vérifier que vous recevez un **email de confirmation d'annulation**

---

## Parcours 3 — Centre partenaire (vous, Sébastien)

Vous testez l'expérience d'un centre de formation partenaire.

### 3.1 Inscription centre
- [ ] Cliquer sur **« Espace Pro »** dans le menu
- [ ] Cliquer sur **« Devenir centre partenaire »**
- [ ] Remplir le formulaire (utilisez les vraies infos BYS Formation)
- [ ] Valider → vous recevez un **email d'invitation** avec lien de connexion

### 3.2 Onboarding centre
- [ ] Cliquer sur le lien dans l'email de bienvenue
- [ ] Se connecter
- [ ] Compléter le profil :
  - [ ] **Logo** : uploader le logo BYS (PNG ou SVG)
  - [ ] **Bannière** : uploader une image (façade ou salle)
  - [ ] **SIRET** : 14 chiffres
  - [ ] **Adresse + coordonnées GPS**
  - [ ] **N° d'agrément préfectoral** (obligatoire pour stages récup points)
  - [ ] **Date d'expiration de l'agrément**
- [ ] Vérifier que la **barre de progression** monte à 100%

### 3.3 Stripe Connect
- [ ] Aller dans **Paramètres → Paiement**
- [ ] Cliquer sur **« Connecter mon compte Stripe »**
- [ ] Remplir le formulaire Stripe (RIB de BYS Formation, pièce d'identité)
- [ ] Revenir sur le site → vérifier que **« Stripe connecté »** s'affiche en vert

### 3.4 Créer un stage
- [ ] **Formations → Nouvelle formation**
- [ ] Renseigner : titre, description, prix
- [ ] **Modalité** : vérifier que seul **« Présentiel »** est disponible (réglementation)
- [ ] **Type de stage** : choisir « Volontaire »
- [ ] **Points récupérés** : 4 (par défaut)
- [ ] Sauvegarder
- [ ] **Sessions → Nouvelle session**
- [ ] Renseigner : date début, date fin, nombre de places
- [ ] **Test contrainte** : essayer avec 5 places → doit être refusé (« 6 stagiaires minimum »)
- [ ] Réessayer avec 10 places → accepté

### 3.5 Gérer un stagiaire
*(Pré-requis : avoir une réservation de votre compte élève sur ce stage)*

- [ ] **Mes sessions** : voir la liste des stagiaires inscrits
- [ ] Cliquer sur la session → voir le détail
- [ ] **Émargement** : cocher la présence d'un stagiaire
- [ ] **Facturation** : voir l'historique des paiements reçus (90% du prix, 10% prélevé)
- [ ] **Statistiques** : KPIs du centre (CA, taux remplissage)

### 3.6 Voir le PDF de votre stage
- [ ] Réserver depuis votre compte élève sur **votre propre stage**
- [ ] Recevoir la convocation
- [ ] Ouvrir le PDF → vérifier que **VOTRE logo de centre** apparaît en en-tête, pas celui de BYS

---

## Parcours 4 — Administrateur

Vous testez l'espace admin (votre compte OWNER).

### 4.1 Dashboard admin
- [ ] Se connecter avec votre compte OWNER
- [ ] Aller sur **/admin/dashboard**
- [ ] Vérifier les **KPIs globaux** : CA total, centres actifs, réservations, etc.

### 4.2 Validation centre
- [ ] Aller dans **Admin → Centres**
- [ ] Voir la liste des centres
- [ ] Si un centre est « En attente » → cliquer **« Valider »**
- [ ] Vérifier que le centre passe en **« Actif »**
- [ ] Vérifier que le centre **reçoit un email d'activation**

### 4.3 Gestion utilisateurs
- [ ] Aller dans **Admin → Utilisateurs**
- [ ] Voir la liste, filtrer par rôle
- [ ] Changer le rôle d'un user (ex : passer un compte de ELEVE à SUPPORT)
- [ ] Bloquer un user → vérifier qu'il ne peut plus se connecter

### 4.4 Statistiques et exports
- [ ] Aller dans **Admin → Statistiques** → graphiques visibles
- [ ] Aller dans **Admin → Revenus** → tableau des revenus
- [ ] Cliquer sur **« Exporter CSV »** → le fichier se télécharge

### 4.5 Paramètres plateforme
- [ ] Aller dans **Admin → Paramètres**
- [ ] Vérifier le **taux de commission** (10% par défaut)
- [ ] Activer/désactiver le **mode maintenance**

---

## Parcours 5 — Cas particuliers à vérifier

### 5.1 Responsive (téléphone et tablette)
Testez sur votre téléphone et/ou via DevTools (F12 → mode mobile) :

- [ ] **iPhone (375px)** : tout est lisible, pas de débordement horizontal
- [ ] Le menu burger fonctionne (3 traits en haut à droite)
- [ ] La barre des 4 stats rouges (4 points, 2 jours, 150+ centres, 5 min) s'affiche en 2x2
- [ ] **Tablette (768px)** : la page de réservation a 2 colonnes
- [ ] **Desktop large (1920px)** : pas de page trop étirée

### 5.2 Sécurité
- [ ] **Déconnecté**, essayer d'accéder à `/admin/dashboard` → redirection vers `/connexion`
- [ ] **Connecté comme ELEVE**, essayer d'accéder à `/admin` → accès refusé
- [ ] **Connecté comme CENTRE**, essayer d'accéder à `/admin` → accès refusé

### 5.3 Validation des places
- [ ] Réserver un stage où il ne reste qu'**1 place**
- [ ] Réessayer une 2e fois depuis un autre navigateur → vérifier que c'est refusé

### 5.4 Recherche avancée
- [ ] Rechercher avec une **ville inexistante** (« Zzzz ») → message « Aucun résultat »
- [ ] Rechercher avec une fourchette de prix très étroite → résultats filtrés correctement
- [ ] Tester le tri : Prix croissant, Prix décroissant, Date, Pertinence

### 5.5 Carte de paiement refusée
- [ ] Réessayer une réservation avec la carte refusée : `4000 0000 0000 0002`
- [ ] Vérifier que le paiement est **bien refusé** avec un message clair
- [ ] Vérifier que la place n'est **pas réservée** (la place reste disponible)

---

## Bugs et retours

Si vous rencontrez un problème, notez-le ci-dessous avec :

- **Où** : URL de la page (ex : `/espace-eleve/mes-formations`)
- **Quoi** : ce qui se passe / ne se passe pas
- **Attendu** : ce que vous attendiez
- **Screenshot** si possible (par mail)

### Liste des bugs identifiés

| N° | Page / URL | Description du bug | Niveau (Bloquant / Important / Mineur) | Status |
|----|------------|--------------------|----------------------------------------|--------|
| 1  |            |                    |                                        | À corriger |
| 2  |            |                    |                                        |            |
| 3  |            |                    |                                        |            |
| 4  |            |                    |                                        |            |
| 5  |            |                    |                                        |            |

---

## Retours d'expérience (UX)

Au-delà des bugs purs, dites-moi ce que vous pensez de l'expérience générale :

1. **Le parcours de réservation est-il clair ?**


2. **Le design vous plaît-il ?** Couleurs, typo, ambiance ?


3. **Manque-t-il une information / fonctionnalité importante ?**


4. **Les emails (confirmation, convocation, facture) sont-ils clairs ?**


5. **Sur quelle partie pensez-vous que vos clients pourraient être perdus ?**


---

## Demandes de modification finales

Notez ici tout ce que vous voudriez voir modifié avant la mise en production officielle :

- [ ]
- [ ]
- [ ]
- [ ]
- [ ]

---

## Validation finale

Une fois tous les tests effectués, signez ci-dessous pour valider le passage en production :

**Date de fin de recette** : ___ / ___ / 2026

**Signature** :


_______________________

Sébastien — BYS Formation


---

**Contact prestataire pour toute question pendant la recette**
Andrys MAGAR
📧 andrys.developper@gmail.com
🌐 magar-developpement.fr
