# Purge DB prod — recentrage scope « stages récupération de points »

> Contexte : la DB de prod actuelle contient des formations héritées **hors scope** (Permis Moto A2, FIMO, Sensibilisation entreprise, etc.) qui s'affichent encore sur la home (`bys-permis-fnc94.vercel.app`).
> Objectif : purger ces entrées pour ne garder que les stages récupération de points.

## Protection logicielle déjà en place

Même tant que la DB n'est pas purgée, les filtres serveur posés bloquent l'affichage hors-scope :

- `src/app/page.tsx` — `fetchLiveFormations()` filtre par catégorie OU titre matchant récup/sensib/48/probatoire
- `src/app/api/formations/route.ts` — applique `modalite=PRESENTIEL` + le même filtre catégorie/titre sur **toutes** les requêtes publiques (recherche, listing, géoloc)
- `src/app/recherche/page.tsx` — option modalité limitée à PRÉSENTIEL
- `src/app/api/centre/formations/*` — Zod refuse la création avec `modalite ≠ PRESENTIEL` ou `isCPF=true`

Donc l'utilisateur public ne verra plus jamais ces formations. Mais elles restent en DB → encombrement et risque de fuite si un nouveau code oublie le filtre.

## Étapes recommandées pour purger

### 1. Identifier les formations hors-scope

Connecte-toi à la DB de prod et exécute :

```sql
-- Formations hors scope récup points
SELECT f.id, f.titre, f.slug, c.nom AS categorie, ce.nom AS centre, ce.ville
FROM formations f
LEFT JOIN categories c ON f."categorieId" = c.id
JOIN centres ce ON f."centreId" = ce.id
WHERE
  COALESCE(c.nom, '') !~* '(récup|sensib|48|probatoire)'
  AND f.titre !~* '(récupération de points|stage 48|sensibilisation)'
ORDER BY ce.nom;
```

Tu obtiendras la liste de toutes les formations à supprimer (Permis Moto, FIMO, etc.).

### 2. Sauvegarder avant suppression

```bash
# Dump complet avant purge
pg_dump $DATABASE_URL > backup-avant-purge-$(date +%Y%m%d).sql
```

### 3. Supprimer en cascade

```sql
BEGIN;

-- a) Supprimer les sessions des formations hors-scope (sans réservations)
DELETE FROM sessions s
WHERE s."formationId" IN (
  SELECT f.id FROM formations f
  LEFT JOIN categories c ON f."categorieId" = c.id
  WHERE COALESCE(c.nom, '') !~* '(récup|sensib|48|probatoire)'
    AND f.titre !~* '(récupération de points|stage 48|sensibilisation)'
)
AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r."sessionId" = s.id);

-- b) Supprimer les formations qui n'ont plus de sessions ET pas de favoris/reviews
DELETE FROM favorites WHERE "formationId" IN (
  SELECT f.id FROM formations f
  LEFT JOIN categories c ON f."categorieId" = c.id
  WHERE COALESCE(c.nom, '') !~* '(récup|sensib|48|probatoire)'
    AND f.titre !~* '(récupération de points|stage 48|sensibilisation)'
);

DELETE FROM reviews WHERE "formationId" IN (
  SELECT f.id FROM formations f
  LEFT JOIN categories c ON f."categorieId" = c.id
  WHERE COALESCE(c.nom, '') !~* '(récup|sensib|48|probatoire)'
    AND f.titre !~* '(récupération de points|stage 48|sensibilisation)'
);

DELETE FROM formations f
WHERE COALESCE((SELECT c.nom FROM categories c WHERE c.id = f."categorieId"), '') !~* '(récup|sensib|48|probatoire)'
  AND f.titre !~* '(récupération de points|stage 48|sensibilisation)'
  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s."formationId" = f.id);

-- c) Supprimer les catégories devenues orphelines
DELETE FROM categories c
WHERE NOT EXISTS (SELECT 1 FROM formations f WHERE f."categorieId" = c.id)
  AND c.nom !~* '(récup|sensib|48|probatoire)';

COMMIT;
```

### 4. Si des réservations existent sur des formations hors-scope

Trois choix :

1. **Honorer** : laisser les sessions + formations vivre jusqu'à passage de la session (status `PASSEE`), puis purger
2. **Annuler + rembourser** : passer les réservations à `REMBOURSEE` via l'admin Stripe, puis supprimer
3. **Migrer** : convertir la formation en stage récup points équivalent

À discuter avec Sébastien — il y aura sans doute peu de réservations réelles à ce stade.

### 5. Re-seed propre

```bash
# Sur staging d'abord
npm run db:reset          # ⚠️ Détruit tout, applique migrations, seed.ts + seed-demo.ts + seed-auth0.ts
```

Le seed actuel (`prisma/seed.ts`) crée déjà uniquement des stages récup points sur 6 centres BYS.

## Vérification finale

```sql
-- Doit retourner 0
SELECT COUNT(*) FROM formations f
LEFT JOIN categories c ON f."categorieId" = c.id
WHERE COALESCE(c.nom, '') !~* '(récup|sensib|48|probatoire)'
  AND f.titre !~* '(récupération de points|stage 48|sensibilisation)';

-- Doit retourner 0 (aucune formation distanciel/hybride)
SELECT COUNT(*) FROM formations WHERE modalite != 'PRESENTIEL';

-- Doit retourner 0 (aucun stage CPF en V1)
SELECT COUNT(*) FROM formations WHERE "isCPF" = true;
```

## Sécurité supplémentaire — ajouter une contrainte DB

Pour éviter qu'un futur dev ré-introduise du hors-scope, on peut poser un CHECK contraint :

```sql
ALTER TABLE formations
  ADD CONSTRAINT formations_presentiel_only CHECK (modalite = 'PRESENTIEL');

ALTER TABLE formations
  ADD CONSTRAINT formations_no_cpf_v1 CHECK ("isCPF" = false);
```

À discuter — peut être trop strict si scope évolue en V2.
