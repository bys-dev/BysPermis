# CLAUDE.md — BYS Formation Platform

Ce fichier est lu automatiquement par Claude Code à chaque session.
Il contient tout le contexte du projet, les règles de développement et les commandes utiles.

---

## 🎯 Contexte projet

**Plateforme** : Marketplace de formations professionnelles (sécurité routière, permis, transport)
**Client** : BYS Formation — Sébastien — bysforma95@gmail.com
**Prestataire** : Andrys MAGAR — Auto-entrepreneur — SIRET : 908 058 092 00028
**Contrat** : 10 000 € — 5 mensualités de 2 000 € — Démarrage 9 mars 2026
**Délai** : 19 semaines (9 mars → 19 juillet 2026)

---

## 🏗️ Stack technique

| Composant       | Technologie              |
|-----------------|--------------------------|
| Framework       | Next.js 14 (App Router)  |
| Langage         | TypeScript strict        |
| Style           | Tailwind CSS             |
| Base de données | PostgreSQL + Prisma ORM  |
| Auth            | Auth0 (@auth0/nextjs-auth0 v3) |
| Paiement        | Stripe + Stripe Connect  |
| Email           | Resend                   |
| Tests           | Jest + React Testing Library |
| CI/CD           | GitHub Actions           |
| Déploiement     | Vercel                   |

---

## 📁 Structure du projet

```
bys-formation/
├── prisma/
│   ├── schema.prisma          # Schéma BDD complet (10 tables)
│   └── seed.ts                # Données de test
├── public/
│   └── index.html             # Maquette page d'accueil (référence visuelle)
├── src/
│   ├── app/
│   │   ├── (public)/          # Pages publiques (marketplace)
│   │   │   ├── page.tsx       # Page d'accueil
│   │   │   ├── recherche/     # Résultats de recherche
│   │   │   ├── formations/    # Fiche formation [slug]
│   │   │   └── centres/       # Profil centre [slug]
│   │   ├── (auth)/            # Tunnel de réservation
│   │   │   └── reserver/      # [sessionId]/connexion|donnees|paiement|confirmation
│   │   ├── espace-eleve/      # Espace apprenant (protégé)
│   │   │   ├── reservations/
│   │   │   └── profil/
│   │   ├── espace-centre/     # Espace centre partenaire (protégé)
│   │   │   ├── dashboard/
│   │   │   ├── formations/
│   │   │   ├── sessions/
│   │   │   └── parametres/
│   │   ├── admin/             # Super-Admin (protégé, rôle ADMIN)
│   │   │   ├── dashboard/
│   │   │   ├── centres/
│   │   │   └── utilisateurs/
│   │   ├── support/           # Support & tickets
│   │   ├── faq/
│   │   └── api/
│   │       ├── auth/[auth0]/  # Auth0 handler
│   │       ├── formations/    # CRUD formations
│   │       ├── centres/       # CRUD centres
│   │       ├── reservations/  # Gestion réservations
│   │       ├── stripe/        # Stripe routes
│   │       └── webhooks/stripe/ # Webhook handler
│   ├── components/
│   │   ├── ui/                # Composants génériques (Button, Input, Badge...)
│   │   ├── layout/            # Header, Footer, Nav
│   │   ├── marketplace/       # Cards, SearchBar, Filters...
│   │   ├── booking/           # Tunnel de réservation
│   │   ├── dashboard/         # Graphiques, KPIs
│   │   └── forms/             # Formulaires réutilisables
│   ├── lib/
│   │   ├── prisma.ts          # Client Prisma singleton
│   │   ├── stripe.ts          # Client Stripe
│   │   ├── auth0.ts           # Helpers Auth0
│   │   └── utils.ts           # Utilitaires (cn, formatPrice, formatDate...)
│   └── types/
│       └── index.ts           # Types TypeScript globaux
├── __tests__/                 # Tests unitaires
│   ├── components/
│   ├── api/
│   └── lib/
├── .env.local                 # Variables d'environnement (NE PAS COMMITTER)
├── .env.example               # Template variables (committer)
└── CLAUDE.md                  # Ce fichier
```

---

## 🔑 Variables d'environnement requises

Le fichier `.env.local` doit contenir ces variables.
**Ne jamais committer `.env.local`** — il est dans `.gitignore`.

```bash
# Base de données
DATABASE_URL=""                          # PostgreSQL connection string

# Auth0
AUTH0_SECRET=""                          # openssl rand -base64 32
AUTH0_BASE_URL=""                        # http://localhost:3000 en dev
AUTH0_ISSUER_BASE_URL=""                 # https://YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=""
AUTH0_CLIENT_SECRET=""
AUTH0_MANAGEMENT_CLIENT_ID=""            # Pour assigner les rôles
AUTH0_MANAGEMENT_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""                     # sk_test_... en dev
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""    # pk_test_... en dev
STRIPE_WEBHOOK_SECRET=""                 # whsec_... (stripe listen)

# Email
RESEND_API_KEY=""                        # re_...
EMAIL_FROM="noreply@bys-formation.fr"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COMMISSION_RATE="0.10"                   # 10% de commission par défaut
```

---

## 🎨 Design system

Couleurs (définies dans `tailwind.config.ts`) :
```
brand-bg           #F9FAFB   Fond général
brand-border       #E5E7EB   Bordures
brand-text         #111827   Texte principal
brand-accent       #3B82F6   Bleu principal
brand-accent-hover #2563EB   Bleu hover
```

Fonts :
- **Inter** — texte courant
- **Outfit** — titres (classe `font-display`)

Classes utilitaires disponibles dans `globals.css` :
```
.btn-primary       Bouton bleu principal
.btn-secondary     Bouton contour bleu
.btn-ghost         Bouton transparent
.card              Carte avec ombre
.input             Champ de formulaire
.label             Label de formulaire
.badge-blue/green/orange/red/gray
.container-main    max-w-7xl centré
.section           Padding vertical section
.section-title     Titre de section
```

---

## 📐 Règles de développement

### Nommage
- **Composants** : PascalCase (`FormationCard.tsx`)
- **Fichiers pages** : `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **API routes** : `route.ts`
- **Hooks** : `useXxx.ts` (camelCase)
- **Types** : PascalCase avec suffixe (`FormationType`, `UserRole`)

### TypeScript
- Toujours typer les props des composants
- Pas de `any` — utiliser `unknown` si nécessaire
- Zod pour valider toutes les entrées API

### Composants
- Server Components par défaut (Next.js App Router)
- Ajouter `'use client'` seulement si nécessaire (useState, useEffect, handlers)
- Props → interface nommée `XxxProps`

### API Routes
- Toujours valider le body avec Zod
- Toujours vérifier l'auth avec `getCurrentUser()` ou `requireAuth()`
- Retourner `NextResponse.json()` avec le bon status HTTP
- Wrapper dans try/catch

### Base de données
- Toujours utiliser le singleton `prisma` de `src/lib/prisma.ts`
- Jamais de `prisma.$connect()` manuel
- Utiliser les transactions Prisma pour les opérations multi-tables

### Git
- **Branches** : `feature/P2-auth0`, `feature/P3-marketplace`, `fix/P4-stripe`
- **Commits** : `feat:`, `fix:`, `test:`, `refactor:`, `docs:`
- **Jamais** committer sur `main` directement
- PR de `feature/*` → `develop` → `main`

---

## 🧪 Tests

### Lancer les tests
```bash
npm test                    # Tous les tests
npm test -- --watch         # Mode watch (développement)
npm test -- --coverage      # Avec couverture de code
npm test -- formations      # Filtrer par nom de fichier
```

### Structure d'un test composant
```typescript
import { render, screen } from '@testing-library/react'
import { FormationCard } from '@/components/marketplace/FormationCard'

describe('FormationCard', () => {
  it('affiche le titre de la formation', () => {
    render(<FormationCard title="Stage récupération de points" price={230} />)
    expect(screen.getByText('Stage récupération de points')).toBeInTheDocument()
  })
})
```

### Structure d'un test API
```typescript
import { GET } from '@/app/api/formations/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({ prisma: { formation: { findMany: jest.fn() } } }))

describe('GET /api/formations', () => {
  it('retourne la liste des formations', async () => {
    (prisma.formation.findMany as jest.Mock).mockResolvedValue([...])
    const res = await GET(new Request('http://localhost/api/formations'))
    expect(res.status).toBe(200)
  })
})
```

### Couverture cible
- Composants UI : 80%+
- API routes : 90%+
- Lib utils : 100%

---

## 🚀 Commandes utiles

```bash
# Développement
npm run dev                  # Serveur dev http://localhost:3000
npm run build                # Build production
npm run lint                 # ESLint
npm run type-check           # TypeScript check

# Base de données
npm run db:push              # Appliquer le schéma (dev)
npm run db:migrate           # Créer une migration
npm run db:seed              # Injecter les données de test
npm run db:studio            # Prisma Studio (interface BDD)

# Tests
npm test                     # Jest
npm test -- --coverage       # Avec coverage

# Stripe (webhook local)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 📋 Phases et état d'avancement

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Infrastructure, BDD, config, CI/CD | ✅ Terminé |
| 2 | Auth0, rôles, inscription/connexion | 🔄 À faire |
| 3 | Marketplace (accueil, recherche, fiches) | ⬜ À faire |
| 4 | Tunnel réservation + Stripe paiement | ⬜ À faire |
| 5 | Stripe Connect + commissions | ⬜ À faire |
| 6 | Espace Élève + Espace Centre | ⬜ À faire |
| 7 | Support + Super-Admin | ⬜ À faire |
| 8 | Tests, recette, déploiement Vercel | ⬜ À faire |

---

## 🗂️ Modèle de données (résumé)

```
User          → auth0Id, email, firstName, lastName, role (ELEVE/CENTRE/ADMIN)
Centre        → userId(1-1), name, slug, stripeAccountId, status (PENDING/ACTIVE/SUSPENDED)
Formation     → centreId, title, slug, price, duration, modality, isQualiopi, isCPF
Session       → formationId, startDate, endDate, maxPlaces, status
Reservation   → userId + sessionId, status (PENDING/CONFIRMED/CANCELLED/REFUNDED)
Ticket        → userId, subject, status (OPEN/IN_PROGRESS/RESOLVED)
TicketMessage → ticketId, authorId, content, isAdmin
FaqItem       → question, answer, category, order
Notification  → userId, title, message, type, isRead
```

---

## 🔐 Rôles et accès

| Rôle  | Accès |
|-------|-------|
| Public | Pages marketplace, recherche, fiches, profils |
| ELEVE | + Espace élève (réservations, profil, notifications) |
| CENTRE | + Espace centre (dashboard, formations, sessions, paramètres) |
| ADMIN | + Super-Admin (tout) |

---

## 📬 Contacts projet

- **Client** : Sébastien — bysforma95@gmail.com
- **Prestataire** : Andrys MAGAR
- **Repo** : github.com/[À_COMPLÉTER]/bys-formation
- **Vercel** : [À_COMPLÉTER].vercel.app

---

## ⚠️ Points d'attention

1. **Auth0** — Ne jamais stocker les mots de passe — tout passe par Auth0
2. **Stripe** — Ne jamais stocker les numéros de carte — tout passe par Stripe Elements
3. **RGPD** — Pas de log des données personnelles, durée de conservation à respecter
4. **`.env.local`** — Ne JAMAIS committer ce fichier
5. **Places disponibles** — Vérifier les places restantes AVANT de créer le PaymentIntent (race condition)
6. **Commission** — Toujours calculer côté serveur, jamais côté client
7. **Webhooks Stripe** — Toujours vérifier la signature avant de traiter
