# Contribuer à TelcoSkills

Merci de vouloir améliorer les parcours. Les contributions les plus utiles : corriger une erreur, signaler un lien mort,
proposer une ressource libre, compléter le landscape.

## Le plus simple : ouvrir un ticket

Sur chaque page de compétence du site, le lien « Proposer une correction sur GitHub » ouvre un ticket pré-rempli
(page et fichier concernés). Décrivez ce qui est faux ou ce qui manque, avec une source.

## Modifier le contenu directement

Tout le contenu est en JSON, validé à la construction du site :

| Quoi | Fichier |
|---|---|
| Un parcours (blocs, compétences, prérequis, ressources) | `content/roadmaps/<id>.json` |
| Le landscape des outils | `content/landscape.json` |
| La rubrique Sylva | `content/sylva.json` (la liste des composants se régénère : `node scripts/importer-units-sylva.mjs`) |

Règles de contenu, vérifiées par les tests quand c'est possible :
- **Toute affirmation a une source.** Pas de chiffre ni de fait sans lien vers sa source.
- **Chaque compétence a au moins une ressource libre ou open source, avec un lien.**
- **Pas de contenu inventé** : un bloc sans donnée ne s'affiche pas, on ne le remplit pas pour faire joli.
- **Une compétence partagée entre plusieurs parcours** garde le même titre et le même résumé partout.

## Vérifier avant de proposer

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
node scripts/verifier-rendu.mjs
```

Ensuite, ouvrez une pull request en décrivant le changement et ses sources.

## Licences

Code sous licence MIT ; contenu sous licence CC BY-SA 4.0 (voir `LICENSE-CONTENU.md`). En contribuant, vous acceptez que
votre contribution soit publiée sous ces licences.
