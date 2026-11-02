# TelcoCloud Roadmaps

Roadmaps de compétences pour le cloud télécom, sur le modèle de roadmap.sh : un graphe de nœuds avec prérequis,
niveaux, indicateur de demande, ressources et suivi de progression. Interface en français.

Stack : Next.js (App Router), TypeScript, Tailwind, React Flow (`@xyflow/react`), dagre (placement des nœuds),
Zod (validation du contenu), Vitest. Aucun backend : la progression est stockée dans le `localStorage` du navigateur.

## Lancer en local

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev      # http://localhost:3000
```

Autres commandes :

```bash
npm test         # tests Vitest (règles de validation, graphe, progression, recherche)
npm run lint
npm run build    # valide tout le contenu puis construit le site
npm start        # sert la version construite
```

## Thème

L’instance interne utilise une charte orange : `#ff7900` pour l’action principale avec texte noir, noir sur blanc, bordures franches, coins carrés, Helvetica Neue ; le mode sombre utilise le fond `#141414`. Les couleurs et les arrondis sont déclarés une seule fois dans `src/app/globals.css` (bloc `@theme`) ; les couleurs de niveau, de demande et de statut sont dans `src/lib/styles.ts`.

## Ressources d’apprentissage

Chaque nœud peut proposer des **cursus**, des **playlists vidéo** et des **documents officiels**, en plus de sa référence ouverte. Elles sont dans `content/ressources/apprentissage.json`, rattachées aux nœuds **par identifiant** (un même cursus peut servir plusieurs nœuds, dans plusieurs roadmaps) et fusionnées au chargement :

```json
{ "noeuds": ["k8s-archi"], "type": "video", "nom": "…", "url": "https://…",
  "acces": "gratuit", "langue": "fr", "auteur": "…" }
```

- `type` : `cours`, `video` (playlist) ou `doc` (page officielle) ; `acces` : `gratuit`, `freemium` (accès libre, certificat ou suite payants) ou `payant` ; `langue` : `fr` ou `en`.
- **Règle éditoriale :** le gratuit d’abord, le français avant l’anglais ; une formation **payante** n’est ajoutée que s’il n’existe pas d’équivalent gratuit de même niveau. Le panneau d’un nœud trie en ce sens et affiche des étiquettes Gratuit / Payant / FR / EN.
- Le build échoue si un identifiant de nœud n’existe nulle part ou si un lien est en double.
- `node scripts/verifier-liens.mjs` contrôle tous les liens du contenu (les playlists YouTube via oEmbed) : code de sortie 1 si un lien est cassé ; les sites qui bloquent les robots (EUR-Lex, Légifrance, Udemy…) sont listés à vérifier à la main. À relancer avant chaque publication.

## Vues d’une roadmap

- **Arbre** (écran large) ou **Liste** (mobile) : tous les blocs, avec le filtre « chemin conseillé » quand la roadmap a un indicateur de demande.
- **Métro** (écran large) : un plan façon carte de métro. Chaque bloc est une ligne colorée, chaque compétence une station, placée de gauche à droite selon sa profondeur de prérequis ; une correspondance (double anneau) signale un prérequis dans une autre ligne. Cliquer une station trace ses prérequis et dépendants en pointillés bleus.
- **Objectif** : choisissez une compétence à atteindre ; seuls ses prérequis restent affichés, en couches de gauche à droite façon PERT. Chaque nœud est acquis, disponible (prérequis acquis ou ignorés) ou verrouillé, et le chemin critique (la plus longue chaîne d’étapes restantes) est surligné. L’état vit dans l’URL (`?vue=objectif&cible=<id>`), donc partageable.

## Vidéos de présentation

Chaque roadmap peut avoir une vidéo explicative dans `public/videos/<id>.mp4` (avec `.vtt` pour les sous-titres, `.jpg` pour l’affiche et `.json` pour la durée et la mention de la voix) ; la page l’affiche automatiquement dans un lecteur replié. Les vidéos sont **générées à partir du JSON** (titre, champ `presentation`, blocs, nœuds, projets) : diaporama dans la charte de l'instance interne capturé par Chrome, commentaire lu par la voix neuronale [Piper](https://github.com/OHF-Voice/piper1-gpl) (modèle français `fr_FR-siwis`), assemblage ffmpeg. Tout se fait en local, sans service externe. Elles restent donc à jour avec le contenu : après une modification du JSON, relancez la génération.

```bash
pip install piper-tts imageio-ffmpeg         # une fois ; Google Chrome requis (variable CHROME si besoin)
python scripts/videos/generer_videos.py      # toutes les roadmaps (le modèle de voix, ~60 Mo, est téléchargé au premier lancement)
python scripts/videos/generer_videos.py sre-exploitation-telco   # une seule
```

**Prononciation :** la voix lit les sigles et les anglicismes à la française grâce à un lexique, `scripts/videos/prononciations.json` (par exemple VPN → « vé pé èn », CaaS → « kasse », packaging → « pakadjine »). Les sigles absents du lexique sont épelés lettre par lettre ; les sous-titres gardent l’orthographe d’origine. Pour corriger un mot mal prononcé, ajoutez-le au lexique (en écrivant comme il se prononce) puis relancez la génération. Tests : `python -m unittest discover -s scripts/videos`.

Les vidéos pèsent 3 Mo environ chacune. La voix `fr_FR-siwis` est issue du jeu de données SIWIS (Université d’Édimbourg), sous licence **CC BY 4.0** : la mention d’attribution est affichée sous le lecteur et sur la dernière diapositive, il faut la conserver.
## Projets et carte interactive

Un projet (`content/projets/*.json`) déroule un déploiement de bout en bout : phases, jalons go/no-go, activités, rôles et compétences. Chaque compétence renvoie à un nœud d’une roadmap et le build échoue si un renvoi est faux. La page `/projets/<id>` le présente phase par phase ; `/projets/<id>/carte` est une **carte interactive** qui met en relation rôles, phases, jalons et compétences, avec une seule sélection partagée par quatre vues :

- **Graphe** (vue par défaut) : un vrai graphe à explorer, sur le modèle d’une **perspective** (une vue métier d’un même graphe, comme dans Neo4j Bloom). Cinq catégories de nœuds (rôle, phase, jalon, activité, compétence) reliées par des relations nommées (*participe à*, *dans la phase*, *se termine par*, *précède*, *mobilise*). Chaque rôle est une perspective : la scène de départ montre la frise des phases et des jalons, le rôle et ses activités ; sa progression colore les compétences. On explore comme dans Bloom : recherche (nœuds et **phrases** prêtes comme « Pour franchir le jalon 3 » ou « Mes compétences à acquérir »), développement des voisins (bouton « +n », double-clic ou touche +), retrait d’un nœud, légende qui filtre par catégorie, déplacement des nœuds. Le placement est déterministe (jalons en haut, phases dessous, activités sous leur phase, compétences en bas) plutôt qu’une simulation de forces, pour rester lisible ;
- **Couloirs** : rôles en lignes, phases en colonnes, jalons en losanges sur la ligne du temps ;
- **Flux** : diagramme de flux rôles → phases → domaines de compétences (la largeur d’une bande est l’effort) ;
- **Matrice** : compétences par domaine × phases, colorée selon la progression du profil choisi.

Cliquer un rôle, une phase, un jalon, une activité ou une compétence éclaire tout ce qui s’y rattache et estompe le reste ; un jalon est cumulatif (il éclaire tout ce qu’il faut avoir couvert pour le franchir). Le panneau de détail donne la phase d’entrée d’une compétence, ses rôles, ses cursus pour apprendre et la préparation du profil. Vue, profil et sélection sont dans l’adresse (`?vue=flux&role=sre&sel=competence:amf`), donc partageables. La logique de corrélation est dans `src/lib/carte.ts`, le modèle de graphe, les perspectives et le placement dans `src/lib/graphe.ts`, le diagramme de flux dans `src/lib/sankey.ts`, tous testés ; aucune bibliothèque de visualisation n’est ajoutée.

## Roadmap IA

`content/roadmaps/ia-agentique-telco.json` couvre l'inférence, les GPU, les agents (MCP, A2A), le RAG, le LLMOps, la sécurité/conformité IA (AI Act, ANSSI) et les cas d'usage réseau, à partir de projets open source. Pas encore de vidéo de présentation.

## Assistant « Par où commencer ? »

La page d'accueil pose trois questions (métier, expérience télécom, objectif) et recommande un parcours et un premier nœud. Tout est dans `content/orientation.json` :

- `ordre` : ordre d'affichage des parcours, du plus accessible au plus spécialisé (départage aussi les ex æquo) ;
- `questions` : chaque option donne des `poids` aux roadmaps et une `raison` affichée à l'utilisateur ;
- `premiers_noeuds` : nœud de départ par parcours et par niveau en télécom (`aucune`, `notions`, `aise`).

Le build échoue si une roadmap, un nœud ou un projet cité n'existe pas, ou si une roadmap n'est pas listée. Les réponses sont gardées dans le navigateur (clé `tcr:orientation`). Ajouter une roadmap suppose donc de la déclarer dans ce fichier.

## Ajouter une roadmap

Tout le contenu vit dans `content/roadmaps/*.json`. Aucun texte de roadmap n'est écrit dans les composants.

1. Copiez `content/roadmaps/ingenieur-caas-telco.json` vers `content/roadmaps/<mon-id>.json`.
2. Adaptez-le en respectant le schéma (`src/lib/schema.ts`) :

   | Champ | Valeurs |
   | --- | --- |
   | `id` | kebab-case, identique à l'URL, unique parmi les roadmaps |
   | `type` | `role` ou `competence` |
   | `legende_demande` | une phrase pour chacune de `forte`, `moyenne`, `faible` |
   | `blocs` | liste ordonnée : un bloc par étape du tronc de l'arbre |
   | nœud `niveau` | `fondamental`, `intermediaire`, `avance`, `transverse` |
   | nœud `demande` | `forte`, `moyenne`, `faible`, ou absent si non évaluée |
   | nœud `prerequis` | ids d'autres nœuds de la même roadmap |
   | ressource `type` | `cours`, `video`, `opensource`, `libre`, `doc`, `certif`, `spec`, `livre`, `modele`, `retour-experience` ; `url`, `acces`, `langue`, `auteur` optionnels |
   | références ouvertes | chaque nœud doit avoir au moins une ressource `opensource` (projet ou documentation d'un projet libre) ou `libre` (texte officiel en accès libre), avec `url` : un test le vérifie |
   | nœud `projet` | optionnel : un projet pratique |

3. Lancez `npm test` ou `npm run build`. Le chargement **échoue** avec un message explicite si :
   - un prérequis référence un id inexistant ;
   - deux nœuds ont le même id ;
   - le graphe de prérequis contient un cycle (le chemin du cycle est affiché) ;
   - un nœud utilise un bloc non déclaré dans `blocs`.
4. La roadmap apparaît d'elle-même sur l'accueil, dans la recherche (⌘K) et à l'adresse `/<mon-id>`.

La demande est un **ordre de grandeur** tiré d'un échantillon d'offres, pas une statistique : indiquez dans `source`
l'échantillon utilisé et sa date.

## Contribuer

- Une modification de contenu ou de code = une branche et une pull request.
- Avant de pousser : `npm run lint`, `npm test` et `npm run build` doivent passer.
- Commits petits et explicites, en français.
- Ajoutez une dépendance seulement si elle est justifiée en une ligne dans la PR.
- Une règle de validation ou de calcul nouvelle doit venir avec un test.

## Déploiement (Vercel)

Importez le dépôt dans Vercel : aucune configuration n'est nécessaire. Pour des liens de partage (Open Graph)
sur un domaine personnalisé, définissez `NEXT_PUBLIC_SITE_URL` (par exemple `https://roadmaps.exemple.fr`).

## Structure

```
content/roadmaps/*.json     contenu (une roadmap par fichier)
src/lib/schema.ts           schéma Zod et contrôles du graphe
src/lib/roadmaps.ts         chargement et validation (appelés au build)
src/lib/layout.ts           placement des nœuds (dagre)
src/lib/progression.ts      statuts, statistiques, import/export
src/lib/chemin.ts           « chemin conseillé »
src/lib/apprentissage.ts    catalogue de cursus et playlists, fusionné dans les nœuds
src/lib/objectif.ts         mode Objectif : sous-graphe, états, chemin critique
src/lib/metro.ts            plan de métro : lignes, stations, correspondances
src/lib/carte.ts            carte de projet : sélection liée rôles / phases / jalons / compétences
src/lib/sankey.ts           placement du diagramme de flux
src/lib/graphe.ts           graphe du projet : perspectives, recherche par phrases, expansion, placement
scripts/videos/             génération des vidéos de présentation
scripts/verifier-liens.mjs  contrôle des liens du contenu
public/videos/              vidéos, sous-titres, affiches
src/app/                    pages : accueil, /[slug], /a-propos
src/components/             graphe, liste mobile, tiroir, progression, recherche
```
