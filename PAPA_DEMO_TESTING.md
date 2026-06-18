# PAPA — Plan de Présentation & Acceptation Produit
## BYS Permis — Démo & recette avec Sébastien

> **Préparé par** : Andrys MAGAR  
> **Date prévue** : rendez-vous avec Sébastien  
> **Version** : 28/05/2026  
> **Durée estimée** : 1h à 1h30 (présentation + tests guidés)

---

## 1. Objectif de la session

| Objectif | Description |
|----------|-------------|
| **Présenter** | Montrer l'état actuel de la plateforme (site public, élève, centre, admin) |
| **Valider** | Confirmer que les parcours métier correspondent aux attentes BYS |
| **Recetter** | Identifier bugs, ajustements UX et priorités avant mise en prod |
| **Décider** | Lister les écarts restants et planifier les corrections |

---

## 2. Environnement & accès

### URL de démo

| Environnement | URL |
|---------------|-----|
| **Production / démo** | `https://bys-permis.vercel.app` |
| **Staging** (si disponible) | `https://bys-permis-git-staging.vercel.app` |

> Vérifier la veille du RDV que l'URL répond et que la connexion Auth0 fonctionne.

### Comptes de test (seed)

Connexion via **Auth0** (email + mot de passe configurés dans Auth0).

| Rôle | Email | Usage en démo |
|------|-------|---------------|
| **Owner plateforme** | `sebastien@bys-formation.fr` | Admin, validation, vue globale |
| **Admin** | `admin@bys-formation.fr` | Back-office plateforme |
| **Support** | `support@bys-formation.fr` | Tickets support |
| **Centre BYS Osny** | `contact@bys-formation.fr` | Espace centre principal |
| **Centre Paris** | `fatima.benali@autoecole-conduite-plus.fr` | 2e centre partenaire |
| **Élève** | `karim.bouaziz@gmail.com` | Parcours réservation / espace élève |

> Les mots de passe sont gérés dans Auth0. Préparer les identifiants avant le RDV ou créer un compte élève live pendant la démo.

### Paiement test (Stripe)

```
Numéro   : 4242 4242 4242 4242
Exp.     : 12/30 (ou toute date future)
CVC      : 123
CP       : 75001
```

Carte refusée : `4000 0000 0000 0002`

### Emails

- Expéditeur : `noreply@bys-permis.fr`
- Vérifier **boîte de réception + spams** lors des tests convocation / facture

---

## 3. Déroulé de la présentation (script)

### Phase A — Site public (10 min)

**Message clé** : *« Voici ce que voit un conducteur qui cherche un stage de récupération de points. »*

| # | Action | URL / chemin | À montrer | ✅ |
|---|--------|--------------|-----------|---|
| A1 | Page d'accueil | `/` | Hero, recherche, stats, agrément préfecture | ☐ |
| A2 | Recherche | `/recherche` | Filtres ville, prix, dates, Qualiopi | ☐ |
| A3 | Carte centres | `/centres` | Carte interactive, marqueurs, fiche centre | ☐ |
| A4 | Fiche centre | `/centres/[slug]` | Logo, bannière, couleurs du centre | ☐ |
| A5 | Fiche formation | `/formations/[slug]` | Sessions, prix, bouton Réserver | ☐ |
| A6 | Pages info | `/comment-ca-marche`, `/faq`, `/contact` | Contenu lisible, formulaire contact | ☐ |

---

### Phase B — Parcours élève (20 min)

**Message clé** : *« De la recherche à la convocation PDF, tout est automatisé. »*

| # | Action | URL / chemin | À montrer | ✅ |
|---|--------|--------------|-----------|---|
| B1 | Inscription | `/inscription` | Création compte (email réel recommandé) | ☐ |
| B2 | Tunnel réservation | `/reserver/[sessionId]` | Données → Éligibilité → Paiement → Confirmation | ☐ |
| B3 | Paiement Stripe | étape paiement | Carte test 4242…, confirmation immédiate | ☐ |
| B4 | Emails reçus | boîte mail | Confirmation + convocation + facture PDF jointe | ☐ |
| B5 | Espace élève | `/espace-eleve` | Dashboard, réservations, formations | ☐ |
| B6 | Documents | `/espace-eleve/documents` | Téléchargement convocation, facture, contrat | ☐ |
| B7 | Convocation PDF | depuis réservation | Logo centre en en-tête, zone cachet & signature | ☐ |
| B8 | Questionnaire avis | `/espace-eleve/avis` | Demi-étoiles post-formation (si éligible) | ☐ |
| B9 | Support | `/espace-eleve/support` | Ouverture ticket support plateforme | ☐ |
| B10 | Messages | `/espace-eleve/messages` | ⚠️ Liste vide tant qu'aucun 1er message (voir §6) | ☐ |

**Points à valider avec Sébastien :**
- [ ] Le parcours de réservation est-il assez clair ?
- [ ] Les PDF (convocation, facture) sont-ils conformes aux attentes BYS ?
- [ ] Les emails sont-ils professionnels ?

---

### Phase C — Espace centre (25 min)

**Message clé** : *« Chaque centre gère ses stages, ses documents et son identité visuelle. »*

| # | Action | URL / chemin | À montrer | ✅ |
|---|--------|--------------|-----------|---|
| C1 | Connexion centre | `/espace-centre` | Dashboard avec **thème centre** (couleurs, logo, bannière) | ☐ |
| C2 | Profil centre — Design | `/espace-centre/profil-centre?tab=design` | Couleurs, logo, bannière, **cachet numérique** | ☐ |
| C3 | Upload cachet | onglet Design | PNG transparent → apparaît sur convocations / attestations / contrats | ☐ |
| C4 | Formations | `/espace-centre/formations` | CRUD formations (présentiel, type stage, points) | ☐ |
| C5 | Sessions | `/espace-centre/sessions` | Création session, places (min. 6 stagiaires) | ☐ |
| C6 | Calendrier | `/espace-centre/calendrier` | Vue calendrier des sessions | ☐ |
| C7 | Stagiaires | session → détail | Liste inscrits, statuts réservation | ☐ |
| C8 | Émargement | `/espace-centre/emargement` | Feuille PDF collective + individuelle | ☐ |
| C9 | Contrats | `/espace-centre/contrats` | Génération contrat avec cachet centre | ☐ |
| C10 | Documents | `/espace-centre/documents` | Bons d'accord, templates | ☐ |
| C11 | Facturation | `/espace-centre/facturation` | Historique paiements, commission 10% | ☐ |
| C12 | Avis & questionnaires | `/espace-centre/avis` | Configuration questions satisfaction | ☐ |
| C13 | Emails | `/espace-centre/emails` | Templates email personnalisables | ☐ |
| C14 | Paramètres | `/espace-centre/parametres` | SIRET, IBAN, Stripe Connect, responsable & cachet | ☐ |
| C15 | Équipe | `/espace-centre/equipe` | Inviter formateurs / secrétaires | ☐ |
| C16 | Messages | `/espace-centre/messages` | ⚠️ Répondre aux stagiaires (après 1er message) | ☐ |

**Démo cachet numérique (nouveauté) :**
1. Profil centre → Design → uploader un cachet PNG
2. Télécharger une convocation ou attestation
3. Vérifier la zone **« Cachet & signature du centre »** en bas du PDF

---

### Phase D — Plateforme / Admin (15 min)

**Message clé** : *« BYS pilote l'ensemble des centres, revenus et modération. »*

| # | Action | URL / chemin | À montrer | ✅ |
|---|--------|--------------|-----------|---|
| D1 | Dashboard | `/admin/dashboard` ou `/plateforme/dashboard` | KPIs globaux | ☐ |
| D2 | Centres | `/plateforme/centres` | Validation, suspension, statuts | ☐ |
| D3 | Utilisateurs | `/admin/utilisateurs` | Rôles, blocage comptes | ☐ |
| D4 | Revenus | `/plateforme/revenus` | Commissions, abonnements | ☐ |
| D5 | Tickets | `/plateforme/tickets` | Support clients / centres | ☐ |
| D6 | Modération | `/plateforme/moderation` | Centres en attente | ☐ |
| D7 | Avis plateforme | `/admin/avis` | Modération questionnaires | ☐ |
| D8 | Exports | `/plateforme/exports` | Export données CSV | ☐ |
| D9 | Paramètres | `/admin/parametres` | Commission, maintenance | ☐ |

---

### Phase E — Cas limites & sécurité (10 min)

| # | Test | Résultat attendu | ✅ |
|---|------|------------------|---|
| E1 | Accès `/admin` sans connexion | Redirection connexion | ☐ |
| E2 | Élève accède `/espace-centre` | Accès refusé | ☐ |
| E3 | Centre accède `/admin` | Accès refusé | ☐ |
| E4 | Réservation dernière place × 2 | 2e tentative refusée | ☐ |
| E5 | Carte refusée Stripe | Message clair, pas de réservation | ☐ |
| E6 | Responsive mobile (375px) | Menu burger, pas de débordement | ☐ |

---

## 4. Documents PDF à valider ensemble

Cocher après revue visuelle avec Sébastien :

| Document | Logo centre | Cachet centre | Mentions légales | ✅ |
|----------|-------------|---------------|------------------|---|
| Convocation | ☐ | ☐ | ☐ | ☐ |
| Attestation | ☐ | ☐ | ☐ | ☐ |
| Contrat | ☐ | ☐ | ☐ | ☐ |
| Facture | ☐ | N/A | ☐ | ☐ |
| Émargement collectif | ☐ | ☐ | ☐ | ☐ |
| Émargement individuel | ☐ | ☐ | ☐ | ☐ |
| Bon d'accord | ☐ | — | ☐ | ☐ |

> Sans logo/cachet uploadé : initiales du centre ou zone vide (comportement normal).

---

## 5. Grille de validation PAPA

Pour chaque module, noter : **OK** / **À corriger** / **Hors scope**

| Module | Statut | Commentaire Sébastien |
|--------|--------|----------------------|
| Site public & SEO | ☐ OK ☐ À corriger | |
| Recherche & réservation | ☐ OK ☐ À corriger | |
| Paiement Stripe | ☐ OK ☐ À corriger | |
| Emails transactionnels | ☐ OK ☐ À corriger | |
| Espace élève | ☐ OK ☐ À corriger | |
| Espace centre | ☐ OK ☐ À corriger | |
| Personnalisation centre (thème) | ☐ OK ☐ À corriger | |
| Cachet & logo PDF | ☐ OK ☐ À corriger | |
| Questionnaires / avis | ☐ OK ☐ À corriger | |
| Admin / plateforme | ☐ OK ☐ À corriger | |
| Stripe Connect centres | ☐ OK ☐ À corriger | |
| Mobile / responsive | ☐ OK ☐ À corriger | |

---

## 6. Limitations connues (à mentionner en démo)

| Sujet | État | Impact |
|-------|------|--------|
| **Messagerie élève ↔ centre** | Pas de bouton « Nouveau message » | Conversations vides tant qu'aucun 1er message ; à implémenter |
| **Support vs Messages** | Support = tickets plateforme | Distinct de la messagerie centre |
| **Cachet PDF** | PNG/JPEG/WebP uniquement | SVG non supporté dans les PDF |
| **Environnement test** | Paiements fictifs | Carte 4242… obligatoire |

---

## 7. Bugs & retours (à remplir pendant le RDV)

| N° | Page | Description | Priorité (B/I/M) | Décision |
|----|------|-------------|------------------|----------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Légende priorité** : B = Bloquant · I = Important · M = Mineur

---

## 8. Décisions & prochaines étapes

| Sujet | Décision | Responsable | Échéance |
|-------|----------|-------------|----------|
| Mise en production | ☐ Validée ☐ Reportée | | |
| Messagerie (1er contact) | ☐ Prioritaire ☐ Plus tard | | |
| Ajustements PDF / cachet | | | |
| Contenu légal / mentions | | | |
| Go marketing (Ads, SEO) | ☐ Oui ☐ Non | | |

---

## 9. Checklist veille du RDV (Andrys)

- [ ] URL de démo accessible
- [ ] Comptes Auth0 testés (connexion OK)
- [ ] Au moins 1 centre avec logo + cachet uploadés
- [ ] Au moins 1 session avec places disponibles
- [ ] Stripe en mode test fonctionnel
- [ ] PDF convocation téléchargeable sans erreur
- [ ] Ce document imprimé ou partagé à l'écran
- [ ] `GUIDE_RECETTE_CLIENT.md` envoyé à Sébastien pour tests async après la démo

---

## 10. Contacts

| | |
|---|---|
| **Prestataire** | Andrys MAGAR — andrys.developper@gmail.com |
| **Client** | Sébastien Moreau — sebastien@bys-formation.fr |
| **Site** | bys-permis.vercel.app |

---

**Signature recette**

Date : ___ / ___ / 2026

Sébastien — BYS Formation : _______________________

Andrys MAGAR : _______________________
