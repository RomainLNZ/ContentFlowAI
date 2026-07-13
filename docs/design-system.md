# Design System

`@flowpilot/ui` est la source unique des fondations visuelles et des composants partagés. Une valeur visuelle récurrente ne doit pas être redéfinie dans une feature.

## Fondations

- `tokens/index.ts` fournit les tokens typés utilisables en TypeScript et Framer Motion.
- `styles/index.css` expose les mêmes fondations sous forme de variables CSS `--fp-*`.
- Les couleurs couvrent fonds, textes, marque et états sémantiques.
- Les échelles couvrent typographie, espacement, rayons, ombres, durées et courbes d’animation.
- Les durées sont automatiquement réduites avec `prefers-reduced-motion`.

## Composants initiaux

- `Button` : variantes primaire, secondaire, ghost et danger.
- `Input` : champ accessible avec états focus et disabled natifs.
- `Badge` : états neutre, marque, succès et danger.
- `Surface` : conteneur premium avec glassmorphism léger.

Le frontend importe `@flowpilot/ui/styles.css`, puis les composants depuis `@flowpilot/ui`. Les composants restent sans logique métier et acceptent les attributs HTML natifs.

## Règles d’évolution

Un composant rejoint le package uniquement s’il est générique, documenté et utilisé ou destiné à être utilisé dans plusieurs features. Toute évolution doit conserver les attributs ARIA natifs, la navigation clavier et le mode reduced motion.
