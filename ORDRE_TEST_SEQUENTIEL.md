# Ordre de mise en place & tests séquentiels — BYS Permis

> **Objectif** : suivre les étapes **dans l'ordre** (Owner → Centre → Admin → Élève → Paiement → Documents).  
> Chaque étape indique : **qui**, **écran**, **API appelée**, **données échangées**, **vérif**.

**URL** : `https://bys-permis.vercel.app`

---

## Vue d'ensemble du flux

```
[0] Santé infra
    ↓
[1] OWNER — config plateforme + dashboard
    ↓
[2] OWNER/ADMIN — inviter ou valider un CENTRE
    ↓
[3] CENTRE_OWNER — onboarding profil (100 %)
    ↓
[4] CENTRE_OWNER — formation + session
    ↓
[5] ÉLÈVE — inscription + réservation
    ↓
[6] STRIPE — paiement (PaymentIntent + webhook)
    ↓
[7] Emails + PDF (convocation, facture)
    ↓
[8] CENTRE — émargement, contrats, stats
    ↓
[9] STAFF plateforme (Support, Comptable…)
```

---

# PHASE 0 — Infrastructure (sans connexion)

| Étape | Action | API | Réponse attendue | Vérif |
|-------|--------|-----|------------------|-------|
| **0.1** | Ouvrir le site | `GET /` | HTTP 200, page accueil | ☐ |
| **0.2** | Santé serveur + DB | `GET /api/health` | `{ "status":"healthy", "checks":{"db":"ok"} }` | ☐ |
| **0.3** | Liste centres publics | `GET /api/centres` | JSON `[{ id, nom, slug, ville… }]` | ☐ |
| **0.4** | Recherche formations | `GET /api/formations?ville=Paris` | JSON formations + sessions | ☐ |

**Données lues** : table `centres`, `formations`, `sessions` (lecture seule).

---

# PHASE 1 — OWNER (Sébastien)

> **Compte** : `sebastien@bys-formation.fr`  
> **Rôle Auth0** : `OWNER`  
> **Redirection après login** : `/admin/dashboard`

## 1.1 Connexion Owner

| Étape | Action | API / flux | Données | Vérif |
|-------|--------|------------|---------|-------|
| **1.1.1** | Aller sur `/connexion` | Auth0 Universal Login | email + password | ☐ |
| **1.1.2** | Après login | `GET /api/auth/me` | `{ id, email, role: "OWNER" }` | ☐ |
| **1.1.3** | Profil complet | `GET /api/users/me` | user + stats | ☐ |
| **1.1.4** | Dashboard | `GET /api/admin/stats` | KPIs (CA, centres, réservations) | ☐ |

**Échange Auth0 → App** :
```
Auth0 session (cookie) → getCurrentUser() → sync role en DB (table users)
```

## 1.2 Paramètres plateforme

| Étape | Écran | API | Body / effet | Vérif |
|-------|-------|-----|--------------|-------|
| **1.2.1** | `/admin/parametres` | `GET /api/admin/settings` | commissionRate, maintenanceMode | ☐ |
| **1.2.2** | Modifier commission (ex. 10 %) | `PUT /api/admin/settings` | `{ commissionRate: 0.10 }` | ☐ |
| **1.2.3** | Relire settings | `GET /api/admin/settings` | valeur persistée en DB | ☐ |

**Table touchée** : `PlatformSettings` (ou équivalent config).

## 1.3 Dashboard & analytics

| Étape | Écran | API | Vérif |
|-------|-------|-----|-------|
| **1.3.1** | `/admin/dashboard` | `GET /api/admin/stats` | ☐ |
| **1.3.2** | `/admin/statistiques` | `GET /api/admin/analytics` | ☐ |
| **1.3.3** | `/plateforme/revenus` | `GET /api/admin/revenus` | ☐ |
| **1.3.4** | `/plateforme/exports` | `GET /api/admin/exports` | CSV téléchargé | ☐ |

---

# PHASE 2 — Création / activation d'un CENTRE

> Deux chemins possibles — choisir **un seul** pour la démo.

## Chemin A — Invitation par Admin (recommandé démo)

| Étape | Qui | Écran | API | Données créées | Vérif |
|-------|-----|-------|-----|----------------|-------|
| **2A.1** | OWNER/ADMIN | `/plateforme/centres` ou admin centres | `GET /api/admin/centres` | liste centres | ☐ |
| **2A.2** | OWNER/ADMIN | Inviter un centre | `POST /api/admin/centres/invite` | voir body ci-dessous | ☐ |
| **2A.3** | — | Email auto | Resend → email invitation | compte Auth0 + centre EN_ATTENTE | ☐ |
| **2A.4** | Nouveau centre | `/connexion` (mdp email) | Auth0 login | role `CENTRE_OWNER` | ☐ |

**Body `POST /api/admin/centres/invite`** :
```json
{
  "nom": "Auto Ecole Demo",
  "email": "demo-centre@example.com",
  "ville": "Osny",
  "adresse": "9 Chaussée Jules César",
  "codePostal": "95520",
  "telephone": "01 34 00 00 00",
  "siret": "12345678901234"
}
```

**Réponse attendue** : `201` — `{ centre: { id, slug, statut: "EN_ATTENTE" }, tempPassword }`

**Tables écrites** :
- `users` (CENTRE_OWNER, auth0Id)
- `centres` (statut EN_ATTENTE, profilCompletionPct ~20 %)

## Chemin B — Centre existant (seed)

| Étape | Qui | Action | Vérif |
|-------|-----|--------|-------|
| **2B.1** | — | Utiliser centre seed | `contact@bys-formation.fr` → BYS Osny | ☐ |
| **2B.2** | OWNER | Vérifier statut | `GET /api/admin/centres` → statut `ACTIF` | ☐ |

## 2.5 Validation admin du centre

| Étape | Qui | Écran | API | Effet DB | Vérif |
|-------|-----|-------|-----|----------|-------|
| **2.5.1** | CENTRE_OWNER | Compléter profil à 100 % | (voir Phase 3) | profilCompletionPct = 100 | ☐ |
| **2.5.2** | CENTRE_OWNER | Demander validation | `POST /api/centre/request-validation` | notifications → admins | ☐ |
| **2.5.3** | OWNER/ADMIN | Valider le centre | `POST /api/admin/centres/[id]/validate` | statut ACTIF, isActive true | ☐ |
| **2.5.4** | — | Email activation | sendCentreActivationEmail | email owner | ☐ |
| **2.5.5** | — | Fiche publique | `GET /api/centres/[slug]` | centre visible marketplace | ☐ |

**Réponse `POST validate`** :
```json
{ "success": true, "centre": { "statut": "ACTIF", "isActive": true } }
```

---

# PHASE 3 — CENTRE_OWNER : onboarding profil

> **Compte** : `contact@bys-formation.fr` (ou centre invité Phase 2)  
> **Redirection** : `/espace-centre/dashboard`

## 3.1 Connexion & contexte centre

| Étape | API | Réponse | Vérif |
|-------|-----|---------|-------|
| **3.1.1** | `GET /api/auth/me` | role `CENTRE_OWNER` | ☐ |
| **3.1.2** | `GET /api/centre/me` | nom, logo, signatureUrl, couleurs… | ☐ |
| **3.1.3** | `GET /api/centre/completion` | `{ percentage: N }` | ☐ |
| **3.1.4** | `GET /api/users/me` | activeCentreId | ☐ |

## 3.2 Profil centre — informations

| Étape | Écran | API | Body (extrait) | Vérif |
|-------|-------|-----|----------------|-------|
| **3.2.1** | `/espace-centre/profil-centre` onglet Infos | `PUT /api/centre/me` | nom, description, adresse, siret agrément | ☐ |
| **3.2.2** | Relire profil | `GET /api/centre/me` | champs persistés | ☐ |

## 3.3 Design — logo, bannière, cachet

| Étape | Action UI | API | Effet | Vérif |
|-------|-----------|-----|-------|-------|
| **3.3.1** | Upload logo | `POST /api/centre/upload` multipart `kind=logo` | `centres.logo` = URL Blob | ☐ |
| **3.3.2** | Upload bannière | `POST /api/centre/upload` `kind=bannerImage` | `centres.bannerImage` | ☐ |
| **3.3.3** | Upload cachet | `POST /api/centre/upload` `kind=signature` | `centres.signatureUrl` | ☐ |
| **3.3.4** | Couleurs + nom responsable | `PUT /api/centre/me` | couleurPrimaire, nomResponsable | ☐ |
| **3.3.5** | Preview thème sidebar | (client) dispatchCentreThemePreview | CSS vars appliquées | ☐ |

**Upload response** :
```json
{ "url": "https://….blob.vercel-storage.com/…", "kind": "signature", "storage": "blob" }
```

## 3.4 Paramètres juridiques & Stripe

| Étape | Écran | API | Vérif |
|-------|-------|-----|-------|
| **3.4.1** | `/espace-centre/parametres` | `PATCH /api/centre/me` | SIRET, IBAN, mentions légales | ☐ |
| **3.4.2** | Stripe Connect | `POST /api/stripe/connect` | URL onboarding Stripe | ☐ |
| **3.4.3** | Abonnement centre | `GET /api/stripe/subscription` | statut abonnement | ☐ |

## 3.5 Vérifier complétion 100 %

| Étape | API | Condition | Vérif |
|-------|-----|-----------|-------|
| **3.5.1** | `GET /api/centre/completion` | `percentage >= 100` | ☐ |
| **3.5.2** | Demander validation | `POST /api/centre/request-validation` | 200 (si pas déjà ACTIF) | ☐ |

---

# PHASE 4 — CENTRE : formation & session

## 4.1 Créer une formation

| Étape | Écran | API | Body (extrait) | Table | Vérif |
|-------|-------|-----|----------------|-------|-------|
| **4.1.1** | `/espace-centre/formations` | `GET /api/centre/formations` | — | lecture | ☐ |
| **4.1.2** | Nouvelle formation | `POST /api/centre/formations` | titre, prix, duree, typeStage, modalite PRESENTIEL | `formations` | ☐ |
| **4.1.3** | Modifier | `PUT /api/centre/formations/[id]` | — | update | ☐ |

## 4.2 Créer une session

| Étape | Écran | API | Body | Vérif |
|-------|-------|-----|------|-------|
| **4.2.1** | `/espace-centre/sessions` | `GET /api/centre/sessions` | liste sessions centre | ☐ |
| **4.2.2** | Test refus 5 places | `POST /api/centre/sessions` | `{ placesTotal: 5 }` → **400** min 6 | ☐ |
| **4.2.3** | Créer session OK | `POST /api/centre/sessions` | dateDebut, dateFin, placesTotal: 10 | ☐ |
| **4.2.4** | Vérifier marketplace | `GET /api/formations?…` | session visible, placesRestantes = 10 | ☐ |

**Tables** : `sessions` (status ACTIVE, placesRestantes = placesTotal).

## 4.3 Équipe centre (optionnel)

| Étape | API | Effet | Vérif |
|-------|-----|-------|-------|
| **4.3.1** | `GET /api/centre/membres` | liste membres | ☐ |
| **4.3.2** | `POST /api/centre/membres` | invite CENTRE_FORMATEUR / SECRETAIRE | ☐ |

---

# PHASE 5 — ADMIN staff (si besoin avant élève)

> Créer les rôles plateforme **avant** de tester le support.

| Étape | Qui | Écran | API | Rôle créé | Vérif |
|-------|-----|-------|-----|-----------|-------|
| **5.1** | OWNER | `/admin/utilisateurs` | `GET /api/admin/users` | liste | ☐ |
| **5.2** | OWNER | Créer user Support | `POST /api/admin/users` | `{ role: "SUPPORT" }` | ☐ |
| **5.3** | OWNER | Créer user Comptable | `POST /api/admin/users` | `{ role: "COMPTABLE" }` | ☐ |
| **5.4** | SUPPORT | Login → `/plateforme/dashboard` | `GET /api/auth/me` | role SUPPORT | ☐ |
| **5.5** | SUPPORT | Tickets | `GET /api/admin/tickets` | 15 tickets seed | ☐ |

**Hiérarchie rôles** (niveau décroissant) :
```
OWNER > ADMIN > COMPTABLE/COMMERCIAL/SUPPORT > CENTRE_* > ELEVE
```

---

# PHASE 6 — ÉLÈVE : inscription & réservation

> **Compte test** : `karim.bouaziz@gmail.com` ou nouveau compte créé live.

## 6.1 Inscription / connexion

| Étape | Écran | API | Effet | Vérif |
|-------|-------|-----|-------|-------|
| **6.1.1** | `/inscription` | Auth0 signup | user ELEVE en DB | ☐ |
| **6.1.2** | ou `/connexion` | Auth0 login | session cookie | ☐ |
| **6.1.3** | — | `GET /api/auth/me` | role `ELEVE` | ☐ |
| **6.1.4** | — | `GET /api/users/me` | profil élève | ☐ |

## 6.2 Tunnel réservation (UI)

| Étape | Écran | Données saisies | Vérif |
|-------|-------|-----------------|-------|
| **6.2.1** | `/reserver/[sessionId]` | choix session (noter sessionId) | ☐ |
| **6.2.2** | Étape Données | nom, prénom, permis, adresse | ☐ |
| **6.2.3** | Étape Éligibilité | cas stage, attestations | ☐ |
| **6.2.4** | Étape Paiement | → voir Phase 7 | ☐ |

---

# PHASE 7 — PAIEMENT STRIPE (cœur transactionnel)

> **Ordre strict des appels API** — ne pas inverser.

```
UI Paiement
  → POST /api/stripe/create-payment-intent
  → Stripe.js confirme carte
  → POST /api/reservations (finalise)
  → (async) POST /api/webhooks/stripe payment_intent.succeeded
  → emails + PDF
```

## 7.1 Réserver une place (atomique)

| Étape | API | Body | Effet DB | Vérif |
|-------|-----|------|----------|-------|
| **7.1.1** | `POST /api/stripe/create-payment-intent` | `{ "sessionId": "…" }` | `reservations` EN_ATTENTE_PAIEMENT, placesRestantes - 1 | ☐ |
| **7.1.2** | Réponse | `{ clientSecret, reservationId }` | noter reservationId | ☐ |

## 7.2 Confirmer paiement (front Stripe)

| Étape | Action | Carte test | Vérif |
|-------|--------|------------|-------|
| **7.2.1** | Stripe Elements | `4242 4242 4242 4242` | payment_intent succeeded | ☐ |
| **7.2.2** | Refus (test) | `4000 0000 0000 0002` | erreur, place libérée (cron 30 min) | ☐ |

## 7.3 Finaliser réservation

| Étape | API | Body | Effet | Vérif |
|-------|-----|------|-------|-------|
| **7.3.1** | `POST /api/reservations` | sessionId, données élève, stripePaymentIntentId | status → CONFIRMEE | ☐ |
| **7.3.2** | Webhook Stripe | `POST /api/webhooks/stripe` | sync statut, idempotent (WebhookEvent) | ☐ |
| **7.3.3** | Commission | calcul interne | CentrePayment 90 % / commission 10 % | ☐ |

## 7.4 Vérifier côté élève

| Étape | API | Vérif |
|-------|-----|-------|
| **7.4.1** | `GET /api/reservations` | résa CONFIRMEE avec numero | ☐ |
| **7.4.2** | `GET /api/reservations/[id]` | détail session + centre | ☐ |
| **7.4.3** | `GET /api/invoices` | facture liée | ☐ |

---

# PHASE 8 — DOCUMENTS & EMAILS (post-paiement)

## 8.1 Génération PDF (API)

| Étape | API | Auth | Fichier | Vérif |
|-------|-----|------|---------|-------|
| **8.1.1** | `GET /api/convocation/[reservationId]` | élève owner | convocation.pdf | ☐ |
| **8.1.2** | `GET /api/invoices/[id]` | élève | facture.pdf | ☐ |
| **8.1.3** | `GET /api/contrats/[reservationId]` | élève/centre | contrat.pdf + cachet | ☐ |
| **8.1.4** | `GET /api/attestations/[reservationId]` | après stage | attestation.pdf | ☐ |
| **8.1.5** | `GET /api/emargement/[reservationId]` | élève | émargement individuel | ☐ |

**Données lues pour PDF** :
```
reservation → session → formation → centre (logo, signatureUrl, nomResponsable)
resolveCentreLogoUrl(centre.logo)
resolveCentreSealUrl(centre.signatureUrl)
```

## 8.2 Emails (async Resend)

| Étape | Déclencheur | Contenu | Vérif |
|-------|-------------|---------|-------|
| **8.2.1** | POST /api/reservations | Email confirmation + facture PDF jointe | ☐ |
| **8.2.2** | idem | Email convocation + PDF joint | ☐ |
| **8.2.3** | Centre notifié | sendCentreNotificationEmail | ☐ |

## 8.3 Espace élève documents

| Étape | API | Vérif |
|-------|-----|-------|
| **8.3.1** | `GET /api/eleve/documents` | liste docs | ☐ |
| **8.3.2** | Bon d'accord | `POST /api/eleve/documents/[id]/accept` | ☐ |

---

# PHASE 9 — CENTRE : exploitation post-réservation

| Étape | Écran | API | Vérif |
|-------|-------|-----|-------|
| **9.1** | Sessions → stagiaires | `GET /api/centre/sessions` | nom élève visible | ☐ |
| **9.2** | Émargement collectif | `GET /api/centre/sessions/[id]/emargement` | PDF avec cachet centre | ☐ |
| **9.3** | Contrats | `GET /api/centre/contrats` | liste contrats | ☐ |
| **9.4** | Facturation | `GET /api/centre/payments` | paiements reçus | ☐ |
| **9.5** | Stats | `GET /api/centre/stats` | KPIs centre | ☐ |
| **9.6** | Questionnaires | `GET /api/centre/questionnaires` | config questions | ☐ |
| **9.7** | Exports | `GET /api/centre/exports` | CSV | ☐ |

---

# PHASE 10 — ÉLÈVE : après le stage

| Étape | API | Vérif |
|-------|-----|-------|
| **10.1** | `GET /api/questionnaires/pending` | questionnaire dispo post-émargement | ☐ |
| **10.2** | `GET /api/questionnaires/[reservationId]` | questions centre | ☐ |
| **10.3** | `POST /api/questionnaires/submit` | notes 0.5 étoiles | ☐ |
| **10.4** | `PATCH /api/reservations/[id]` | annulation (si éligible) | ☐ |

---

# PHASE 11 — Support & messages

## 11.1 Tickets support

| Étape | Qui | API | Vérif |
|-------|-----|-----|-------|
| **11.1.1** | ÉLÈVE | `POST /api/tickets` `{ sujet, message }` | ticket créé | ☐ |
| **11.1.2** | ÉLÈVE | `GET /api/tickets` | liste mes tickets | ☐ |
| **11.1.3** | SUPPORT | `GET /api/admin/tickets` | voir tous tickets | ☐ |
| **11.1.4** | SUPPORT | `POST /api/tickets/[id]` | réponse | ☐ |

## 11.2 Messages direct (limitation)

| Étape | API | Condition | Vérif |
|-------|-----|-----------|-------|
| **11.2.1** | `GET /api/messages` | — | liste conversations (vide si 0 msg) | ☐ |
| **11.2.2** | `POST /api/messages` | canMessage() = résa commune | ⚠️ pas de bouton UI 1er message | ☐ |
| **11.2.3** | `GET /api/messages/[userId]` | thread | ☐ |

**Règle `canMessage`** : réservation commune OU ticket OU staff plateforme OU thread existant.

---

# PHASE 12 — Notifications & divers

| Étape | API | Vérif |
|-------|-----|-------|
| **12.1** | `GET /api/notifications` | liste + unreadCount | ☐ |
| **12.2** | `PATCH /api/notifications` | marquer lu | ☐ |
| **12.3** | `GET /api/favorites` + POST/DELETE | favoris centres | ☐ |
| **12.4** | `GET /api/loyalty` | points fidélité | ☐ |
| **12.5** | `POST /api/contact` | formulaire public contact | ☐ |

---

# Récap — ordre minimal pour une démo complète (45 min)

| # | Phase | Durée | Compte |
|---|-------|-------|--------|
| 1 | 0 — Health + site public | 3 min | — |
| 2 | 1 — Owner dashboard + settings | 5 min | sebastien@… |
| 3 | 2 — Valider / montrer centre actif | 5 min | owner + centre |
| 4 | 3 — Profil centre + cachet upload | 8 min | contact@bys-… |
| 5 | 4 — Formation + session | 5 min | contact@bys-… |
| 6 | 6–7 — Réservation + paiement 4242 | 10 min | élève |
| 7 | 8 — PDF convocation + emails | 5 min | élève |
| 8 | 9 — Émargement + stats centre | 4 min | centre |

---

# Scripts de vérification auto

```bash
cd byspermis
npx tsx scripts/verify-platform-health.ts   # données seed OK
npx tsx scripts/verify-seal-db.ts           # cachet DB OK
npx tsx scripts/verify-seal-pdf.ts          # PDF convocation OK
curl -s https://bys-permis.vercel.app/api/health | jq .
```

---

# Tableau de suivi (à cocher pendant le RDV)

| Phase | Statut | Commentaire |
|-------|--------|-------------|
| 0 Infra | ☐ | |
| 1 Owner | ☐ | |
| 2 Centre création/validation | ☐ | |
| 3 Onboarding centre | ☐ | |
| 4 Formation + session | ☐ | |
| 5 Admin staff | ☐ | |
| 6–7 Élève + paiement | ☐ | |
| 8 PDF + emails | ☐ | |
| 9 Exploitation centre | ☐ | |
| 10 Questionnaires | ☐ | |
| 11 Support | ☐ | |

---

**Contact** : Andrys MAGAR — andrys.developper@gmail.com
