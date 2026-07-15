# Communication Director — API du Lot 4

## Services

- `DirectorAnalysisService` orchestre feature flag, verrou, snapshot, Director, persistance et état final.
- `DirectorRecommendationService` fournit overview, lecture, transitions, feedback et actions brouillon.
- `DirectorPreferenceService` gère les préférences workspace-scoped.
- `ContentCreationService` crée un `DRAFT` dans une transaction fournie par le service appelant.

`DirectorOrchestrator` reste sans accès Prisma.

## Authentification manuelle

Les exemples supposent un jeton Supabase valide et les en-têtes tenant utilisés par FlowPilot :

```bash
export API=http://localhost:3001/api/v1
export TOKEN="<access-token>"
export ORG="<organization-uuid>"
export WORKSPACE="<workspace-uuid>"
export AUTH="Authorization: Bearer $TOKEN"
```

Ajouter à chaque commande :

```text
-H "$AUTH" -H "x-organization-id: $ORG" -H "x-workspace-id: $WORKSPACE"
```

Le feature flag `communication_director` est désactivé par défaut. Pour une recette locale, créer une
override d’organisation avec Prisma côté serveur avant de lancer l’analyse. Aucun accès navigateur
direct à la base n’est nécessaire ou autorisé.

## Parcours curl

```bash
# Lancer l’analyse manuelle
curl -X POST "$API/director/analyses" <headers>

# Consulter overview et analyse
curl "$API/director/overview" <headers>
curl "$API/director/analyses/<analysis-id>" <headers>

# Filtrer les recommandations
curl "$API/director/recommendations?priority=HIGH&page=1&pageSize=20" <headers>
curl "$API/director/recommendations/<recommendation-id>" <headers>

# Qualifier une recommandation
curl -X POST "$API/director/recommendations/<id>/view" <headers>
curl -X POST "$API/director/recommendations/<id>/accept" <headers>
curl -X POST "$API/director/recommendations/<id>/dismiss" <headers-json> \
  -d '{"reason":"NOT_RELEVANT","comment":"Déjà traité hors FlowPilot"}'
curl -X POST "$API/director/recommendations/<id>/complete" <headers-json> \
  -d '{"confirmed":true}'
curl -X POST "$API/director/recommendations/<id>/feedback" <headers-json> \
  -d '{"value":"HELPFUL","reason":"ACTIONABLE"}'

# Préférences
curl "$API/director/preferences" <headers>
curl -X PUT "$API/director/preferences" <headers-json> -d '{
  "desiredWeeklyFrequency":3,
  "preferredWeekdays":[1,3,5],
  "preferredHours":["09:00"],
  "timezone":"Europe/Paris",
  "silenceThresholdDays":7,
  "maxDailyRecommendations":5,
  "notificationsEnabled":true,
  "proactivityLevel":2,
  "disabledRecommendationTypes":[]
}'

# Préparer sans créer
curl -X POST "$API/director/recommendations/<id>/prepare-draft" <headers>

# Créer volontairement un brouillon
curl -X POST "$API/director/recommendations/<id>/create-draft" <headers-json> -d '{
  "confirmed":true,
  "title":"Sujet validé par l’utilisateur",
  "body":"Corps saisi et confirmé par l’utilisateur.",
  "hashtags":[]
}'
```

`create-draft` exige simultanément `director.act` et `content.create`. Le contenu est toujours créé en
`DRAFT`, sans `SCHEDULED`, publication ou action externe. Un second appel retourne le brouillon déjà
lié.

## Idempotence

- l’index SQL refuse deux analyses `RUNNING` par tenant ; le service retourne l’analyse existante ;
- view, accept, dismiss et complete ne réécrivent pas un état déjà atteint ;
- le feedback est upsert par recommandation/utilisateur ;
- la création de brouillon verrouille la recommandation par mise à jour conditionnelle ;
- la clé tenant-scoped de recommandation empêche les doublons actifs.

Les audits ne contiennent que les identifiants, transitions et métadonnées utiles. Aucun snapshot ou
corps de contenu n’est journalisé.
