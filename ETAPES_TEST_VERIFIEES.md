# Étapes de test — BYS Permis
## Plan point par point (vérifié le 28/05/2026)

> **URL** : https://bys-permis.vercel.app  
> **Durée totale** : ~1h30  
> **Légende statut** :
> - ✅ **Vérifié** — contrôle automatique ou test réussi
> - 🟡 **À tester** — étape manuelle à faire en navigateur lors du RDV
> - ⚠️ **Limitation** — fonctionne partiellement ou comportement attendu documenté

---

## Prérequis avant de commencer

| # | Étape | Résultat attendu | Statut |
|---|-------|------------------|--------|
| 0.1 | Ouvrir https://bys-permis.vercel.app | Page d'accueil s'affiche (HTTP 200) | ✅ |
| 0.2 | Vérifier `/api/health` | `{"status":"healthy","checks":{"db":"ok"}}` | ✅ |
| 0.3 | Avoir les identifiants Auth0 (emails ci-dessous) | Connexion possible | 🟡 |
| 0.4 | Carte Stripe test prête | `4242 4242 4242 4242` | 🟡 |

### Comptes de test

| Rôle | Email |
|------|-------|
| Owner (Sébastien) | `sebastien@bys-formation.fr` |
| Centre BYS Osny | `contact@bys-formation.fr` |
| Élève avec réservation | `karim.bouaziz@gmail.com` |

### Données en base (vérifiées)

| Donnée | Valeur |
|--------|--------|
| Utilisateurs | 89 |
| Centres | 8 |
| Formations actives | 9 |
| Sessions à venir | 9 |
| Réservations confirmées | 23 |
| Session bookable exemple | Permis Express Marseille — 18 places |

---

# PARTIE 1 — Site public (sans connexion)

## 1.1 Page d'accueil

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 1.1.1 | Aller sur `/` | Hero « Récupérez vos points », barre de recherche visible | ✅ |
| 1.1.2 | Vérifier le logo BYS en header | Logo affiché | 🟡 |
| 1.1.3 | Vérifier le bandeau agrément préfecture | Texte visible | 🟡 |
| 1.1.4 | Taper « Paris » dans la recherche → Rechercher | Redirection vers `/recherche?ville=Paris` | 🟡 |

## 1.2 Recherche de stages

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 1.2.1 | Aller sur `/recherche` | Liste de stages (HTTP 200) | ✅ |
| 1.2.2 | Filtrer par ville « Lyon » | Résultats filtrés | 🟡 |
| 1.2.3 | Filtrer par prix max | Résultats dans la fourchette | 🟡 |
| 1.2.4 | Trier par date / prix | Ordre change | 🟡 |
| 1.2.5 | Recherche « Zzzz » | Message « Aucun résultat » | 🟡 |

## 1.3 Carte des centres

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 1.3.1 | Aller sur `/centres` | Carte + liste centres (HTTP 200) | ✅ |
| 1.3.2 | API `/api/centres` | JSON avec centres (ex. BYS Cergy) | ✅ |
| 1.3.3 | Cliquer un marqueur sur la carte | Popup nom + adresse | 🟡 |
| 1.3.4 | Cliquer « Voir la fiche » | Page `/centres/[slug]` | 🟡 |

## 1.4 Fiche centre & formation

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 1.4.1 | Ouvrir `/centres/permis-express-marseille` | Fiche centre active | ✅ slug OK |
| 1.4.2 | Vérifier logo / bannière / couleurs | Affichage personnalisé si uploadés | 🟡 |
| 1.4.3 | Cliquer sur une formation | Page formation avec sessions | 🟡 |
| 1.4.4 | Cliquer « Réserver » sur une session | Redirection tunnel réservation | 🟡 |

## 1.5 Pages informatives

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 1.5.1 | `/comment-ca-marche` | Page lisible | 🟡 |
| 1.5.2 | `/faq` | Questions/réponses lisibles | 🟡 |
| 1.5.3 | `/blog` | Articles listés | 🟡 |
| 1.5.4 | `/contact` | Formulaire contact | 🟡 |
| 1.5.5 | `/mentions-legales` | Mentions légales BYS | 🟡 |

---

# PARTIE 2 — Parcours élève

## 2.1 Connexion / inscription

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 2.1.1 | Aller sur `/connexion` | Page Auth0 (HTTP 200) | ✅ |
| 2.1.2 | Se connecter `karim.bouaziz@gmail.com` | Redirection espace élève | 🟡 |
| 2.1.3 | Ou créer un nouveau compte `/inscription` | Compte créé + email bienvenue | 🟡 |

## 2.2 Réservation complète

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 2.2.1 | Choisir une session avec places (`/recherche`) | Session disponible en base | ✅ |
| 2.2.2 | Étape **Données** : remplir nom, prénom, permis, adresse | Validation OK, passage étape suivante | 🟡 |
| 2.2.3 | Étape **Éligibilité** : répondre au questionnaire | Passage au paiement | 🟡 |
| 2.2.4 | Étape **Paiement** : carte `4242 4242 4242 4242` | Paiement accepté | 🟡 |
| 2.2.5 | Page **Confirmation** | Numéro réservation affiché | 🟡 |
| 2.2.6 | Carte refusée `4000 0000 0000 0002` | Message erreur, pas de réservation | 🟡 |

## 2.3 Emails post-réservation

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 2.3.1 | Vérifier email **confirmation** | Reçu sous 2 min (vérifier spams) | 🟡 |
| 2.3.2 | Ouvrir **facture PDF** jointe | PDF valide, montant, SIRET | 🟡 |
| 2.3.3 | Vérifier email **convocation** | Reçu avec PDF joint | 🟡 |
| 2.3.4 | Ouvrir **convocation PDF** | Date, lieu, logo centre, zone cachet | ✅ génération PDF OK |

## 2.4 Espace élève — navigation

| # | Action | URL | Résultat attendu | Statut |
|---|--------|-----|------------------|--------|
| 2.4.1 | Dashboard | `/espace-eleve` | Page charge (HTTP 200) | ✅ |
| 2.4.2 | Mes réservations | `/espace-eleve/reservations` | Résa `RES-2026-0001` pour Karim | ✅ |
| 2.4.3 | Détail réservation | `/espace-eleve/reservations/[id]` | Infos session + actions PDF | 🟡 |
| 2.4.4 | Télécharger convocation | bouton sur fiche résa | PDF téléchargé | ✅ |
| 2.4.5 | Mes formations | `/espace-eleve/mes-formations` | Formation listée | 🟡 |
| 2.4.6 | Documents | `/espace-eleve/documents` | Facture + convocation listées | 🟡 |
| 2.4.7 | Paiements | `/espace-eleve/paiements` | Historique paiement | 🟡 |
| 2.4.8 | Mon profil | `/espace-eleve/profil` | Modifier téléphone → sauvegardé | 🟡 |
| 2.4.9 | Favoris | `/espace-eleve/favoris` | Ajouter/retirer favori | 🟡 |
| 2.4.10 | Notifications | `/espace-eleve/notifications` | Liste notifications | 🟡 |
| 2.4.11 | Fidélité | `/espace-eleve/fidelite` | Points fidélité | 🟡 |
| 2.4.12 | Mes avis | `/espace-eleve/avis` | Questionnaires en attente | 🟡 |

## 2.5 Support & messages élève

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 2.5.1 | `/espace-eleve/support` → Nouveau ticket | Ticket créé, visible dans la liste | 🟡 |
| 2.5.2 | Répondre au ticket | Message ajouté | 🟡 |
| 2.5.3 | `/espace-eleve/messages` | Liste conversations | ⚠️ Vide si aucun message échangé |
| 2.5.4 | Contacter le centre via Messages | Bouton « Nouveau message » | ⚠️ Non implémenté |

## 2.6 Annulation

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 2.6.1 | Mes réservations → Annuler | Modal confirmation | 🟡 |
| 2.6.2 | Confirmer annulation | Statut « Annulée » | 🟡 |
| 2.6.3 | Email annulation | Email reçu | 🟡 |

---

# PARTIE 3 — Espace centre

> Se connecter avec `contact@bys-formation.fr` (BYS Formation Osny)

## 3.1 Accès & thème

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 3.1.1 | Aller sur `/espace-centre` | Dashboard charge (HTTP 200) | ✅ |
| 3.1.2 | Vérifier sidebar aux couleurs du centre | Thème centre appliqué | 🟡 |
| 3.1.3 | Vérifier logo centre dans sidebar | Logo ou initiales | 🟡 |

## 3.2 Profil centre & personnalisation

| # | Action | URL | Résultat attendu | Statut |
|---|--------|-----|------------------|--------|
| 3.2.1 | Onglet Informations | `/espace-centre/profil-centre` | Nom, adresse, description | 🟡 |
| 3.2.2 | Onglet Design → couleurs | `?tab=design` | Preview live sidebar | 🟡 |
| 3.2.3 | Upload **logo** PNG | onglet Design | Logo sauvegardé + visible sidebar | 🟡 |
| 3.2.4 | Upload **bannière** | onglet Design | Bannière sur fiche publique | 🟡 |
| 3.2.5 | Upload **cachet numérique** PNG | onglet Design | URL enregistrée en DB | ✅ colonne OK |
| 3.2.6 | Nom responsable | onglet Design | Sauvegardé | ✅ |
| 3.2.7 | Sauvegarder profil | bouton Enregistrer | Message succès, pas d'erreur 500 | 🟡 |

## 3.3 Formations & sessions

| # | Action | URL | Résultat attendu | Statut |
|---|--------|-----|------------------|--------|
| 3.3.1 | Liste formations | `/espace-centre/formations` | Formations du centre | 🟡 |
| 3.3.2 | Créer formation | modal | Titre, prix, type stage, présentiel | 🟡 |
| 3.3.3 | Liste sessions | `/espace-centre/sessions` | Sessions à venir | 🟡 |
| 3.3.4 | Créer session 5 places | formulaire | **Refusé** (min. 6 stagiaires) | 🟡 |
| 3.3.5 | Créer session 10 places | formulaire | Session créée | 🟡 |
| 3.3.6 | Calendrier | `/espace-centre/calendrier` | Sessions visibles | 🟡 |

## 3.4 Gestion stagiaires & documents

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 3.4.1 | Session → voir stagiaires inscrits | Liste avec noms | 🟡 |
| 3.4.2 | Émargement collectif PDF | `/espace-centre/emargement` ou session | PDF généré | 🟡 |
| 3.4.3 | Émargement individuel | depuis réservation | PDF avec signatures | 🟡 |
| 3.4.4 | Contrats | `/espace-centre/contrats` | Liste + téléchargement PDF | 🟡 |
| 3.4.5 | Documents | `/espace-centre/documents` | Bons d'accord, templates | 🟡 |
| 3.4.6 | PDF convocation avec cachet | après upload cachet | Cachet visible zone signature | ✅ |

## 3.5 Facturation & paramètres

| # | Action | URL | Résultat attendu | Statut |
|---|--------|-----|------------------|--------|
| 3.5.1 | Facturation | `/espace-centre/facturation` | Historique paiements | 🟡 |
| 3.5.2 | Codes promo | `/espace-centre/promo` | CRUD codes | 🟡 |
| 3.5.3 | Paramètres → SIRET, IBAN | `/espace-centre/parametres` | Sauvegarde OK | 🟡 |
| 3.5.4 | Stripe Connect | onglet Paiement | Lien onboarding Stripe | 🟡 |
| 3.5.5 | Emails templates | `/espace-centre/emails` | Modifier + sauvegarder | 🟡 |
| 3.5.6 | Équipe | `/espace-centre/equipe` | Inviter membre | 🟡 |
| 3.5.7 | Statistiques | `/espace-centre/statistiques` | KPIs centre | 🟡 |
| 3.5.8 | Avis & questionnaires | `/espace-centre/avis` | Config questions | 🟡 |

## 3.6 Messages centre

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 3.6.1 | `/espace-centre/messages` | Page charge | ✅ |
| 3.6.2 | Liste stagiaires | Conversations existantes | ⚠️ Vide si 0 message |
| 3.6.3 | Contacter un stagiaire (1er message) | Bouton depuis session | ⚠️ Non implémenté |
| 3.6.4 | Répondre à un message existant | Envoi OK | 🟡 |

---

# PARTIE 4 — Admin & plateforme

> Se connecter avec `sebastien@bys-formation.fr`

| # | Action | URL | Résultat attendu | Statut |
|---|--------|-----|------------------|--------|
| 4.1 | Dashboard admin | `/admin/dashboard` | KPIs globaux | 🟡 |
| 4.2 | Dashboard plateforme | `/plateforme/dashboard` | Vue staff | 🟡 |
| 4.3 | Gestion centres | `/plateforme/centres` | Liste 8 centres, statuts | ✅ |
| 4.4 | Valider centre en attente | bouton Valider | Passe ACTIF + email | 🟡 |
| 4.5 | Utilisateurs | `/admin/utilisateurs` | Liste, filtres rôle | 🟡 |
| 4.6 | Changer rôle user | PATCH | Rôle mis à jour | 🟡 |
| 4.7 | Bloquer user | action Bloquer | Connexion impossible | 🟡 |
| 4.8 | Revenus | `/plateforme/revenus` | Commissions affichées | 🟡 |
| 4.9 | Tickets support | `/plateforme/tickets` | 15 tickets en base | ✅ |
| 4.10 | Modération | `/plateforme/moderation` | Centres en attente | 🟡 |
| 4.11 | Avis admin | `/admin/avis` | Modération questionnaires | 🟡 |
| 4.12 | Exports CSV | `/plateforme/exports` | Fichier téléchargé | 🟡 |
| 4.13 | Paramètres | `/admin/parametres` | Commission, maintenance | 🟡 |
| 4.14 | Blog admin | `/admin/blog` | CRUD articles | 🟡 |

---

# PARTIE 5 — Sécurité & responsive

| # | Action | Résultat attendu | Statut |
|---|--------|------------------|--------|
| 5.1 | `/admin/dashboard` sans connexion | Redirection `/connexion` | 🟡 |
| 5.2 | Élève accède `/espace-centre` | Accès refusé | 🟡 |
| 5.3 | Centre accède `/admin` | Accès refusé | 🟡 |
| 5.4 | 2 réservations dernière place | 2e refusée | 🟡 |
| 5.5 | Mobile 375px — accueil | Pas de débordement, menu burger | 🟡 |
| 5.6 | Tablette 768px — réservation | Layout 2 colonnes | 🟡 |

---

# PARTIE 6 — PDF & documents (checklist visuelle)

Cocher après ouverture des PDF :

| # | Document | Logo centre | Cachet | Contenu OK | Statut génération |
|---|----------|-------------|--------|------------|-------------------|
| 6.1 | Convocation | 🟡 | 🟡 | 🟡 | ✅ auto |
| 6.2 | Attestation | 🟡 | 🟡 | 🟡 | 🟡 |
| 6.3 | Contrat | 🟡 | 🟡 | 🟡 | 🟡 |
| 6.4 | Facture | 🟡 | N/A | 🟡 | 🟡 |
| 6.5 | Émargement collectif | 🟡 | 🟡 | 🟡 | 🟡 |
| 6.6 | Émargement individuel | 🟡 | 🟡 | 🟡 | 🟡 |

> **Note** : sans logo/cachet uploadé → initiales ou zone vide (normal).

---

# PARTIE 7 — Bugs à noter pendant le test

| N° | Étape # | Description | Priorité |
|----|---------|-------------|----------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Synthèse vérifications automatiques (28/05/2026)

| Contrôle | Résultat |
|----------|----------|
| TypeScript (`tsc --noEmit`) | ✅ OK |
| Site production HTTP 200 | ✅ 7/7 pages testées |
| API health + DB | ✅ `healthy`, latence ~668 ms |
| API centres | ✅ JSON valide |
| Données seed (users, centres, sessions) | ✅ 14/14 checks |
| Colonnes DB cachet (`signatureUrl`) | ✅ OK |
| Écriture DB cachet | ✅ OK |
| Génération PDF convocation | ✅ 7478 octets |
| PDF avec cachet simulé | ✅ 8153 octets |

## Scripts de re-vérification

```bash
cd byspermis
npx tsc --noEmit
npx tsx scripts/verify-platform-health.ts
npx tsx scripts/verify-seal-db.ts
npx tsx scripts/verify-seal-pdf.ts
```

---

**Contact** : Andrys MAGAR — andrys.developper@gmail.com
