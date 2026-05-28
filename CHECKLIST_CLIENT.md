# Éléments à fournir par BYS Formation (Sébastien)

> À transmettre à Andrys MAGAR — Email : `andrys.developper@gmail.com`
> Délai souhaité : avant le **24 mai 2026** pour mise en ligne.

Tout ce qui est marqué 🔴 est **bloquant** pour la mise en production.
Le reste peut arriver après la mise en ligne.

---

## 1. Société & juridique 🔴

| Élément | Détail | Format attendu |
|---------|--------|----------------|
| 🔴 Raison sociale exacte | « BYS Formation SARL » ou autre | Texte |
| 🔴 SIRET | N° SIRET de BYS Formation | 14 chiffres |
| 🔴 N° TVA intracommunautaire | Si applicable | `FR XX XXXXXXXXX` |
| 🔴 Code APE / NAF | Activité principale | ex. `8559A` |
| 🔴 Adresse siège social | Pour CGV + mentions légales | Adresse complète |
| 🔴 Nom du responsable de publication | Pour mentions légales | Nom + prénom |
| 🔴 Email contact public | Affiché sur le site (contact, support) | adresse email |
| 🔴 Téléphone contact public | Optionnel mais recommandé | +33 X XX XX XX XX |
| 🔴 K-bis < 3 mois | Demandé par Stripe pour activation Connect | PDF |
| ⚪ Pièce d'identité du dirigeant | Demandé par Stripe (KYC) | PDF recto/verso |
| ⚪ RIB de BYS Formation | Pour reverser les commissions de la plateforme | IBAN + BIC |

---

## 2. Domaine & marque 🔴

| Élément | Détail |
|---------|--------|
| 🔴 Domaine définitif | `bys-permis.fr` (déjà pressenti ?) → confirmer + me déléguer DNS ou me donner accès registrar |
| 🔴 Email de réception | Adresse `noreply@bys-permis.fr` (auto) + adresse réelle pour réponses clients |
| 🔴 Logo vectoriel | SVG ou AI/PDF, fond transparent |
| ⚪ Logo carré (favicon) | PNG 512×512 |
| ⚪ Charte couleurs validée | Actuel : navy `#0A1628` + rouge `#DC2626` |

---

## 3. Stripe (compte BYS) 🔴

Sébastien doit créer/activer le compte Stripe au nom de BYS Formation. Sans ça, aucun paiement possible.

| Étape | Action |
|-------|--------|
| 🔴 1 | Créer un compte Stripe sur https://dashboard.stripe.com |
| 🔴 2 | Activer le mode **Live** (KYC : K-bis, pièce d'identité, RIB) |
| 🔴 3 | Activer **Stripe Connect** → Express accounts (Settings → Connect → Get started) |
| 🔴 4 | M'inviter en collaborateur (`Developer` role) sur `andrys.developper@gmail.com` |
| ⚪ 5 | Personnaliser le branding (logo, couleur primaire) |

---

## 4. Agréments & conformité métier 🔴

Pour chaque centre partenaire onboardé (à commencer par les centres BYS) :

| Élément | Détail | Bloquant ? |
|---------|--------|-----------|
| 🔴 N° d'agrément préfectoral | Délivré par la préfecture pour exercer comme animateur de stage | Oui — refus d'inscription sinon |
| 🔴 Département de l'agrément | ex. `95` pour Val-d'Oise | Oui |
| 🔴 Date de fin de validité | Date d'expiration de l'agrément | Oui |
| 🔴 Arrêté préfectoral | PDF scanné | À archiver |
| ⚪ Certificat Qualiopi | Si disponible (option marketing, pas obligatoire pour stage récup) | PDF |
| ⚪ Liste des animateurs | Nom, qualification (BAFM ou psychologue), n° de certification | CSV ou tableau |

---

## 5. Contenus rédactionnels ⚪

Pour la V1, j'ai mis des textes par défaut. Sébastien peut les remplacer s'il souhaite ajuster le ton.

| Section | Statut actuel | Action client |
|---------|---------------|---------------|
| Hero accueil | Texte générique « Récupérez vos points » | Valider ou réécrire |
| Page « À propos » | Texte générique sur BYS Formation | Réécrire avec vraie histoire / valeurs |
| Page « Comment ça marche » | Texte légal correct | Valider |
| FAQ | 10 questions/réponses légales en place | Ajouter/modifier au besoin |
| Articles blog | 3 articles démo | Fournir au moins 3 articles SEO réels (mots-clés : « stage récupération points {ville} ») |
| CGU / CGV | Modèle juridique générique | Faire valider par avocat/juriste |
| Mentions légales | Remplies avec coordonnées prestataire | À compléter avec coordonnées BYS |
| Politique de confidentialité (RGPD) | Modèle générique | Faire valider |

---

## 6. Centres partenaires (onboarding) ⚪

Pour démarrer avec un catalogue rempli :

| Élément | Détail |
|---------|--------|
| ⚪ Liste des centres BYS | Nom, adresse, ville, téléphone, email pour chaque |
| ⚪ Photos des centres | 1 image par centre (façade ou salle), 1200×800 min |
| ⚪ Description courte | 1-2 paragraphes par centre |
| ⚪ Email du responsable centre | Pour créer le compte `CENTRE_OWNER` Auth0 |
| ⚪ Prix de référence par stage | Par défaut 230-280€, ajuster si besoin |
| ⚪ Calendrier prévisionnel | Dates des prochains stages pour pré-remplir les sessions |

---

## 7. Emails transactionnels ⚪

Templates par défaut OK, mais à valider :

| Email | Quand envoyé | Variables |
|-------|--------------|-----------|
| Bienvenue | À l'inscription élève | `{{prenom}}` |
| Confirmation réservation | Après paiement Stripe OK | `{{numero}}`, `{{formation}}`, `{{dateDebut}}`, `{{centre}}` |
| Convocation (PDF joint) | Après paiement Stripe OK | idem + PDF |
| Rappel J-2 | 48h avant la session | `{{prenom}}`, `{{formation}}`, `{{dateDebut}}`, `{{lieu}}` |
| Notification centre | Quand nouvel inscrit | `{{centre}}`, `{{stagiaire}}`, `{{session}}` |
| Annulation | Si annulation par le stagiaire | `{{numero}}`, `{{remboursement}}` |

Action client : valider le ton + signature email.

---

## 8. Communication & ouverture commerciale ⚪

| Élément | Détail |
|---------|--------|
| ⚪ Date de lancement public | À fixer (suggestion : 1er juin 2026) |
| ⚪ Canaux d'annonce | Mailing à la base existante BYS ? Réseaux sociaux ? |
| ⚪ Tarif promo lancement | Ex. code `BYS10` -10% les 30 premiers jours |
| ⚪ Compte Google My Business par centre | Pour SEO local |

---

## 9. Sécurité & accès 🔴

Pour que je puisse opérer correctement :

| Élément | Détail |
|---------|--------|
| 🔴 Email du dirigeant pour compte `OWNER` | Bilal et/ou Sébastien : qui aura les droits ultimes ? |
| 🔴 Liste des admins | Email + prénom + rôle souhaité (`ADMIN`, `SUPPORT`, `COMPTABLE`, `COMMERCIAL`) |
| ⚪ 2FA activé sur le compte propriétaire | Recommandé sur tous les comptes admin |

---

## 10. Post-livraison ⚪

| Élément | Détail |
|---------|--------|
| ⚪ Procédure de signalement bug | Channel dédié (email/Slack/Notion) |
| ⚪ Plage horaire pour interventions urgentes | Définir SLA |
| ⚪ Contrat de maintenance | Discuter au-delà de la V1 (m1-m3 inclus dans contrat ?) |

---

## Résumé urgent (top priorités)

Si tu ne devais me fournir que **5 choses cette semaine** :

1. **Compte Stripe activé en mode Live + Stripe Connect actif** (sans ça, zéro paiement possible)
2. **Domaine `bys-permis.fr` + accès DNS** (ou délégation à mon compte Vercel)
3. **Logo SVG + favicon 512×512**
4. **Infos juridiques BYS** : raison sociale, SIRET, TVA, adresse, responsable
5. **N° d'agrément préfectoral + date d'expiration** pour au moins le centre principal BYS (Osny)

Tout le reste peut suivre dans les semaines suivantes.

---

**Contact** : Andrys MAGAR — `andrys.developper@gmail.com`
