# Guide Ads, SEO & Tracking — BYS Permis

> Destinataire : Sébastien (BYS Formation) — questions techniques : Andrys (`andrys.developper@gmail.com`)
> Date : 2026-05-18 — V1 mise en place du tracking et du référencement

Ce document décrit (1) ce qui est **déjà en place techniquement** dans le code, et (2) ce que **Sébastien doit fournir / configurer côté plateformes** (Google, Meta) pour que tout soit opérationnel.

---

## 1. Ce qui est déjà en place côté code

### SEO technique
- `robots.txt` — généré dynamiquement (`/robots.txt`), bloque les espaces privés et `/api`.
- `sitemap.xml` — généré dynamiquement (`/sitemap.xml`), inclut :
  - Toutes les pages statiques publiques
  - Toutes les fiches **formations** actives
  - Toutes les fiches **centres** actifs
  - Toutes les pages **villes** (`/stages/[ville]`) issues des centres
- Métadonnées Open Graph + Twitter Cards sur toutes les pages publiques (titre, description, URL canonique).
- `manifest.json` (PWA) — installation possible sur mobile.

### Données structurées (JSON-LD schema.org)
Présentes dans le `<head>` de toutes les pages indexables — aide Google à comprendre la nature du contenu et à activer les *rich snippets* (étoiles, prix, dates dans les résultats).

| Page | Schémas injectés |
|------|------------------|
| Toutes (layout racine) | `Organization`, `WebSite` (avec sitelinks search box) |
| Page d'accueil | `Service` (Stage récupération points) |
| `/stages/[ville]` | `BreadcrumbList` + `Service` (avec prix moyens locaux) |
| `/formations/[slug]` | `BreadcrumbList` + `Course` (avec sessions + prix) |
| `/centres/[slug]` | `BreadcrumbList` + `LocalBusiness` + `EducationalOrganization` |
| `/faq` | `BreadcrumbList` + `FAQPage` |

### Tracking & Ads
Tous les scripts sont **chargés conditionnellement** : si la variable d'environnement n'est pas définie, le script n'est pas injecté.

| Plateforme | Variable env | Usage |
|-----------|--------------|-------|
| Google Analytics 4 | `NEXT_PUBLIC_GA4_ID` | Mesure d'audience, parcours, conversions |
| Google Tag Manager | `NEXT_PUBLIC_GTM_ID` | (Optionnel) si vous préférez gérer les tags via GTM |
| Google Ads | `NEXT_PUBLIC_GOOGLE_ADS_ID` + `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | Suivi conversions campagnes Google Ads |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Suivi conversions Facebook & Instagram Ads |

### RGPD — Bannière de consentement
- Composant `<ConsentBanner />` affiché à la première visite.
- 3 choix : tout accepter / tout refuser / personnaliser.
- Persistance dans `localStorage` (révocable depuis la politique de confidentialité — à câbler en V2).
- Implémente **Google Consent Mode v2** : tant que l'utilisateur n'a pas consenti, les balises Google ne posent **aucun cookie marketing**, mais elles envoient quand même des *pings* anonymes (ce qui permet d'avoir des stats de modélisation côté Google Ads).

### Conversions trackées automatiquement
| Événement | Quand ? | Plateformes |
|-----------|---------|-------------|
| `page_view` | Sur chaque navigation | GA4, GTM, Meta Pixel |
| `begin_checkout` / `InitiateCheckout` | Arrivée sur `/reserver/[id]/donnees` | GA4, Meta Pixel |
| `purchase` / `Purchase` + Google Ads conversion | Arrivée sur `/reserver/[id]/confirmation` | GA4, Google Ads, Meta Pixel |

---

## 2. À faire côté Sébastien — checklist plateformes

### 2.1 Google Analytics 4

1. Aller sur https://analytics.google.com → **Administration**
2. Créer une propriété "BYS Permis" (zone horaire Paris, devise EUR)
3. Créer un flux de données **Web** pour `https://bys-permis.fr`
4. Copier l'**ID de mesure** (format `G-XXXXXXXXXX`)
5. Me le transmettre — je le mettrai dans la variable `NEXT_PUBLIC_GA4_ID` sur Vercel

### 2.2 Google Search Console (SEO)

1. Aller sur https://search.google.com/search-console
2. Ajouter la propriété `bys-permis.fr` (méthode "préfixe d'URL")
3. Choisir la méthode de vérification **balise HTML** : Google fournira un code du type `<meta name="google-site-verification" content="xxx" />`
4. Me transmettre la valeur **xxx** → variable `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
5. Une fois la propriété validée, soumettre le sitemap : `https://bys-permis.fr/sitemap.xml`

### 2.3 Bing Webmaster Tools (SEO Bing/DuckDuckGo)

1. Aller sur https://www.bing.com/webmasters
2. Ajouter `bys-permis.fr` (option : importer depuis Google Search Console pour gagner du temps)
3. Méthode meta tag : `<meta name="msvalidate.01" content="xxx" />`
4. Me transmettre la valeur **xxx** → variable `NEXT_PUBLIC_BING_SITE_VERIFICATION`

### 2.4 Google Ads (campagnes payantes)

> Étape ouverte une fois Google Analytics opérationnel : lier les deux comptes.

1. Créer un compte Google Ads sur https://ads.google.com (compte BYS Formation)
2. Menu **Outils & paramètres** → **Mesures** → **Conversions** → **+ Nouvelle action de conversion**
3. Choisir **Site Web** → catégorie **Achat**
4. Configuration : valeur dynamique (€), comptage "Une", fenêtre 30 jours
5. Méthode "Configurer manuellement la balise" → Google fournit :
   - `ID de conversion` (format `AW-XXXXXXXXXX`)
   - `Libellé de conversion` (chaîne courte type `abcDEF123`)
6. Me transmettre les deux valeurs → variables `NEXT_PUBLIC_GOOGLE_ADS_ID` et `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`
7. Activer **les conversions améliorées** dans Google Ads (utilise l'email du client pour mieux matcher) — à câbler en V2

### 2.5 Meta Ads (Facebook + Instagram)

1. Aller sur https://business.facebook.com → **Sources de données** → **Pixels** → **Ajouter**
2. Créer un pixel "BYS Permis"
3. Copier l'**ID du pixel** (format numérique, 15-16 chiffres)
4. Me le transmettre → variable `NEXT_PUBLIC_META_PIXEL_ID`
5. **Vérification de domaine** : Business Manager → **Sécurité de la marque** → **Domaines** → ajouter `bys-permis.fr`
6. Méthode "Balise meta" → Meta fournit `<meta name="facebook-domain-verification" content="xxx" />`
7. Me transmettre **xxx** → variable `NEXT_PUBLIC_META_DOMAIN_VERIFICATION`

### 2.6 Google Business Profile (SEO local)

Pour **chaque centre BYS** (Osny, etc.) :

1. https://business.google.com → créer une fiche pour le centre
2. Catégorie principale : "École de conduite" ou "Établissement d'enseignement"
3. Adresse exacte, horaires, téléphone (cohérents avec ce qui sera affiché sur le site)
4. Demander l'envoi du courrier de vérification (code postal physique)
5. Une fois validé, demander des avis clients — ils remontent dans Google Maps **et** dans les résultats de recherche

---

## 3. Recommandations contenu / SEO (V1.x après lancement)

### Mots-clés prioritaires (à viser dans le contenu)
- `stage récupération points` (volume national élevé)
- `stage récupération points [ville]` (intention locale forte — déjà couvert par `/stages/[ville]`)
- `stage 48N` / `lettre 48N`
- `récupérer 4 points permis`
- `stage permis pas cher [ville]`

### Pages SEO à créer (V1.x)
- `/stages/[ville]` — déjà en place mais à enrichir avec contenu unique par ville (~500 mots, témoignages locaux, plan d'accès)
- `/blog/stage-recuperation-points-comment-ca-marche`
- `/blog/lettre-48N-que-faire`
- `/blog/combien-de-points-permis-2026`
- `/blog/stage-recuperation-points-prix`

### Backlinks à viser
- Forums automobile (`caradisiac`, `auto-moto`)
- Associations de victimes de la route (partenariats potentiels)
- Annuaires SEO France (`pages-jaunes`, `kompass`)
- Mention sur le site BYS Formation historique avec lien vers le nouveau site

---

## 4. Vérification après mise en ligne

Une fois les variables configurées et le site déployé :

1. **GA4** — Onglet "Temps réel" doit montrer la visite après acceptation des cookies
2. **Google Tag Assistant** (extension Chrome) — sur n'importe quelle page, doit lister GA4 + Google Ads
3. **Meta Pixel Helper** (extension Chrome) — doit afficher l'ID + l'événement PageView
4. **Rich Results Test** (https://search.google.com/test/rich-results) — coller une URL `/formations/xxx` doit afficher un schéma `Course` valide
5. **Google Search Console** > Sitemaps : sitemap `https://bys-permis.fr/sitemap.xml` accepté, X URLs détectées

---

## 5. Conformité

- ✅ Cookies marketing désactivés par défaut (Consent Mode v2 + bannière)
- ✅ IP anonymisée sur GA4 (`anonymize_ip: true`)
- ✅ `ads_data_redaction: true` activé → Google ne reçoit pas les données utilisateur tant que pas de consentement
- ✅ `url_passthrough: true` → continuité du tracking même sans cookies
- ⏳ Page **politique de confidentialité** à compléter avec la liste exacte des cookies posés (sera générée automatiquement depuis le code une fois les IDs en place)
- ⏳ Lien "Gérer mes cookies" à ajouter dans le footer (V1.x) pour permettre à l'utilisateur de revenir sur son choix

---

**Contact** : Andrys — `andrys.developper@gmail.com` pour la configuration technique côté code.
