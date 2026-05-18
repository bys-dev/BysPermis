# Plan d'audit — BYS Permis V1 vs Cahier des charges

> Méthodologie pour comparer le code livré au CDC_BYS_Formation.md (898 lignes, v3.0 mars 2026)

## Périmètre

L'audit doit vérifier que chaque exigence du CDC est implémentée, partiellement implémentée, ou absente.

## 8 axes d'audit

### Axe 1 — Identification & contractuel
- Vérifier mentions légales (SIRET BYS, SIRET prestataire, IBAN)
- Adresse client/prestataire dans le code
- Date démarrage + livraison cohérentes avec le CDC

### Axe 2 — Vision & scope
- ✅ Scope V1 = uniquement stages récup points (CDC §29-32)
- Aucune formation hors-scope (FIMO/Permis B/A/moto/taxi/VTC/code) dans seeds, pages, contenus
- Modèle de données extensible mais V1 fermé

### Axe 3 — Architecture technique
- Stack respectée : Next.js (CDC dit 14 — réel 16 = upgrade OK)
- Prisma 5+ (réel 7 = upgrade OK)
- TypeScript strict
- Tailwind CSS, Auth0 v3+, Stripe + Connect, Resend, @react-pdf/renderer
- Tests Jest + Playwright
- CI GitHub Actions
- Hébergement Vercel + Postgres Neon/Supabase

### Axe 4 — Modèle de données
- 12 tables minimum (CDC §239-258)
- User, Centre, Categorie, Formation, Session, Reservation, Ticket, TicketMessage, FaqItem, Notification, PlatformSettings, + autres (Article, EmailTemplate, etc.)
- Enums : Role, ReservationStatus, SessionStatus, CentreStatus, TicketStatus, Modalite, MonetisationModel, SubscriptionStatus
- Conformité ajoutée : StageType (NEW)
- Relations clés cohérentes

### Axe 5 — Sécurité & authentification
- 4 rôles minimum (PUBLIC/ELEVE/CENTRE/ADMIN) — réel : 10 rôles (extension OK)
- Auth0 v3+ avec gestion management API
- Stripe : pas de stockage CC, PaymentIntent + Connect
- RGPD : pas de log de données perso

### Axe 6 — Fonctionnalités par espace
- **Public** : Accueil + Recherche + Fiche formation + Profil centre + FAQ + Blog
- **Élève** : Réservations + Profil + Calendrier + Paiements + Notifications + Documents
- **Centre** : Dashboard + Formations + Sessions + Élèves + Convocations + Contrats + Finances + Paramètres
- **Admin** : Centres + Users + Paramètres plateforme + Reporting
- **Tunnel réservation** : 4 étapes (connexion / données / paiement / confirmation)

### Axe 7 — Documents & emails
- **PDFs** : Convocation, Facture, Attestation, Contrat — composants React-PDF
- **Emails** : Bienvenue, Confirmation réservation, Convocation (PDF), Rappel J-2, Notification centre, Annulation, Centre invitation/activation/rejection
- Tous les documents officiels au format PDF, attachés aux emails

### Axe 8 — Tests, CI, déploiement
- Coverage : Components 80%+, API 90%+, Lib 100%
- E2E Playwright sur parcours critiques
- GitHub Actions : lint + typecheck + tests + build
- Vercel deploy automatique sur main

## Méthode d'exécution

1. Pour chaque axe, lancer un agent `Explore` ciblé
2. L'agent produit un rapport "exigence CDC → état impl → ✅/🟡/❌"
3. Compilation des résultats dans `AUDIT_RESULT.md`
4. Identifier les gaps bloquants
5. Appliquer les fixes
6. Audit final pour confirmer 0 gap

## Niveaux de criticité

- 🔴 **Bloquant** : empêche livraison V1 ou viole une exigence légale
- 🟡 **Important** : dégrade l'UX ou retarde la valeur mais peut suivre
- ⚪ **Mineur** : nice-to-have, peut attendre V1.1
