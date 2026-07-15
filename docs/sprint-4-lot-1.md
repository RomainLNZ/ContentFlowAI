# Sprint 4 — AI Communication Director — Lot 1

## Périmètre livré

Ce lot installe uniquement les fondations techniques du Communication Director. Il ne contient ni
agent métier, ni orchestration Director, ni route Director, ni interface.

## Persistance

- `DirectorAnalysis` trace une analyse et son contexte métier minimal.
- `DirectorRecommendation` stocke une recommandation explicable, actionnable et dédupliquée.
- `DirectorPreference` conserve les réglages de proactivité d’un workspace.
- `RecommendationFeedback` conserve un retour unique par utilisateur et recommandation.

Les quatre modèles sont isolés par `organizationId` et `workspaceId`. Les résumés et preuves JSON
ne doivent jamais contenir le corps complet d’un contenu ni une donnée sensible.

## Contrôle d’accès

Les permissions `director.read`, `director.run`, `director.manage`, `director.act` et
`director.configure` sont créées par le seed RBAC. Le feature flag `communication_director` est
désactivé par défaut.

## Fournisseur IA local

`selectAiProvider` choisit OpenAI lorsqu’une clé est configurée et `MockProvider` sinon. Le mock
implémente le même contrat `AiProvider`, produit des réponses déterministes et matérialise les
schémas JSON structurés afin que le produit et les tests fonctionnent sans `OPENAI_API_KEY`.

Le statut `/api/v1/ai/status` expose le fournisseur réellement sélectionné. L’absence de clé ne
rend donc plus le service IA indisponible.
