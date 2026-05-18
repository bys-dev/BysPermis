# Plan complet de livraison — BYS Permis V1

> Date : 17 mai 2026 — Objectif : livraison cette semaine (24/05/2026 max)
> Statut : phase d'aboutissement, fixes ciblés.

---

## A — Code à 100% (autonome, à appliquer immédiatement)

### A1. Email & documents au format PDF
- [ ] Lier route `GET /api/convocation/[id]` à l'envoi `sendConvocationEmail` (déjà supporte `pdfBuffer`)
- [ ] Modifier `sendConfirmationEmail` pour attacher la **facture PDF** générée à la volée
- [ ] Créer helper `renderConvocationPdf(reservationId)` réutilisable serveur
- [ ] Créer helper `renderFacturePdf(reservationId)` réutilisable serveur
- [ ] Webhook Stripe `payment_intent.succeeded` → envoyer email confirmation **avec facture PDF jointe**
- [ ] Cron envoi convocation → utilise `sendConvocationEmail` avec `pdfBuffer`
- [ ] Branding HTML cohérent (header navy `#0A1628` + logo BYS) pour tous les templates

### A2. Verrouillage scope récup points (déjà fait)
- [x] `fetchLiveFormations()` filtre par catégorie/titre
- [x] API `/api/formations` filtre scope + force PRESENTIEL
- [x] Validators Zod refusent DISTANCIEL/HYBRIDE et CPF=true
- [x] Modalité option recherche limitée à Présentiel
- [x] Tags populaires nettoyés (plus de FIMO/Permis B)

### A3. Conformité légale stage récup points
- [x] Migration SQL `stage_recup_points_compliance` (StageType enum, agrément, pointsRecovered, justificatifs)
- [x] Validators serveur : places 6-20, durée ~2 jours/14h
- [ ] UI onboarding centre : exiger `agrementNumber` + `agrementDepartement` + `agrementValidUntil` avant statut ACTIF
- [ ] UI réservation : champ upload `lettre48NUrl` si stageType ∈ {LETTRE_48N, LETTRE_48SI}
- [ ] UI réservation : champ upload `pieceIdentiteUrl` obligatoire

### A4. Responsive (fixes déjà appliqués + à finir)
- [x] Tunnel réservation `/donnees` : ajout breakpoint `md:`
- [x] Admin dashboard KPI : grid `md:grid-cols-3 xl:grid-cols-4`
- [ ] Newsletter form home : ajouter `md:flex-row`
- [ ] Tester visuellement 375/768/1280 px sur les 12 pages principales

### A5. Image hero (déjà fait)
- [x] `opacity-30` → `opacity-70` sur image radar
- [x] Gradient overlay assoupli (`from-#0A1628/95` au lieu de plein)

### A6. Robustesse & sécurité
- [ ] Vérifier rate-limit Upstash sur routes `/api/reservations`, `/api/auth/*`, `/api/contact`
- [ ] CSP/headers sécu dans `next.config.ts` (X-Frame-Options, Strict-Transport-Security)
- [ ] Vérifier idempotence webhook Stripe sur tous les events
- [ ] Sentry DSN brancher (env vars Vercel)

---

## B — Infrastructure & déploiement (J0 → J2)

### B1. Comptes externes
- [ ] Vercel projet `byspermis` connecté au repo Git
- [ ] PostgreSQL prod (Neon ou Vercel Postgres) — DATABASE_URL
- [ ] Auth0 tenant `bys-permis.eu.auth0.com` + 10 rôles + Action post-login
- [ ] Stripe activé Live + Stripe Connect Express + webhook configuré
- [ ] Resend domaine `bys-permis.fr` vérifié (DKIM/SPF)
- [ ] Sentry projet `byspermis-web`
- [ ] Upstash Redis (rate-limit)
- [ ] Domaine `bys-permis.fr` acheté + DNS pointé Vercel

### B2. Variables d'environnement (voir PLAN_LIVRAISON.md §2)
- [ ] Toutes les vars Vercel scope Production + Preview (staging)

### B3. Base de données prod
- [ ] `prisma migrate deploy` (3 migrations dont conformité)
- [ ] `npm run db:seed` (6 centres BYS + 6 formations récup points)
- [ ] `npm run seed:demo` (avis, articles, FAQ)
- [ ] `npm run seed:auth0` (sync rôles + comptes)
- [ ] **Purger formations hors-scope héritées** (voir PURGE_DB_PROD.md)

---

## C — Recette client (J3 → J5)

### C1. Tests utilisateurs (E2E manuels)
- [ ] Parcours élève : inscription Auth0 → recherche → réservation → paiement test Stripe `4242…` → réception convocation + facture PDF
- [ ] Parcours centre : inscription → onboarding (agrément, SIRET, RIB) → Stripe Connect → création formation + session 6-20 places → réception notification réservation
- [ ] Parcours admin : validation centre, blocage user, exports CSV, stats
- [ ] Tunnel : test 2 réservations simultanées sur dernière place → anti-race
- [ ] Webhook : rejouer 3× le même event → idempotent
- [ ] Annulation + remboursement → email + invoice
- [ ] Sentry capture erreur volontaire
- [ ] Crons Vercel actifs (cleanup, rappels)

### C2. Documents client à valider
- [ ] CHECKLIST_CLIENT.md envoyé à Sébastien (juridique, agrément, logo, Stripe, DNS)
- [ ] Templates emails relus par client (ton, signature)
- [ ] CGU/CGV/RGPD relus par un juriste (recommandé)

---

## D — Mise en ligne (J6)

- [ ] Merge `staging` → `main`
- [ ] Vercel déploie prod
- [ ] Bascule DNS `bys-permis.fr`
- [ ] Switch clés Stripe `sk_test_` → `sk_live_` dans Vercel prod
- [ ] Webhook Stripe re-pointé en mode live
- [ ] Test paiement réel 1€ (puis remboursé)
- [ ] Communication client : URL publique

---

## E — Suivi post-livraison (J7+)

- [ ] Monitoring Sentry quotidien 2 semaines
- [ ] Crons Vercel vérifiés (cleanup réservations, rappels)
- [ ] Backup DB programmé (Neon le fait nativement)
- [ ] Suivi conversions Stripe + logs Auth0
- [ ] Hotfix 24-48h si bug critique signalé

---

## Priorisation finale

| # | Bloc | Tâche | Bloquant ? |
|---|------|-------|------------|
| 1 | A1 | Attacher facture + convocation PDF aux emails | 🔴 Oui |
| 2 | A3 | UI onboarding agrément préfectoral | 🔴 Oui (légal) |
| 3 | B1+B2 | Provisionnement Vercel + env vars | 🔴 Oui |
| 4 | B3 | Migration + seed prod | 🔴 Oui |
| 5 | C1 | Recette E2E | 🔴 Oui |
| 6 | A6 | Sentry + rate-limit | 🟡 Important |
| 7 | A4 | Responsive finitions | 🟡 Important |
| 8 | C2 | Validation juridique CGV | ⚪ Souhaitable |
