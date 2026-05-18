# Plan de livraison BYS Permis — V1

> Cible : mise en production semaine du **18 mai 2026** (J+7 max).
> Auteur : Andrys MAGAR — Client : Sébastien (BYS Formation).

## Statut du code (17/05/2026)

- ✅ Build production passe (`npx next build` exit 0)
- ✅ Lint vert (0 erreurs, 54 warnings non-bloquants React 19 informatifs)
- ✅ 3 migrations Prisma prêtes (dont conformité stages récup points)
- ✅ Tunnel réservation + paiement Stripe Connect + webhook idempotent
- ✅ Validators Zod légaux (places 6-20, modalité PRESENTIEL only, durée 2j/14h)
- ✅ Espaces admin/centre/élève fonctionnels (~85% scope V1)
- ✅ SEO/PWA (sitemap, robots, manifest, OG, pages ville)

---

## Phase 1 — Provisionnement (J0 → J1)

### 1.1 Comptes externes à créer

| # | Service | Plan | Action |
|---|---------|------|--------|
| 1 | **Vercel** | Hobby ou Pro | Créer projet `byspermis`, connecter repo Git |
| 2 | **PostgreSQL prod** | Neon Free ou Vercel Postgres | Provisionner DB `byspermis_prod` |
| 3 | **Auth0** | Free (jusqu'à 7500 MAU) | Tenant prod `bys-permis.eu.auth0.com` |
| 4 | **Stripe** | Standard | Activer mode live + Stripe Connect |
| 5 | **Resend** | Free (3000 emails/mois) | Vérifier domaine `bys-permis.fr` |
| 6 | **Sentry** | Developer Free | Projet Next.js `byspermis-web` |
| 7 | **Upstash Redis** | Free (10k requêtes/jour) | Base `byspermis-ratelimit` |
| 8 | **Domaine** | OVH/Gandi | Acheter `bys-permis.fr` |

### 1.2 DNS à configurer

Chez le registrar du domaine :

```
@      A      76.76.21.21               # Vercel
www    CNAME  cname.vercel-dns.com.     # Vercel
@      MX     10 mx1.resend.com.        # Resend
@      TXT    "v=spf1 include:resend.com ~all"
resend._domainkey  TXT  "<copie DKIM Resend>"
```

---

## Phase 2 — Variables d'environnement Vercel (J1)

Dans Vercel → Settings → Environment Variables, scope **Production** uniquement (recopier en Preview pour staging) :

```bash
# Base de données
DATABASE_URL=                            # Neon/Vercel Postgres connection string

# Auth0
AUTH0_SECRET=                            # openssl rand -base64 32
AUTH0_BASE_URL=https://bys-permis.fr
AUTH0_ISSUER_BASE_URL=https://bys-permis.eu.auth0.com
AUTH0_DOMAIN=bys-permis.eu.auth0.com
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_MANAGEMENT_CLIENT_ID=
AUTH0_MANAGEMENT_CLIENT_SECRET=

# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_
STRIPE_WEBHOOK_SECRET=whsec_
COMMISSION_RATE=0.10

# Email
RESEND_API_KEY=re_
EMAIL_FROM=BYS Permis <noreply@bys-permis.fr>

# App
NEXT_PUBLIC_APP_URL=https://bys-permis.fr
APP_BASE_URL=https://bys-permis.fr
NODE_ENV=production

# Cron
CRON_SECRET=                             # openssl rand -hex 32

# Rate-limit
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=byspermis
SENTRY_PROJECT=byspermis-web
```

---

## Phase 3 — Auth0 setup (J1)

1. Créer Application **Regular Web Application** « BYS Permis »
2. **Allowed Callback URLs** : `https://bys-permis.fr/api/auth/callback`
3. **Allowed Logout URLs** : `https://bys-permis.fr`
4. **Allowed Web Origins** : `https://bys-permis.fr`
5. Activer Connections : Email/Password + Google
6. Créer Application **Machine to Machine** « BYS Permis Management » → autoriser Auth0 Management API (scopes `read:users`, `update:users`, `read:roles`, `create:role_members`)
7. Créer les 10 rôles dans Auth0 (Roles) : `ELEVE`, `CENTRE_OWNER`, `CENTRE_ADMIN`, `CENTRE_FORMATEUR`, `CENTRE_SECRETAIRE`, `SUPPORT`, `COMPTABLE`, `COMMERCIAL`, `ADMIN`, `OWNER`
8. Action post-login pour injecter `role` dans le custom claim `https://bys-permis.fr/role`

---

## Phase 4 — Stripe setup (J1-J2)

1. Activer le compte Stripe (KYC validé)
2. **Stripe Connect** → Settings → Connect → Activer (Express accounts)
3. **Branding** : logo BYS, couleurs `#0A1628`
4. **Webhook** → Add endpoint :
   - URL : `https://bys-permis.fr/api/webhooks/stripe`
   - Events :
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `transfer.created`
     - `account.updated`
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copier le `whsec_...` → `STRIPE_WEBHOOK_SECRET`
5. Vérifier `application_fee_amount` activé sur PaymentIntents Connect

---

## Phase 5 — Base de données (J2)

Sur staging d'abord, puis prod :

```bash
# 1. Vérifier que DATABASE_URL est bien sur la DB cible
npx prisma migrate status

# 2. Appliquer les 3 migrations
npx prisma migrate deploy
#    - 20260511 webhook_event + EN_ATTENTE_PAIEMENT
#    - 20260512 facturation centre
#    - 20260517 conformité stages récup points (NEW)

# 3. Seeds
npm run db:seed           # 6 centres BYS + formations récup points + catégorie unique
npm run seed:demo         # avis, articles blog, FAQ, tickets démo

# 4. Sync Auth0 (rôles + comptes seedés)
npm run seed:auth0

# 5. Vérif
npx prisma studio         # parcourir manuellement
```

---

## Phase 6 — Déploiement staging (J2-J3)

1. Pousser sur la branche `staging`
2. Vercel déploie automatiquement → `byspermis-staging.vercel.app`
3. Vérifier que `vercel.json` cron jobs sont actifs (Settings → Crons)
4. Test fumée : `curl https://byspermis-staging.vercel.app/api/health` (à créer si manquant)

---

## Phase 7 — Recette manuelle (J3-J5)

### 7.1 Parcours public
- [ ] Accueil charge, hero affiché, search bar fonctionne
- [ ] Recherche `?ville=paris` retourne formations + filtres OK
- [ ] Fiche formation `/formations/[slug]` affiche prix, sessions, programme
- [ ] Page ville SEO `/stages/paris` génère metadata correcte
- [ ] Blog, FAQ, mentions légales, CGU, RGPD chargent

### 7.2 Parcours élève
- [ ] Inscription Auth0 (email/password puis Google)
- [ ] Profil créé en DB avec rôle `ELEVE`
- [ ] Réservation : sélection session → données → paiement Stripe `4242 4242 4242 4242`
- [ ] Webhook `payment_intent.succeeded` reçu → réservation `CONFIRMEE`
- [ ] Email convocation reçu (Resend)
- [ ] PDF convocation téléchargeable
- [ ] Page confirmation affichée

### 7.3 Parcours centre
- [ ] Inscription centre via `/inscription` → rôle `CENTRE_OWNER`
- [ ] Onboarding profil (SIRET, agrément préfectoral, RIB)
- [ ] Stripe Connect onboarding → `stripeOnboardingDone=true`
- [ ] Création formation : modalité **forcée à PRESENTIEL** (test refus `DISTANCIEL`)
- [ ] Création session : test `placesTotal=5` → refus, `placesTotal=10` → OK
- [ ] Durée session 1 jour → refus, 2 jours → OK
- [ ] Voir réservations entrantes + émargement
- [ ] Voir paiements + commission split (90% centre / 10% BYS)

### 7.4 Parcours admin
- [ ] Login admin → `/admin/dashboard` accessible
- [ ] Voir liste centres, valider/rejeter un centre `EN_ATTENTE`
- [ ] Voir stats globales (revenus, conversions)
- [ ] Bloquer un utilisateur abusif
- [ ] Voir tickets support, répondre

### 7.5 Tests de charge / résilience
- [ ] 2 réservations simultanées sur la dernière place → 1 succès, 1 échec gracieux
- [ ] Webhook Stripe rejoué 3× → idempotent (1 seule réservation confirmée)
- [ ] Sentry capture une erreur volontaire (`throw` dans une route test)

---

## Phase 8 — Bascule prod (J6)

1. Merge `staging` → `main`
2. Vercel déploie sur prod
3. Switch DNS `bys-permis.fr` → Vercel (déjà fait phase 1 — laisser propagation 1h)
4. Bascule Stripe : remplacer toutes les clés `sk_test_` par `sk_live_` dans Vercel prod env
5. Réémettre le webhook secret Stripe en mode live
6. Tester un paiement réel à 1€ (formation test, puis remboursée)
7. Communiquer URL publique au client Sébastien

---

## Phase 9 — Suivi post-livraison (J7+)

- Surveillance Sentry quotidienne pendant 2 semaines
- Vérifier les crons Vercel (cleanup réservations en attente, rappels)
- Suivi conversions Stripe + Auth0 logs
- Backup DB programmé (Neon le fait nativement)

---

## Points d'attention juridiques

1. **Agrément préfectoral** : chaque centre doit fournir son n° d'agrément avant d'être `ACTIF`. Le champ existe en DB (`agrementNumber`, `agrementDepartement`, `agrementValidUntil`) mais l'UI d'onboarding doit l'exiger.
2. **Animateurs BAFM + psychologue** : la plateforme ne valide PAS la qualification des animateurs (responsabilité du centre). À documenter dans les CGV partenaires.
3. **RGPD** : numéros de permis stockés en clair en DB. Évaluer chiffrement applicatif en V1.5.
4. **Commission 10%** : confirmée par défaut, override par centre possible (`commissionRateOverride`).
