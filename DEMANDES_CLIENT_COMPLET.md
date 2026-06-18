# Demandes client — BYS Formation Permis

> Document à envoyer à **Sébastien / BYS Formation** pour compléter la plateforme avant mise en production.
>
> **Contact prestataire** : Andrys MAGAR — `andrys.developper@gmail.com`
>
> Cochez chaque ligne une fois la réponse reçue. Les éléments 🔴 bloquent la mise en ligne.

---

## Comment utiliser ce document

1. Répondez **d'abord aux sections 🔴** (bloquantes).
2. Renvoyez les fichiers (PDF, logos, CSV) par email ou lien Drive.
3. Indiquez clairement ce qui est **définitif** vs **provisoire**.

Checklist courte : [`CHECKLIST_CLIENT.md`](./CHECKLIST_CLIENT.md)

---

## 1. Identité & coordonnées publiques 🔴

### 1.1 Contact affiché (page `/contact`, footer, emails)

| # | Question | Réponse client | Actuellement sur le site |
|---|----------|---------------|-------------------------|
| 1 | Email contact **officiel** affiché aux visiteurs ? | | `bysforma95@gmail.com` |
| 2 | Téléphone **complet** (affichage + clic mobile) ? | | `01 34 25 XX XX` |
| 3 | Adresse postale **exacte** (ligne par ligne) ? | | Bât. 7, 9 Chaussée Jules César, 95520 Osny |
| 4 | Horaires d'accueil / support téléphonique ? | | Lun–Ven 9h–18h |
| 5 | Délai de réponse garanti (24h, 48h) ? | | « 24h ouvrées » |
| 6 | Boîte mail qui reçoit le **formulaire de contact** ? | | À configurer |
| 7 | Boîte mail pour **demandes partenaires** (centres) ? | | |
| 8 | Boîte mail pour **support technique** plateforme ? | | |
| 9 | Numéro mobile / WhatsApp business (oui/non + numéro) ? | | Non |
| 10 | Réseaux sociaux **marque BYS** (URLs) ? | | |

### 1.2 Identité légale affichée

| # | Question | Réponse client |
|---|----------|----------------|
| 11 | Raison sociale exacte (SAS, SARL, autre) ? | BYS Formation — SAS (à confirmer) |
| 12 | SIRET (14 chiffres) ? | 987 512 381 00011 (à confirmer) |
| 13 | N° TVA intracommunautaire ? | |
| 14 | Code APE / NAF ? | |
| 15 | Capital social ? | |
| 16 | RCS + ville d'immatriculation ? | |
| 17 | Nom complet du **directeur de publication** ? | Sébastien (nom de famille ?) |
| 18 | Nom complet du **DPO** ou contact RGPD ? | |

---

## 2. Domaine, marque & visuels 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 19 | Domaine définitif confirmé (`bys-permis.fr` ?) | |
| 20 | Accès registrar DNS ou délégation technique ? | |
| 21 | Logo vectoriel (SVG/AI) fond transparent ? | |
| 22 | Favicon 512×512 ? | |
| 23 | Charte couleurs validée (navy + rouge actuels OK ?) | |
| 24 | Photo hero / bannière accueil (droits d'usage) ? | |
| 25 | Signature email type (logo + texte légal) ? | |
| 26 | Nom commercial exact : « BYS Formation », « BYS Permis », autre ? | |

---

## 3. Paiements Stripe 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 27 | Compte Stripe BYS créé et **mode Live** activé ? | |
| 28 | KYC Stripe complété (K-bis, ID, RIB) ? | |
| 29 | **Stripe Connect** activé (comptes Express centres) ? | |
| 30 | Invitation collaborateur dev (`andrys.developper@gmail.com`) ? | |
| 31 | Branding Stripe (logo, couleur) personnalisé ? | |
| 32 | Politique de **remboursement** en cas d'annulation élève ? | |
| 33 | Délai d'annulation gratuite (ex. J-7, J-3) ? | |
| 34 | Frais d'annulation partielle ou totale ? | |
| 35 | Qui gère les litiges chargeback côté BYS ? | |

---

## 4. Commissions & modèle économique 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 36 | Taux de **commission plateforme** par défaut (actuellement 10 %) ? | |
| 37 | Commissions **négociées par centre** (exceptions) ? | |
| 38 | Abonnement centres (plans STARTER / PRO) : tarifs réels ? | |
| 39 | Qui facture le stagiaire : BYS ou le centre (via Stripe Connect) ? | |
| 40 | TVA sur commission : taux et mention facture ? | |
| 41 | RIB BYS pour reversement des commissions plateforme ? | |

---

## 5. Agréments & conformité métier 🔴

Pour **chaque centre** (commencer par Osny, Cergy, Paris…) :

| # | Question | Réponse client |
|---|----------|----------------|
| 42 | N° d'**agrément préfectoral** animateur de stage ? | |
| 43 | Département de l'agrément ? | |
| 44 | Date de **fin de validité** ? | |
| 45 | PDF de l'**arrêté préfectoral** ? | |
| 46 | Certificat **Qualiopi** (oui/non + PDF si oui) ? | |
| 47 | Peut-on afficher le badge « Agréé Ministère / Préfecture » partout ? | |
| 48 | Peut-on afficher « Certifié Qualiopi » (centres sans certif = interdit) ? | |
| 49 | Liste des **animateurs** : nom, BAFM/psychologue, n° certification ? | |
| 50 | Assurance RC Pro du centre (nom assureur, n° police) ? | |

---

## 6. Catalogue centres & formations 🔴

### 6.1 Par centre

| # | Question | Réponse client |
|---|----------|----------------|
| 51 | Liste complète des centres à publier (nom, adresse, CP, ville) ? | |
| 52 | Email du **responsable** pour compte `CENTRE_OWNER` ? | |
| 53 | Téléphone public du centre ? | |
| 54 | Logo du centre (PNG/SVG) ? | |
| 55 | Photo façade ou salle (min 1200×800) ? | |
| 56 | Description courte (2–3 phrases) ? | |
| 57 | Horaires d'ouverture du centre ? | |
| 58 | Équipements (parking, PMR, wifi…) ? | |
| 59 | Coordonnées GPS vérifiées (lat/lng) si adresse atypique ? | |

### 6.2 Par formation / stage

| # | Question | Réponse client |
|---|----------|----------------|
| 60 | Titres officiels des stages proposés ? | |
| 61 | Prix TTC par stage (fourchette ou fixe) ? | |
| 62 | Durée (ex. « 2 jours ») ? | |
| 63 | Programme détaillé jour 1 / jour 2 ? | |
| 64 | Prérequis stagiaire (permis, points, 48N…) ? | |
| 65 | Documents à apporter (liste validée) ? | |
| 66 | **Calendrier des sessions** : dates, places, horaires ? | |
| 67 | Nombre minimum / maximum de places par session (min 6 légal) ? | |
| 68 | Lieu exact de la session si différent du siège ? | |

---

## 7. Contenus site & SEO ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 69 | Texte hero accueil validé ou réécrit ? | Générique actuel |
| 70 | Page « À propos » : histoire, valeurs, équipe ? | |
| 71 | Page « Comment ça marche » validée ? | |
| 72 | FAQ : ajouts / corrections (10 Q&R en place) ? | |
| 73 | **3 articles blog minimum** pour le lancement (SEO villes) ? | |
| 74 | Villes prioritaires SEO (Paris, Lyon, Marseille…) ? | |
| 75 | Chiffre « 150+ centres » : réel ou marketing (à ajuster) ? | |
| 76 | Témoignages clients réels autorisés (nom, ville, texte) ? | |
| 77 | Avis Google / note moyenne à afficher (oui/non) ? | |

---

## 8. Pages légales 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 78 | CGU / CGV : validation par un **avocat** ? | Modèle générique |
| 79 | Mentions légales complètes validées ? | Partiellement rempli |
| 80 | Politique de confidentialité (RGPD) validée ? | Modèle générique |
| 81 | Politique cookies : outil de consentement souhaité ? | |
| 82 | Texte bandeau cookies (Accepter / Refuser) ? | |
| 83 | Durée de conservation des données stagiaires ? | |
| 84 | Sous-traitants à lister (Stripe, Auth0, Vercel, Resend…) ? | |

---

## 9. Emails & notifications ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 85 | Adresse **expéditeur** emails (ex. `noreply@bys-permis.fr`) ? | |
| 86 | Nom affiché expéditeur (« BYS Formation ») ? | |
| 87 | Signature email (nom, téléphone, lien) ? | |
| 88 | Valider texte email **confirmation réservation** ? | |
| 89 | Valider texte email **convocation** + PDF joint ? | |
| 90 | Valider email **rappel J-2** avant stage ? | |
| 91 | Valider email **annulation / remboursement** ? | |
| 92 | Valider email **nouveau partenaire centre** invité ? | |
| 93 | Valider email **centre activé** après validation admin ? | |
| 94 | Notifications SMS souhaitées (oui/non) ? | |

---

## 10. Documents PDF (convocation, facture, attestation) 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 95 | Modèle **convocation** validé (mentions obligatoires préfecture) ? | |
| 96 | Logo à utiliser sur les PDF (BYS seul ou logo centre) ? | |
| 97 | Tampon / signature numérique du responsable centre ? | |
| 98 | Mentions légales pied de page facture ? | |
| 99 | Numérotation des factures (préfixe, séquence) ? | |
| 100 | TVA applicable sur les stages (taux) ? | |
| 101 | Texte attestation de fin de stage validé ? | |

---

## 11. Parcours élève & réservation ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 102 | Champs obligatoires à l'inscription (n° permis, date délivrance…) ? | |
| 103 | Éligibilité **48N / 48SI / probatoire** : règles à appliquer strictement ? | |
| 104 | Paiement en plusieurs fois souhaité (oui/non) ? | |
| 105 | Codes promo lancement (ex. `BYS10`, montant, durée) ? | |
| 106 | Carte CPF : stages éligibles ou non (actuellement non) ? | |
| 107 | Délai pour recevoir la convocation après paiement (immédiat OK ?) ? | |

---

## 12. Espace centre & process internes ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 108 | Qui valide les **nouveaux centres** côté BYS (nom, rôle) ? | |
| 109 | Délai maximum pour valider un centre en attente ? | |
| 110 | Qui gère l'**émargement** (formateur, secrétariat) ? | |
| 111 | Export CSV des inscrits : colonnes obligatoires ? | |
| 112 | Contrat type centre–BYS (PDF à fournir) ? | |
| 113 | Stripe Connect : le centre doit connecter son compte avant 1ère vente ? | |

---

## 13. Administration & accès 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 114 | Email compte **OWNER** (droits ultimes) : Sébastien ou Bilal ? | |
| 115 | Liste des comptes **ADMIN** (email + prénom) ? | |
| 116 | Compte **SUPPORT** (email) ? | |
| 117 | Compte **COMPTABLE** (email) ? | |
| 118 | Compte **COMMERCIAL** (email) ? | |
| 119 | Activation **2FA** obligatoire pour les admins ? | |
| 120 | Procédure si départ d'un collaborateur (révocation accès) ? | |

---

## 14. Technique & exploitation 🔴

| # | Question | Réponse client |
|---|----------|----------------|
| 121 | Environnement de prod : domaine final pointé vers Vercel ? | |
| 122 | Compte Auth0 production : qui est propriétaire ? | |
| 123 | Base de données prod : hébergeur (Neon, autre) ? | |
| 124 | Service d'envoi d'emails (Resend, autre) : compte BYS ? | |
| 125 | Monitoring erreurs (Sentry) : alertes vers quelle email ? | |
| 126 | Sauvegardes BDD : fréquence acceptable ? | |
| 127 | **Mode maintenance** : qui peut l'activer, message à afficher ? | |

---

## 15. Lancement & communication ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 128 | Date de **lancement public** cible ? | |
| 129 | Annonce mailing base existante BYS (oui/non, date) ? | |
| 130 | Réseaux sociaux : posts prévus ? | |
| 131 | Google My Business par centre (qui crée les fiches) ? | |
| 132 | Budget Google Ads / Meta (voir `GUIDE_ADS_SEO.md`) ? | |
| 133 | Partenaires à prévenir en priorité (liste emails) ? | |

---

## 16. Recette, support & maintenance ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 134 | Qui fait la **recette métier** côté BYS (nom, dispo) ? | |
| 135 | Qui signe le **PV de recette** / go-live ? | |
| 136 | Canal support post-lancement (email, WhatsApp, Notion) ? | |
| 137 | Plage horaire interventions urgentes (SLA) ? | |
| 138 | Contrat de maintenance au-delà de la V1 (durée, périmètre) ? | |
| 139 | Formation des équipes BYS à l'admin / espace centre (date) ? | |

---

## 17. Décisions produit à trancher ⚪

| # | Question | Réponse client |
|---|----------|----------------|
| 140 | Afficher les stages **hors France** / DOM-TOM ? | |
| 141 | Stages **distanciel** autorisés (actuellement présentiel seul) ? | |
| 142 | Avis clients **vérifiés** uniquement ou modération manuelle ? | |
| 143 | Centres concurrents peuvent s'inscrire seuls ou sur invitation ? | |
| 144 | Commission admin affichée en dur (10 %) : taux définitif ? | |
| 145 | Langue du site : français seul ou bilingue plus tard ? | |

---

## Top 15 — à envoyer en priorité cette semaine

1. Email + téléphone + horaires **officiels** (section 1)
2. Destinataires du **formulaire contact** et des emails transactionnels
3. Stripe **Live** + Connect + invitation dev
4. Domaine + accès **DNS**
5. Logo SVG + favicon
6. SIRET, TVA, forme juridique, directeur de publication (section 1–2)
7. Agrément préfectoral **Osny** (n°, date fin, PDF)
8. Calendrier **sessions réelles** + prix pour centres BYS
9. Taux de **commission** définitif
10. CGV/CGU validées par avocat
11. Politique **remboursement / annulation**
12. Liste comptes **OWNER + ADMIN + SUPPORT**
13. Modèle **convocation PDF** validé
14. Confirmation texte **« Agréé préfecture »** et Qualiopi
15. Date de **lancement** + responsable recette

---

## À faire côté équipe technique (après réponses client)

- [ ] Mettre à jour `/contact` (email, téléphone, horaires, liens `tel:` / `mailto:`)
- [ ] Aligner footer, mentions légales, CGU, emails transactionnels
- [ ] Configurer destinataires API `/api/contact`
- [ ] Remplacer données démo (centres, blog, témoignages) par données réelles
- [ ] Valider commission admin (plus de valeur en dur si client confirme autre taux)
- [ ] Passer Stripe en **Live** avec clés production
- [ ] Configurer domaine + emails `@bys-permis.fr`
- [ ] Rejouer guide recette [`GUIDE_RECETTE_CLIENT.md`](./GUIDE_RECETTE_CLIENT.md) sur prod

---

**Contact prestataire** : Andrys MAGAR — `andrys.developper@gmail.com`
