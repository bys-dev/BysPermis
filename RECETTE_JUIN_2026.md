# Séance de test complète — juin 2026

> **Date de recette** : 18 juin 2026  
> **Centre** : BYS Formation Cergy  
> **Session** : 18 – 19 juin 2026  
> **Mot de passe démo** : `DemoByspermis2026!`

---

## 1. Préparer les données en base

```bash
cd byspermis
npm run seed:recette      # crée session + 3 réservations + factures + documents
npm run verify:recette    # génère tous les PDF + compte rendu auto
```

Fichiers générés :
- PDF locaux → `recette-output-juin-2026/`
- Rapport auto → `RECETTE_JUIN_2026_RESULT.md`

---

## 2. Comptes à utiliser

| Rôle | Email | Usage |
|------|-------|-------|
| Élève (CONFIRMEE) | `marie.durand@outlook.fr` | Convocation, contrat, facture, documents |
| Élève (TERMINEE) | `karim.bouaziz@gmail.com` | Attestation, émargement, bon signé |
| Élève (CONFIRMEE #2) | `alexandre.petit@orange.fr` | Émargement collectif (2e stagiaire) |
| Centre owner | `contact@bys-formation.fr` | Émargement collectif, documents centre |
| Admin | `admin@bys-formation.fr` | Validation admin si besoin |

---

## 3. Données créées en base

| Référence | Statut | Élève | Facture |
|-----------|--------|-------|---------|
| `RES-RECETTE-18JUN-001` | CONFIRMEE | Marie Durand | `FAC-RECETTE-2026-001` |
| `RES-RECETTE-18JUN-002` | TERMINEE | Karim Bouaziz | `FAC-RECETTE-2026-002` |
| `RES-RECETTE-18JUN-003` | CONFIRMEE | Alexandre Petit | `FAC-RECETTE-2026-003` |

**Formation** : Stage de récupération de points - Cergy  
**Lieu** : 5 Place des Merveilles, 95800 Cergy  
**Formateur** : Miguel Garcia (BAFM)

---

## 4. Tableau de test — tous les documents

| # | Document | Où le tester | Réservation | Images / cachet | Date attendue | OK | Commentaire |
|---|----------|--------------|-------------|-----------------|---------------|----|-------------|
| 1 | **Convocation** | Élève → Réservations → Télécharger / API | `RES-RECETTE-18JUN-001` | Logo PNG BYS + cachet placeholder | 18 juin 2026 | ☐ | |
| 2 | **Contrat** | Élève → Réservations → Contrat / API | `RES-RECETTE-18JUN-001` | Logo + cachet + mentions légales | 18 juin 2026 | ☐ | |
| 3 | **Facture** | Élève → Factures / API invoice | `FAC-RECETTE-2026-001` | Logo centre | 18 juin 2026 | ☐ | |
| 4 | **Bon d'accord** (à signer) | Élève → Documents | `RES-RECETTE-18JUN-001` | Texte — pas d'image | juin 2026 | ☐ | Cocher « Lu et accepté » |
| 5 | **Règlement intérieur** | Élève → Documents | `RES-RECETTE-18JUN-001` | Texte « juin 2026 » | juin 2026 | ☐ | |
| 6 | **CNI placeholder** | Élève → Documents (upload) | `RES-RECETTE-18JUN-002` | **Placeholder texte** — pas de vraie photo | juin 2026 | ☐ | |
| 7 | **Bon d'accord signé** | Élève → Documents (accepté) | `RES-RECETTE-18JUN-002` | Signature « Karim Bouaziz » | **18/06/2026** | ☐ | |
| 8 | **Émargement individuel** | Élève / Centre → PDF | `RES-RECETTE-18JUN-002` | Logo + cachet | 18-19 juin 2026 | ☐ | |
| 9 | **Émargement collectif** | Centre → Sessions → Émargement | Session 18-19 juin | Logo + cachet + 3 noms | 18-19 juin 2026 | ☐ | |
| 10 | **Attestation** | Élève → Réservations (TERMINEE) | `RES-RECETTE-18JUN-002` | Logo + cachet + QR | **18/06/2026** | ☐ | Uniquement si TERMINEE |

### URLs API (connecté avec le bon compte)

Remplacer `{id}` par l'ID réservation ou le numéro `RES-RECETTE-18JUN-00x` :

```
GET /api/convocation/RES-RECETTE-18JUN-001
GET /api/contrats/RES-RECETTE-18JUN-001
GET /api/attestations/{id-karim}        ← résa TERMINEE uniquement
GET /api/emargement/RES-RECETTE-18JUN-002
GET /api/centre/sessions/{sessionId}/emargement
```

---

## 5. Parcours de test pas à pas (45 min)

### Phase A — Élève Marie (CONFIRMEE) — 15 min

1. Connexion `marie.durand@outlook.fr`
2. **Mes réservations** → vérifier stage Cergy **18-19 juin 2026**
3. Télécharger **convocation** → vérifier dates, lieu, logo
4. Télécharger **contrat** → vérifier prix 240 €, mentions BYS
5. **Factures** → `FAC-RECETTE-2026-001` → PDF OK
6. **Documents** → bon d'accord à signer + règlement « juin 2026 »

### Phase B — Élève Karim (TERMINEE) — 15 min

1. Connexion `karim.bouaziz@gmail.com`
2. Réservation `RES-RECETTE-18JUN-002` → statut **Terminée**
3. Télécharger **attestation** → date du jour, QR code
4. **Émargement** individuel → présent 18-19 juin
5. **Documents** → bon d'accord **déjà signé** le 18/06/2026
6. CNI → texte placeholder (pas d'image réelle)

### Phase C — Centre Cergy — 15 min

1. Connexion `contact@bys-formation.fr`
2. **Sessions** → session **18-19 juin 2026** → 3 inscrits
3. Télécharger **émargement collectif** → 3 noms + lignes vides
4. **Documents** → modèles bon d'accord + règlement juin 2026
5. Vérifier fiche centre sur `/centres/bys-formation-cergy`

---

## 6. Compte rendu après test (à remplir)

| Zone | Résultat | Bloquant ? | Action corrective |
|------|----------|------------|-------------------|
| Convocation PDF | ☐ OK ☐ KO | ☐ | |
| Contrat PDF | ☐ OK ☐ KO | ☐ | |
| Facture PDF | ☐ OK ☐ KO | ☐ | |
| Attestation PDF | ☐ OK ☐ KO | ☐ | |
| Émargement indiv. | ☐ OK ☐ KO | ☐ | |
| Émargement collectif | ☐ OK ☐ KO | ☐ | |
| Bon d'accord signé | ☐ OK ☐ KO | ☐ | |
| Logo visible PDF | ☐ OK ☐ KO | ☐ | |
| Cachet / signature | ☐ OK ☐ KO | ☐ | Placeholder juin 2026 |
| Dates juin 2026 | ☐ OK ☐ KO | ☐ | |
| Espace élève documents | ☐ OK ☐ KO | ☐ | |
| Espace centre sessions | ☐ OK ☐ KO | ☐ | |

**Testeur** : ___________________  
**Date** : 18 juin 2026  
**Environnement** : ☐ Local ☐ Vercel staging (`bys-permis.vercel.app`)  
**Verdict global** : ☐ Validé ☐ Validé avec réserves ☐ Refusé  

**Réserves / bugs trouvés** :

```
(à compléter après la séance)
```

---

## 7. Placeholders images (juin 2026)

| Élément | Type | Valeur recette |
|---------|------|----------------|
| Logo centre | PNG réel | `colored-logo.png` (BYS) |
| Cachet signature | PNG placeholder | Même fichier logo |
| Photo CNI élève | **Texte seulement** | « CNI placeholder — juin 2026 » |
| Bannière centre | Unsplash | Image stock (pas bloquant) |

> Les vraies photos (CNI, cachet scanné) seront fournies par le client — voir `DEMANDES_CLIENT_COMPLET.md`.

---

*Scripts : `npm run seed:recette` · `npm run verify:recette`*
