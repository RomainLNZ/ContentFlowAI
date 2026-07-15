# Beta Polish Foundations

Le Lot 1 établit les primitives visuelles partagées par l'application réelle et le futur Mode Démo.

## Principe de réutilisation

Les composants de `@flowpilot/ui` ne connaissent ni l'authentification, ni Prisma, ni les entités métier. Ils reçoivent du contenu, un état et des callbacks. Une campagne réelle et une campagne de démonstration utilisent donc le même composant ; seule la source du contrat de données change.

Les interactions restent portées par les écrans de fonctionnalité : le Mode Démo fournira les mêmes callbacks, connectés à un transport éphémère plutôt qu'aux routes de production.

## Primitives

- `Button`, `Input`, `Surface` : états focus, disabled, erreur et mouvement réduit harmonisés.
- `StatusBadge` : représentation sémantique indépendante des statuts métier.
- `Skeleton` et `SkeletonGroup` : chargements structurels avec annonce accessible unique.
- `EmptyState` : impose un constat, une explication, un bénéfice et des actions.
- `Dialog` et `ConfirmDialog` : focus piégé, fermeture par Échap ou backdrop, restauration du focus.
- `Drawer` : même comportement accessible pour les panneaux latéraux.
- `ToastProvider` et `useToast` : retours optimistes et erreurs contextualisées.

## Règles

1. Les pages ne doivent pas créer une variante spéciale pour la démo.
2. Aucun composant UI ne doit appeler directement une API.
3. Les libellés métier sont fournis par l'écran consommateur.
4. Les skeletons conservent la géométrie de l'écran final.
5. Un état vide explique pourquoi, quoi faire et le bénéfice attendu.
6. Toute animation respecte `prefers-reduced-motion` via les durées sémantiques.
7. Les overlays sont contrôlés par `open` et `onOpenChange`, ce qui permet les mêmes scénarios réels et simulés.

## Thèmes

Les variables `--fp-*` sont la source sémantique des primitives. Les modes clair et sombre changent les valeurs sans changer les composants. Les anciennes clés TypeScript `colors.background` et `colors.foreground` restent disponibles pendant la migration progressive.
