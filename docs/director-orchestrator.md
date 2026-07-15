# DirectorOrchestrator

`DirectorOrchestrator` est le Director unique du Sprint 4. Il reçoit exclusivement un
`WorkspaceIntelligenceSnapshot` et retourne une liste structurée de recommandations. Il ne connaît
pas Prisma, ne charge aucune donnée, ne crée aucun contenu et ne déclenche aucune mutation métier.

## Entrée et sortie

L’entrée contient uniquement les faits déterministes de Workspace Intelligence et le contexte de
marque borné. La sortie est validée par Zod et contient pour chaque recommandation :

- nature `RISK`, `OPPORTUNITY` ou `ACTION` ;
- type, priorité et confiance ;
- titre, résumé et justification ;
- faits et métriques utilisés comme preuves ;
- action suggérée non exécutée ;
- références facultatives vers une campagne, un contenu bloqué ou un objectif ;
- dates de suggestion et d’expiration ;
- clé de déduplication construite par le serveur.

Le résultat expose également les volumes par priorité ainsi que les vues filtrées `risks` et
`opportunities`.

## Garde-fous

- JSON et structure strictement validés ;
- maximum de vingt recommandations ;
- références campagne, contenu et objectif obligatoirement présentes dans le snapshot ;
- rejet des termes interdits du Brand Profile ;
- déduplication déterministe ;
- tri stable `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` ;
- aucun fait extérieur au snapshot n’est autorisé.

## Fournisseurs

`createDirectorOrchestrator` sélectionne OpenAI uniquement lorsqu’une clé est fournie. Sans clé,
`MockProvider` produit des recommandations françaises réalistes et déterministes à partir de la
cadence, des silences, de la couverture des campagnes, des objectifs, du workflow et de la
complétude de marque.

Le mock n’invente pas de contenu éditorial. Il suggère uniquement des actions comme examiner une
campagne, compléter le Brand Profile, débloquer un workflow ou ouvrir le calendrier.

## Persistance

`DirectorRecommendationPersistenceService` est séparé de l’orchestrateur. Il vérifie que
`DirectorAnalysis` appartient au couple `organizationId`/`workspaceId`, puis effectue des upserts
tenant-scoped dans `DirectorRecommendation`. Une recommandation déjà acceptée ou rejetée conserve
son statut puisque la mise à jour ne réinitialise pas le cycle de vie.

Cette persistance n’est exposée par aucune route publique dans ce lot.
