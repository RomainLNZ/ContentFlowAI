# Workspace Intelligence

Workspace Intelligence est la couche déterministe du Sprint 4. Elle transforme des données Prisma
tenant-scoped en un `WorkspaceIntelligenceSnapshot` entièrement typé. Elle n’appelle aucun
fournisseur IA, ne produit aucune recommandation et ne persiste aucun Director.

## Séparation des responsabilités

- `WorkspaceIntelligenceService` charge les données avec `organizationId` et `workspaceId`.
- `WorkspaceIntelligenceSnapshotBuilder` effectue uniquement des calculs purs.
- `IntelligenceClock` fournit l’instant de référence et peut être remplacée dans les tests.

Le service ne sélectionne jamais `body`, `cta` ou `hashtags`. Le snapshot conserve uniquement des
identifiants, statuts, dates, types, compteurs et faits agrégés.

Il expose également un contexte de marque borné : identité, mission, valeurs, ton, règles lexicales,
produits/services et audiences. Ce contexte provient exclusivement du Brand Profile et de
l’organisation ; aucun texte de contenu éditorial n’y est inclus.

## Fenêtres et seuils

- Historique de cadence : 30 jours.
- Horizon éditorial : 30 jours.
- Cadence par défaut : 3 publications par semaine.
- Silence par défaut : 7 jours consécutifs.
- Campagne couverte : au moins 2 contenus, dont au moins un `APPROVED`, `SCHEDULED` ou `PUBLISHED`.
- Objectif sous-représenté : aucun contenu, ou moins de 50 % de sa part théorique uniforme.
- Validation bloquée : `READY_FOR_REVIEW` depuis au moins 48 heures.
- Corrections bloquées : `CHANGES_REQUESTED` depuis au moins 72 heures.
- Contenu approuvé non planifié : au moins 72 heures.
- Créneau manqué : contenu `SCHEDULED` dont la date est passée depuis au moins 24 heures.

Les préférences `desiredWeeklyFrequency` et `silenceThresholdDays` remplacent les valeurs par défaut
lorsqu’elles existent.

## Complétude du Brand Profile

Le score repose sur neuf champs bornés : site web, secteur, description, mission, valeurs, ton,
expressions favorites, produits/services et audiences. Chaque champ a le même poids. Les données
manquantes sont signalées, jamais inventées.

## Reproductibilité

Les collections sont triées avant construction, les arrondis sont limités à deux décimales et toutes
les dates sont sérialisées en ISO UTC. À données identiques et horloge identique, le snapshot est
strictement identique.

## Agrégats produits

- plateformes : contenus pertinents et publications récentes ;
- campagnes : volumes par campagne, y compris les contenus sans campagne ;
- objectifs : volumes par objectif, y compris les contenus non catégorisés ;
- workflow : volumes pour chaque valeur de `ContentStatus`, zéros inclus.
