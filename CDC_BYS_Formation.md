# CDC.md — Cahier des Charges Technique
# Plateforme BYS Formation — Version 3.0 — Mars 2026
# Document à partager dans Claude Code avec CLAUDE.md et PROMPT_CLAUDE_CODE_BYS.md

---

## 📌 IDENTIFICATION DU PROJET

| Champ | Valeur |
|-------|--------|
| **Nom du projet** | BYS Formation — Plateforme Marketplace |
| **Client** | BYS Formation — SAS — SIRET : 987 512 381 00011 |
| **Adresse client** | Bât. 7, 9 Chaussée Jules César, 95520 Osny |
| **Contact client** | Sébastien (dirigeant) — bysforma95@gmail.com |
| **Contact client 2** | Bilal (collaborateur) |
| **Prestataire** | Andrys MAGAR — Auto-entrepreneur |
| **SIRET prestataire** | 908 058 092 00028 |
| **IBAN** | FR94 3000 2011 4900 0003 5144 M30 — BIC : CRLYFRPP |
| **Budget signé** | 10 000 € TTC (remise 25,9% sur catalogue 13 500 €) |
| **Écheancier** | Acompte 2 000 € + 4 mensualités de 2 000 € |
| **Démarrage** | 9 mars 2026 |
| **Livraison** | 19 juillet 2026 (19 semaines) |
| **Version CDC** | 3.0 — Fusionné + enrichi (convocations, contrats) |

---

## 🎯 VISION & OBJECTIFS

### Vision produit
BYS Formation est la plateforme de référence pour les stages de récupération de points permis et formations professionnelles liées à la mobilité en France.

Elle résout 3 problèmes :
1. **Pour les conducteurs** : trouver rapidement un stage agréé proche, disponible et finançable CPF — réserver et recevoir sa convocation en quelques minutes
2. **Pour les centres de formation** : gérer leur activité entière depuis un seul dashboard — inscriptions, convocations automatiques, contrats, paiements, reporting
3. **Pour la plateforme** : monétiser via commission sur chaque réservation et/ou abonnement mensuel des centres partenaires

### Objectifs mesurables à 6 mois
- 50+ centres partenaires actifs
- 500+ réservations/mois
- Convocation automatique envoyée < 48h après réservation
- Taux de satisfaction élèves > 4.5/5
- Zéro panne en production (uptime > 99.5%)

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack technologique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework** | Next.js 14 (App Router) | SSR/SSG natif, API Routes intégrées, Vercel-native |
| **Langage** | TypeScript strict | Sécurité typage, autocomplétion, maintenabilité |
| **Base de données** | PostgreSQL 16 | Relationnel robuste, requêtes complexes, transactions |
| **ORM** | Prisma 5 | Migrations automatiques, typage BDD ↔ TypeScript |
| **Authentification** | Auth0 (@auth0/nextjs-auth0 v3) | SSO, gestion rôles, sécurité enterprise |
| **Paiement** | Stripe + Stripe Connect | PCI-DSS, commissions automatiques, abonnements |
| **Emails** | Resend | Délivrabilité, templates React, webhooks |
| **PDF** | @react-pdf/renderer | Convocations et contrats officiels |
| **Style** | Tailwind CSS 3 | Utility-first, cohérence design tokens |
| **Tests** | Jest + React Testing Library | Couverture composants + API |
| **CI/CD** | GitHub Actions | Lint + typecheck + tests automatiques |
| **Hébergement** | Vercel | Next.js natif, edge functions, déploiement automatique |
| **BDD hébergée** | Supabase ou Neon | PostgreSQL managé, backups automatiques |

### Architecture applicative

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS (Navigateur)                 │
│          Desktop / Mobile / Tablette (Responsive)       │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────┐
│              NEXT.JS 14 — App Router (Vercel)           │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Server Components│  │   Client Components ('use  │  │
│  │  (rendu serveur)  │  │   client') — interactivité │  │
│  └─────────┬─────────┘  └──────────────┬──────────────┘  │
│            │                           │                  │
│  ┌─────────▼───────────────────────────▼──────────────┐  │
│  │              API Routes (/api/*)                    │  │
│  │  Auth0 · Formations · Réservations · Stripe        │  │
│  │  Centres · Admin · Support · PDF · Webhooks        │  │
│  └─────────────────────┬───────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   SERVICES EXTERNES                       │
│  Auth0 (Auth) · Stripe (Paiement) · Resend (Emails)     │
│  Supabase/Neon (PostgreSQL) · Vercel Blob (Fichiers)    │
└───────────────────────────────────────────────────────────┘
```

### Structure des dossiers

```
bys-formation/
├── prisma/
│   ├── schema.prisma              # Schéma BDD (12 tables)
│   ├── migrations/                # Historique migrations
│   └── seed.ts                    # Données de test
├── public/
│   ├── fonts/                     # Plus Jakarta Sans + DM Sans
│   ├── icons/                     # SVG icônes custom
│   └── images/                    # Images statiques
├── src/
│   ├── app/
│   │   ├── (public)/              # Thème CLAIR — pages publiques
│   │   │   ├── layout.tsx         # Header + Footer public
│   │   │   ├── page.tsx           # Accueil marketplace
│   │   │   ├── recherche/         # Résultats + filtres
│   │   │   ├── formations/[slug]/ # Fiche formation détail
│   │   │   └── centres/[slug]/    # Profil centre public
│   │   ├── (auth)/                # Thème SOMBRE — authentification
│   │   │   ├── connexion/         # Page login navy/gold
│   │   │   └── inscription/       # Page signup navy/gold
│   │   ├── (booking)/             # Thème CLAIR — tunnel réservation
│   │   │   ├── layout.tsx         # Header tunnel + stepper
│   │   │   └── reserver/[sessionId]/
│   │   │       ├── connexion/     # Étape 1 — auth
│   │   │       ├── donnees/       # Étape 2 — infos personnelles
│   │   │       ├── paiement/      # Étape 3 — Stripe Elements
│   │   │       └── confirmation/  # Étape 4 — succès
│   │   ├── espace-eleve/          # Thème SOMBRE — dashboard élève
│   │   │   ├── layout.tsx         # DarkSidebar + fond navy
│   │   │   ├── page.tsx           # Dashboard élève
│   │   │   ├── reservations/      # Mes réservations
│   │   │   ├── formations/        # Mes cours
│   │   │   ├── calendrier/        # Calendrier sessions
│   │   │   ├── paiements/         # Historique paiements
│   │   │   ├── notifications/     # Mes notifications
│   │   │   └── profil/            # Modifier profil
│   │   ├── espace-centre/         # Thème SOMBRE — dashboard centre
│   │   │   ├── layout.tsx         # DarkSidebar centre + nav
│   │   │   ├── page.tsx           # Dashboard KPIs
│   │   │   ├── formations/        # CRUD formations
│   │   │   ├── sessions/          # Gestion créneaux
│   │   │   ├── reservations/      # Réservations reçues
│   │   │   ├── eleves/            # Liste élèves inscrits
│   │   │   ├── convocations/      # Gestion convocations
│   │   │   ├── contrats/          # Gestion contrats
│   │   │   ├── finances/          # CA + virements
│   │   │   └── parametres/        # Config centre + Stripe
│   │   ├── admin/                 # Thème SOMBRE — super-admin
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Dashboard global
│   │   │   ├── centres/           # Validation/suspension centres
│   │   │   ├── utilisateurs/      # Gestion users
│   │   │   ├── parametres/        # Commission, monétisation
│   │   │   └── reporting/         # Exports CSV
│   │   ├── support/               # Support tickets
│   │   ├── faq/                   # FAQ publique
│   │   └── api/                   # Toutes les routes API
│   │       ├── auth/[auth0]/      # Auth0 handler
│   │       ├── formations/        # CRUD public
│   │       ├── centres/           # CRUD public
│   │       ├── categories/        # Liste catégories
│   │       ├── reservations/      # Réservations élève
│   │       │   └── [id]/
│   │       │       ├── convocation/ # GET PDF convocation
│   │       │       └── contrat/     # GET PDF contrat
│   │       ├── stripe/
│   │       │   ├── connect/       # Onboarding Stripe Connect
│   │       │   └── subscriptions/ # Abonnements centres
│   │       ├── centre/            # API espace centre
│   │       │   ├── formations/
│   │       │   ├── sessions/
│   │       │   ├── reservations/
│   │       │   ├── dashboard/
│   │       │   └── eleves/
│   │       ├── admin/             # API super-admin
│   │       │   ├── dashboard/
│   │       │   ├── centres/
│   │       │   ├── users/
│   │       │   ├── settings/
│   │       │   └── export/
│   │       ├── tickets/           # API support
│   │       ├── notifications/     # Notifications user
│   │       ├── user/profile/      # Profil user
│   │       └── webhooks/stripe/   # Webhook Stripe
│   ├── components/
│   │   ├── ui/                    # Atomes réutilisables
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Spinner.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Header public clair
│   │   │   ├── Footer.tsx         # Footer public
│   │   │   └── DarkSidebar.tsx    # Sidebar espaces connectés
│   │   ├── marketplace/
│   │   │   ├── FormationCard.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FiltersSidebar.tsx
│   │   │   └── SessionSelector.tsx
│   │   ├── booking/
│   │   │   ├── BookingStepper.tsx
│   │   │   └── BookingSidebar.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── OccupancyChart.tsx
│   │   │   └── AlertCard.tsx
│   │   └── forms/
│   │       ├── PersonalDataForm.tsx
│   │       ├── FormationForm.tsx
│   │       └── SessionForm.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Client Prisma singleton
│   │   ├── stripe.ts              # Client Stripe
│   │   ├── auth0.ts               # Helpers Auth0
│   │   ├── utils.ts               # Utilitaires partagés
│   │   ├── email.ts               # Templates Resend
│   │   ├── convocation.ts         # Génération PDF convocations
│   │   └── contrat.ts             # Génération PDF contrats
│   └── types/
│       └── index.ts               # Types TypeScript globaux
├── __tests__/
│   ├── components/
│   ├── api/
│   └── lib/
├── .env.local                     # Variables locales (NE PAS COMMITTER)
├── .env.example                   # Template variables
├── CLAUDE.md                      # Guide Claude Code
├── CDC.md                         # Ce fichier
└── PROMPT_CLAUDE_CODE_BYS.md      # Prompt automatisation
```

---

## 📊 MODÈLE DE DONNÉES COMPLET

### Schéma Prisma (12 tables)

```prisma
// Voir prisma/schema.prisma pour le schéma complet

// Tables principales :
User              → auth0Id, email, nom, prenom, role, isBlocked
Centre            → userId, nom, slug, stripeAccountId, statut
Categorie         → nom, icon, couleur, ordre
Formation         → centreId, categorieId, titre, slug, prix, modalite
Session           → formationId, dateDebut, dateFin, placesTotal, placesRestantes
Reservation       → userId, sessionId, numero, statut, civilite, nom, prenom
Ticket            → userId, sujet, statut, priorite
TicketMessage     → ticketId, userId, contenu, fichier, isAdmin
FaqItem           → question, reponse, categorie, ordre
Notification      → userId, titre, contenu, type, isRead
PlatformSettings  → commissionRate, monetisationModel (singleton id="default")
```

### Relations clés
```
User (1) ←→ (1) Centre
Centre (1) ←→ (N) Formation
Formation (1) ←→ (N) Session
Session (1) ←→ (N) Reservation
User (1) ←→ (N) Reservation
User (1) ←→ (N) Ticket
Ticket (1) ←→ (N) TicketMessage
Formation (N) ←→ (1) Categorie
```

### Énumérations

```
Role              : ELEVE | CENTRE | ADMIN
ReservationStatus : EN_ATTENTE | CONFIRMEE | ANNULEE | REMBOURSEE | TERMINEE
SessionStatus     : ACTIVE | ANNULEE | COMPLETE | PASSEE
CentreStatus      : EN_ATTENTE | ACTIF | SUSPENDU
TicketStatus      : OUVERT | EN_COURS | RESOLU | FERME
TicketPriorite    : BASSE | NORMALE | HAUTE | URGENTE
Modalite          : PRESENTIEL | DISTANCIEL | HYBRIDE
MonetisationModel : ABONNEMENT | COMMISSION | HYBRIDE
SubscriptionStatus: ACTIVE | PAST_DUE | ANNULEE | TRIALING
```

---

## 🔐 SÉCURITÉ & AUTHENTIFICATION

### Rôles et permissions

| Rôle | Périmètre d'accès |
|------|-------------------|
| **PUBLIC** | Accueil, recherche, fiches formations, profil centre, FAQ |
| **ELEVE** | + Tunnel réservation, espace élève (réservations, profil, notifications, documents) |
| **CENTRE** | + Espace centre (dashboard, formations, sessions, élèves, convocations, finances, paramètres) |
| **ADMIN** | + Super-admin (tout — gestion globale, reporting, paramètres plateforme) |

### Règles de sécurité strictes

1. **Authentification** — 100% déléguée à Auth0. Jamais de mots de passe stockés en base.
2. **Autorisation** — Vérification rôle côté serveur sur CHAQUE API route protégée. Jamais côté client uniquement.
3. **Paiement** — 100% délégué à Stripe + Stripe Elements. Aucun numéro de carte ne transite par nos serveurs.
4. **Webhooks** — Signature Stripe vérifiée SYSTÉMATIQUEMENT via `stripe.webhooks.constructEvent()`.
5. **Race condition paiement** — Vérifier `session.placesRestantes > 0` avec transaction Prisma AVANT de créer le PaymentIntent.
6. **Commission** — Calculée UNIQUEMENT côté serveur. Jamais faire confiance à un montant envoyé par le client.
7. **RGPD** — Pas de log des données personnelles. Durée de conservation définie dans la politique de confidentialité.
8. **Variables d'env** — `.env.local` jamais commité. Toutes les clés en variables d'environnement Vercel en production.
9. **Validation inputs** — Zod sur TOUTES les entrées API routes. Aucune donnée non validée n'atteint Prisma.
10. **CORS** — Configuré dans next.config.js pour n'autoriser que le domaine de production.

### Middleware de protection des routes

```typescript
// src/middleware.ts
Routes protégées par rôle :
- /espace-eleve/* → ELEVE + CENTRE + ADMIN
- /espace-centre/* → CENTRE + ADMIN
- /admin/* → ADMIN uniquement
- /support/* → ELEVE + CENTRE + ADMIN
- /reserver/*/donnees → authentifié
- /reserver/*/paiement → authentifié
```

---

## 📋 SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### MODULE 1 — Marketplace publique (Phase 3)

#### 1.1 Page d'accueil (/)
**Objectif** : Convertir les visiteurs en inscrits / réservations

Sections obligatoires :
- Header sticky avec logo, navigation, connexion/inscription
- Hero avec badge "Agréé Ministère de l'Intérieur", H1, SearchBar 3 champs
- Tags recherches populaires (récupération de points, FIMO, AAC...)
- Bande statistiques (formations, centres, élèves formés, satisfaction)
- Grille catégories (8 catégories cliquables avec compteur)
- Formations à la une (6 cards dynamiques depuis BDD)
- Comment ça marche (4 étapes avec icônes)
- CTA Centres partenaires (avantages + stats + témoignage)
- FAQ accordion (5 questions populaires)
- Footer avec liens légaux

Données dynamiques : formations featured, catégories, compteurs stats
Performance cible : LCP < 2.5s, score Lighthouse > 85

#### 1.2 Recherche et résultats (/recherche)
**Objectif** : Permettre de trouver la formation parfaite en < 30 secondes

Fonctionnalités :
- Barre de recherche persistante (reprise des paramètres de l'accueil)
- Panel filtres gauche (sticky sur desktop, drawer sur mobile) :
  - Catégorie (checkboxes avec compteurs)
  - Prix (range slider 0 → 2000 €)
  - Durée (< 1 jour / 2 jours / 1 semaine / 1 mois+)
  - Modalité (Présentiel / Distanciel / Hybride)
  - Certifications (Qualiopi / CPF)
  - Département (texte libre)
- Tags filtres actifs (supprimables un par un)
- Sélecteur tri (Pertinence / Prix ↑ / Prix ↓ / Date prochaine session)
- Toggle vue grille / liste
- Compteur résultats "X formations trouvées"
- Grille cards avec pagination (20 par page)
- Message "Aucun résultat" avec suggestions alternatives

API : `GET /api/formations?q=&ville=&categorie=&modalite=&prixMin=&prixMax=&qualiopi=&cpf=&page=&limit=20`

#### 1.3 Fiche formation (/formations/[slug])
**Objectif** : Convaincre de réserver — taux de conversion cible > 15%

Sections :
- Hero gradient (titre, badges Qualiopi/CPF, méta-infos, lien profil centre)
- Sidebar sticky droite (prix, sélecteur sessions radio, bouton Réserver, avantages)
- Tabs de contenu : Programme / Objectifs / Infos pratiques / Prérequis
- Sélecteur sessions : liste sessions à venir avec date, horaire, places restantes
- Badge urgence si < 3 places restantes
- Bloc "Autres formations du centre" (2-3 cards)

Actions : Bouton Réserver → `/reserver/[sessionId]/connexion`

#### 1.4 Profil centre (/centres/[slug])
Sections :
- Hero (logo, nom, badges, stats : note / élèves formés / nb formations)
- Boutons : Contacter / Partager
- Infos contacts (adresse, téléphone, email, site web)
- Grille toutes les formations actives du centre
- Modal formulaire contact (protection anti-spam)

---

### MODULE 2 — Tunnel de réservation (Phase 4)

**Objectif** : Tunnel 4 étapes sans friction — taux de complétion cible > 70%

#### 2.1 Étape 1 — Connexion/Inscription (/reserver/[sessionId]/connexion)
- Si déjà connecté → redirect automatique étape 2
- SSO Google disponible
- Tabs : Email + Code OTP (sans mot de passe) / Email + Mot de passe
- Option "Créer un compte" intégrée dans le tunnel
- Sidebar récap session visible en permanence
- Persistance sessionId pendant le flux auth

#### 2.2 Étape 2 — Données personnelles (/reserver/[sessionId]/donnees)
- Formulaire : civilité (M./Mme), prénom, nom, email, téléphone, adresse, CP, ville
- Pré-remplissage automatique depuis le profil Auth0/BDD si connecté
- Validation en temps réel (Zod côté client)
- Sauvegarde draft automatique (localStorage) pour reprise si abandon
- Champ n° de permis (pour stages récupération de points)

#### 2.3 Étape 3 — Paiement (/reserver/[sessionId]/paiement)
- Bandeau CPF si formation éligible (avec lien moncompteformation.gouv.fr)
- Récapitulatif commande (formation, session, prix TTC)
- Sélecteur méthode : Carte bancaire / CPF / Virement bancaire
- Intégration Stripe Elements (CardElement)
- 3D Secure automatique si requis par la banque
- Gestion erreurs utilisateur (carte refusée → message clair + bouton réessayer)
- Badges sécurité : SSL 256-bit / Stripe / 3D Secure / RGPD

API séquence :
1. POST `/api/reservations/create-payment-intent` → `{ clientSecret, reservationId }`
2. `stripe.confirmCardPayment(clientSecret)` côté client
3. Webhook `payment_intent.succeeded` → confirme réservation en BDD + envoi emails

#### 2.4 Étape 4 — Confirmation (/reserver/[sessionId]/confirmation)
- Animation checkmark vert
- Numéro de réservation affiché (format BYS-2026-XXXX)
- "Email de confirmation envoyé à [email]"
- Cards : détail paiement / détail stage / prochaines étapes
- Documents téléchargeables : confirmation PDF + facture + convocation (générée sous 48h)
- CTA : "Voir mes réservations" + "Retour à l'accueil"

---

### MODULE 3 — Gestion automatique des documents (PRIORITÉ MÉTIER)

**C'est le cœur différenciateur de la plateforme**

#### 3.1 Convocations officielles

**Déclencheur** : 48h avant chaque session confirmée (Vercel Cron Job)
**Format** : PDF officiel A4

Contenu obligatoire :
```
EN-TÊTE
- Logo BYS Formation + mention "CONVOCATION OFFICIELLE"
- "Stage de sensibilisation à la sécurité routière et de prévention des risques"
- Arrêté du [date] — N° d'agrément préfectoral : [numéro]

IDENTIFICATION DE L'ÉLÈVE
- Nom, Prénom, Date et lieu de naissance
- Adresse complète
- N° de permis de conduire

DÉTAILS DU STAGE
- Centre organisateur (nom, adresse complète, téléphone)
- Dates et horaires (Jour 1 : X/XX de 9h à 17h30 / Jour 2 : X/XX de 9h à 17h30)
- Lieu exact (adresse + salle si précisé)
- Prix acquitté : XXX € (mention "Entièrement réglé")

DOCUMENTS À APPORTER
- Permis de conduire ORIGINAL obligatoire
- Pièce d'identité en cours de validité
- Cette convocation

MENTIONS LÉGALES
- Texte réglementaire Ministère de l'Intérieur
- Numéro de réservation : BYS-2026-XXXX
- Code QR de vérification

PIED DE PAGE
- "BYS Formation — SIRET : 987 512 381 00011"
- Date de génération
```

**Envoi** : Email automatique via Resend avec PDF en pièce jointe + disponible dans espace élève

#### 3.2 Contrats de formation

**Déclencheur** : Immédiatement après confirmation du paiement
**Format** : PDF officiel A4

Contenu obligatoire :
```
CONTRAT DE FORMATION PROFESSIONNELLE
(Article L.6353-3 du Code du Travail)

PARTIES
- L'organisme : [Nom centre], [SIRET], [Adresse], [N° déclaration activité]
- Le stagiaire : [Prénom Nom], [Adresse], [Email]

OBJET DE LA FORMATION
- Intitulé : [Titre de la formation]
- Objectifs pédagogiques : [Objectifs]
- Programme détaillé : [Programme]
- Durée totale : [X heures]
- Dates : du [date début] au [date fin]
- Lieu : [Adresse complète]
- Modalité : [Présentiel/Distanciel]

CONDITIONS FINANCIÈRES
- Prix total de la formation : [X] € TTC
- TVA non applicable (art. 261.4.4° du CGI) ou TVA applicable selon cas
- Mode de règlement : [Carte bancaire / CPF / Virement]
- Date de paiement : [Date]
- Numéro de transaction : [ID Stripe]

CONDITIONS D'ANNULATION ET RÉTRACTATION
- Droit de rétractation : 14 jours calendaires (si formation non commencée)
- Annulation après 14j : [conditions du centre]
- En cas de force majeure : report possible sur session ultérieure

ENGAGEMENTS DES PARTIES
- L'organisme s'engage à : [liste]
- Le stagiaire s'engage à : [liste]

SIGNATURES
- Lieu et date : _____________
- Pour l'organisme : _______________ [Cachet]
- Le stagiaire (mention "Lu et approuvé") : _______________

NUMÉRO CONTRAT : BYS-CTR-2026-XXXX
```

#### 3.3 Attestations de présence

**Déclencheur** : Manuel (le centre marque la session comme "terminée" dans son dashboard)
**Contenu** : Certifie la présence de l'élève, utilisé pour recréditer les points à la préfecture

#### 3.4 Factures

**Déclencheur** : Automatique à la confirmation du paiement
**Conformité** : Mentions obligatoires facture française (numéro, date, TVA, etc.)

---

### MODULE 4 — Espace Élève (Phase 6)

Navigation sidebar sombre :
- Dashboard (vue d'ensemble)
- Mes Réservations (liste avec statuts)
- Mes Documents (convocations, contrats, attestations, factures)
- Mon Calendrier (sessions à venir)
- Historique Paiements
- Mon Profil
- Support

#### 4.1 Dashboard élève
- KPIs : stages à venir / terminés / points récupérés / prochain stage
- Widget prochaines sessions (avec countdown et rappels)
- Notifications récentes (cloche avec badge)
- Actions rapides (Nouvelle formation / Télécharger convocation / Contact support)

#### 4.2 Mes Réservations
- Onglets : À venir / En cours / Terminées / Annulées
- Card réservation : titre, centre, date, statut badge coloré, montant
- Actions : Télécharger convocation / Voir contrat / Voir facture / Annuler (si > 48h)
- Countdown si stage dans < 7 jours
- Modal annulation avec conditions et confirmation

#### 4.3 Mes Documents
- Liste organisée par type (convocations, contrats, attestations, factures)
- Téléchargement PDF individuel
- Statut de chaque document (disponible / en cours de génération / à venir)

---

### MODULE 5 — Espace Centre (Phase 6)

Navigation sidebar sombre :
- Dashboard
- Formations (CRUD)
- Sessions / Créneaux
- Inscriptions reçues
- Élèves
- Convocations
- Contrats
- Finances
- Paramètres
- Support

#### 5.1 Dashboard centre
- KPIs : CA du mois / taux remplissage moyen / sessions à venir / nouvelles inscriptions
- Alertes opérationnelles :
  - Sessions avec < 2 places restantes (rouge)
  - Élèves sans convocation envoyée à J-3 (orange)
  - Paiements en attente (orange)
  - Compte Stripe non vérifié (jaune)
- Graphique CA mensuel (12 mois glissants)
- Graphique taux remplissage par formation
- Table prochaines sessions (avec barre progression remplissage)

#### 5.2 Gestion des formations
- Liste toutes les formations avec statut actif/inactif
- Créer/modifier formation :
  - Informations générales (titre, description, objectifs, programme)
  - Informations pratiques (durée, modalité, lieu, prix)
  - Certifications (Qualiopi, CPF)
  - Catégorie + image/gradient
  - Publication (actif/inactif)
- Soft delete avec avertissement si réservations actives

#### 5.3 Gestion des sessions
- Calendrier visuel des créneaux
- Créer session : date début/fin, heure début/fin, places total
- Vue remplissage en temps réel
- Fermer les inscriptions / Annuler une session (avec notification automatique aux inscrits)

#### 5.4 Inscriptions reçues
- Table : élève, formation, session, date inscription, statut, montant
- Filtres : statut, formation, période
- Export CSV des inscriptions

#### 5.5 Gestion convocations
- Liste élèves inscrits à chaque session
- Statut convocation : à envoyer / envoyée / confirmée
- Envoi manuel ou automatique (48h avant)
- Regénérer une convocation si erreur

#### 5.6 Gestion contrats
- Liste contrats générés par réservation
- Statut : généré / signé / archivé
- Téléchargement PDF
- (Futur : signature électronique)

#### 5.7 Finances
- CA mensuel / trimestriel / annuel
- Détail commissions prélevées par la plateforme
- Historique virements Stripe
- Statut compte Stripe Connect

#### 5.8 Paramètres centre
- Informations : nom, description, logo, adresse, contacts
- Stripe Connect : statut + lien vers dashboard Stripe
- Abonnement : plan actuel, date renouvellement, upgrade

---

### MODULE 6 — Super-Admin (Phase 7)

Navigation : Dashboard / Centres / Utilisateurs / Paramètres / Reporting / Support

#### 6.1 Dashboard global
- KPIs globaux : CA plateforme total / commissions / centres actifs / élèves total / réservations mois
- Alertes critiques : centres en attente de validation / paiements échoués
- Graphiques : évolution CA 12 mois / répartition par catégorie

#### 6.2 Gestion centres
- Liste tous les centres avec statut (EN_ATTENTE / ACTIF / SUSPENDU)
- Valider un centre : notification email automatique au centre
- Suspendre : email automatique + réservations bloquées
- Fiche centre : KPIs, formations, historique, Stripe Connect status

#### 6.3 Gestion utilisateurs
- Liste users avec rôle et statut
- Modifier rôle (via Auth0 Management API)
- Bloquer/débloquer (isBlocked en BDD + vérification middleware)

#### 6.4 Paramètres plateforme
- Taux de commission global (%) — modifie PlatformSettings
- Modèle de monétisation (ABONNEMENT / COMMISSION / HYBRIDE)
- Plans d'abonnement Stripe (créer/modifier produits)

#### 6.5 Reporting
- Export CSV réservations (tous filtres : période, centre, statut)
- Export logs paiements Stripe
- Rapport mensuel auto-généré (PDF)

---

### MODULE 7 — Support (Phase 7)

#### 7.1 Interface tickets (style messagerie)
- Layout 3 colonnes : liste tickets / conversation / détails
- Création ticket : sujet, catégorie, message, PJ (max 5 Mo)
- Fil de messages chronologique
- Statuts : OUVERT → EN_COURS → RESOLU → FERME
- Priorités : BASSE / NORMALE / HAUTE / URGENTE
- Notifications email à chaque réponse (via Resend)

#### 7.2 FAQ publique
- Accordion questions/réponses groupées par catégorie
- Recherche en temps réel (filtre côté client)
- CRUD FAQ dans le super-admin

---

## 📧 EMAILS AUTOMATIQUES (Resend)

| Déclencheur | Destinataire | Sujet | Contenu |
|-------------|-------------|-------|---------|
| Paiement confirmé | Élève | ✅ Réservation confirmée — [Formation] | N° résa, détails stage, liens documents |
| Paiement confirmé | Centre | 🆕 Nouvelle inscription — [Élève] | Infos élève, session, montant |
| 48h avant stage | Élève | 📋 Votre convocation — [Formation] demain | Convocation PDF en PJ |
| Annulation élève | Élève | ❌ Annulation confirmée — remboursement en cours | Confirmation + délai remboursement |
| Annulation élève | Centre | ⚠️ Annulation inscription — [Élève] | Info + libération place |
| Centre validé | Centre | ✅ Votre centre est validé ! | Bienvenue + guide démarrage |
| Centre suspendu | Centre | ⚠️ Suspension compte centre | Raison + démarche réactivation |
| Nouveau ticket | Support admin | 🎫 Nouveau ticket #[ID] | Contenu + lien admin |
| Réponse ticket | Utilisateur | 💬 Réponse à votre ticket #[ID] | Message support + lien ticket |

---

## 💳 INTÉGRATION STRIPE COMPLÈTE

### Flux paiement standard
```
1. Élève sélectionne session + saisit données personnelles
2. Front → POST /api/reservations/create-payment-intent
3. Back → vérifie placesRestantes (transaction Prisma)
4. Back → crée Reservation(statut=EN_ATTENTE) en BDD
5. Back → crée PaymentIntent Stripe (+ Application Fee si Connect)
6. Back → retourne { clientSecret }
7. Front → stripe.confirmCardPayment(clientSecret, { card })
8. Stripe → 3DS si requis par la banque
9. Stripe → webhook payment_intent.succeeded
10. Back webhook → Reservation(statut=CONFIRMEE) + Session(placesRestantes-1)
11. Back webhook → sendConfirmationEmail() via Resend
12. Back webhook → createNotification() pour l'élève
13. Front → redirect /confirmation
```

### Stripe Connect (centres)
```
1. Centre clique "Connecter Stripe" dans paramètres
2. Front → POST /api/stripe/connect/link
3. Back → stripe.accountLinks.create({ type: 'account_onboarding' })
4. Back → retourne { url } → redirect vers Stripe KYC
5. Stripe → webhook account.updated (charges_enabled = true)
6. Back webhook → Centre(stripeOnboardingDone=true)
7. Paiements suivants → transfer_data: { destination: centre.stripeAccountId }
8. Stripe préserve la commission côté plateforme (application_fee_amount)
9. Le reste est viré automatiquement au centre
```

### Commission automatique
```typescript
// Calcul côté serveur uniquement
const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } })
const tauxCommission = settings.commissionRate / 100  // ex: 0.10 pour 10%
const montantTTC = session.formation.prix
const commissionCentimes = Math.round(montantTTC * tauxCommission * 100)
const montantCentreCentimes = Math.round(montantTTC * 100) - commissionCentimes
```

---

## 🧪 STRATÉGIE DE TESTS

### Couverture cible

| Type | Cible | Outil |
|------|-------|-------|
| Composants UI | 80%+ | Jest + React Testing Library |
| API Routes | 90%+ | Jest (mock Prisma + Stripe) |
| Lib utils | 100% | Jest |
| Génération PDF | 70%+ | Jest (snapshot PDF) |
| E2E critiques | Parcours principaux | Playwright (Phase 8) |

### Tests critiques obligatoires

```
✅ FormationCard — rendu, clic réserver
✅ SearchBar — saisie, soumission formulaire
✅ BookingStepper — progression étapes
✅ FiltersSidebar — filtres checkboxes + range
✅ GET /api/formations — avec/sans filtres, pagination
✅ POST /api/reservations/create-payment-intent — succès, places épuisées, non authentifié
✅ Webhook payment_intent.succeeded — confirmation, email, notification
✅ GET /api/reservations/[id]/convocation — PDF généré, accès non autorisé
✅ PATCH /api/admin/centres/[id] — validation centre, email auto
✅ lib/utils.ts — formatPrice, formatDate, slugify
✅ lib/convocation.ts — génération PDF avec données test
✅ lib/contrat.ts — génération PDF avec données test
```

---

## 🚀 DÉPLOIEMENT ET INFRASTRUCTURE

### Environnements

| Env | URL | BDD | Stripe | Auth0 |
|-----|-----|-----|--------|-------|
| **Développement** | localhost:3000 | Supabase dev | Mode test | Tenant dev |
| **Preview** | [branch].vercel.app | Supabase dev | Mode test | Tenant dev |
| **Production** | bys-formation.fr | Supabase prod | Mode live | Tenant prod |

### Variables d'environnement

```bash
# Base de données
DATABASE_URL=""           # postgresql://...

# Auth0
AUTH0_SECRET=""           # openssl rand -base64 32
AUTH0_BASE_URL=""         # https://bys-formation.fr en prod
AUTH0_ISSUER_BASE_URL=""  # https://[tenant].auth0.com
AUTH0_CLIENT_ID=""
AUTH0_CLIENT_SECRET=""
AUTH0_MANAGEMENT_CLIENT_ID=""      # Pour assigner les rôles
AUTH0_MANAGEMENT_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""                    # sk_live_... en prod
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""   # pk_live_... en prod
STRIPE_WEBHOOK_SECRET=""                # whsec_...

# Email
RESEND_API_KEY=""
EMAIL_FROM="noreply@bys-formation.fr"

# App
NEXT_PUBLIC_APP_URL=""   # https://bys-formation.fr
COMMISSION_RATE="0.10"   # 10% par défaut (modifiable via admin)
```

### Checklist déploiement production

```
□ npm run build — build sans erreur
□ npm test -- --coverage — coverage ≥ cibles
□ Audit sécurité — toutes routes protégées testées
□ Variables Vercel — toutes les vars production configurées
□ Auth0 — callback URLs production configurées
□ Stripe — clés live + webhook endpoint production
□ BDD production — migration + seed minimal
□ Domaine — DNS configuré + SSL Vercel
□ Stripe live — 1 paiement test réel validé
□ Email — 1 email test envoyé depuis prod
□ Convocation — 1 PDF test généré
□ Contrat — 1 PDF test généré
```

---

## 📐 DESIGN SYSTEM RÉSUMÉ

### Thème CLAIR (pages publiques)
```
Fond :      #F9FAFB / #FFFFFF
Bordures :  #E5E7EB
Texte :     #111827
Accent :    #3B82F6 (bleu)
Hover :     #2563EB
Fonts :     "Plus Jakarta Sans" (titres) + "DM Sans" (corps)
```

### Thème SOMBRE (espaces connectés)
```
Fond :      #0A1628 (navy profond)
Cards :     #0D1D3A
Bordures :  rgba(255,255,255,0.07)
Texte :     #F0F4FF
Secondaire: #8BA3CC
Accent :    #E8A020 (gold)
Hover :     #F5B84C
Fonts :     "Plus Jakarta Sans" (titres) + "DM Sans" (corps)
```

### Breakpoints responsive
```
Mobile :  375px → 767px   (grille 1 col, sidebar drawer)
Tablet :  768px → 1023px  (grille 2 cols, sidebar collapsible)
Desktop : 1024px → 1440px (grille 3-4 cols, sidebar fixe 256px)
```

---

## 📅 PLANNING SYNTHÈSE

| Phase | Contenu | Durée | Statut |
|-------|---------|-------|--------|
| 1 | Infrastructure, BDD, CI/CD, design system | S1-S2 | ✅ Terminé |
| 2 | Auth0, connexion/inscription, rôles, middleware | S3-S4 | 🔄 En cours |
| 3 | Marketplace publique (accueil, recherche, fiches, profils) | S5-S7 | ⬜ À faire |
| 4 | Tunnel réservation 4 étapes + Stripe paiement | S8-S10 | ⬜ À faire |
| 5 | Stripe Connect + commissions + abonnements | S11-S12 | ⬜ À faire |
| 6 | Espaces Élève + Centre + convocations + contrats | S13-S15 | ⬜ À faire |
| 7 | Support tickets + Super-Admin + reporting | S16-S17 | ⬜ À faire |
| 8 | Tests E2E + audit sécurité + déploiement prod | S18-S19 | ⬜ À faire |

---

## 🔗 DOCUMENTS CONNEXES

- `CLAUDE.md` — Guide d'automatisation Claude Code
- `PROMPT_CLAUDE_CODE_BYS.md` — Prompt développement phase par phase
- `prisma/schema.prisma` — Schéma base de données complet
- `prisma/seed.ts` — Données de test
- `.env.example` — Template variables d'environnement

---

*CDC v3.0 — Andrys MAGAR pour BYS Formation — Mars 2026*
*Ce document est confidentiel. Usage interne uniquement.*
