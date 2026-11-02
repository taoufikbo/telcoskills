# AUDIT : parcours utilisateur et conversion

> **Correction du 2026-10-22.** Les mentions « le contenu principal est présent dans le HTML » pour les pages roadmap et projet (§1) étaient **fausses** : le contrôle comptait les données JSON embarquées, pas le HTML visible. Ces pages étaient rendues dans le navigateur. Voir `reports/rendu-serveur.md` ; corrigé sur la branche `correctif-rendu-serveur`.


Date : 2026-10-21. Méthode : lecture du dépôt, `next build` des deux instances, `next start` en local, requêtes HTTP sur chaque route (le contenu cherché est comparé au JSON source). Aucune modification de code. Lighthouse n'a pas été relancé : les scores ci-dessous sont ceux de `reports/final.md` (18/10, local).

## 0. Constat qui change le plan

Le brief décrit un site à refaire en rendu serveur. Le dépôt est **déjà en grande partie là**, mais sur une instance qui n'est pas en ligne.

- Un moteur, deux instances (`NEXT_PUBLIC_INSTANCE`, `src/lib/instance.ts`) :
  - **`interne`** (défaut) : le site actuellement en production sur `telcocloud-roadmaps.vercel.app`. `noindex`, routes `/<roadmap>?noeud=…`, accueil avec quiz.
  - **`public`** : site d'expertise « TelcoArchi » (nom de travail, « John Doe » comme auteur), commité (`2b7d562`), **jamais déployé**. Routes `/ressources/roadmaps/<roadmap>/<noeud>`, JSON-LD, sitemap, robots, offres, diagnostic, contact Calendly, frameworks, analyses.
- Conséquence : P0 « rendu serveur » est fait à ~80 % mais invisible du public ; les gros écarts avec votre brief sont ailleurs (home sans quiz sur `public`, provenance, rôles sans roadmap, mesure, rétention).
- Les URL « existantes » à ne pas casser sont celles de l'instance `interne`. Les 301 vers `/ressources/…` sont déjà écrites (`next.config.ts`).

**Décision nécessaire (voir §6)** : on part de `public` et on la déploie (recommandé), ou on rapatrie le travail sur le site en production.

## 1. Routes et mode de rendu

Tout est prérendu au build ; aucune page SSR ni ISR. L'interactivité est dans des composants client (liste en §3).

### Instance `interne` (production actuelle)
| Route | Rendu | HTTP | Contenu principal dans le HTML |
|---|---|---|---|
| `/` | SSG | 200 | oui (titre, quiz Q1 « Quel est votre métier », cartes) |
| `/<roadmap>` ×6 | SSG (`generateStaticParams`) | 200 | oui : 63/63 titres et 63/63 résumés de nœud (Ingénieur CaaS) |
| `/<roadmap>?noeud=x` | même page, tiroir client | 200 | non propre : mêmes 96 Ko que la roadmap, pas d'URL indexable par nœud |
| `/<roadmap>/opengraph-image` | SSG | 200 | image OG par roadmap |
| `/projets`, `/projets/coeur-5g-sur-caas`, `/…/carte` | SSG | 200 | oui : 9/9 phases dans le HTML |
| `/a-propos` | SSG | 200 | oui |
| `/contact`, `/offres`, `/diagnostic`, `/frameworks`, `/analyses`, `/ressources/*` | 404 volontaire | 404 | n/a |
| `/robots.txt`, `/sitemap.xml` | statique | 200 | `Disallow: /`, sitemap vide (noindex) |
| JSON-LD / canonical | **absents** | | |

### Instance `public` (non déployée)
| Route | Rendu | HTTP | Contenu / SEO |
|---|---|---|---|
| `/` | SSG | 200 | oui ; **pas de quiz** (h1 « Architecture de plateformes télécom : cloud, 5G et IA ») |
| `/ressources`, `/ressources/roadmaps` | SSG | 200 | oui |
| `/ressources/roadmaps/<roadmap>` ×6 | SSG | 200 | oui (63/63 nœuds) ; **pas de JSON-LD ni de canonical** |
| `/ressources/roadmaps/<roadmap>/<noeud>` ×293 | SSG | 200 | oui (résumé présent) ; JSON-LD `LearningResource` oui, canonical oui (163 canoniques) ; **pas de `BreadcrumbList`** |
| `/ressources/roadmaps/<roadmap>/opengraph-image` | SSG | 200 | oui |
| `/ressources/projet-fil-rouge`, `/…/carte` | SSG | 200 | oui (9/9 phases) ; pas de JSON-LD |
| `/a-propos`, `/contact` | SSG | 200 | indexables |
| `/offres`, `/diagnostic`, `/frameworks`, `/frameworks/<x>` ×5, `/analyses`, `/newsletter`, `/mentions-legales`, `/confidentialite` | SSG | 200 | `noindex` tant que non rédigés (placeholders `<Draft>`) |
| Anciennes URL `/<roadmap>`, `/projets…` | redirections 301 | 200 après suivi | OK |
| `/robots.txt`, `/sitemap.xml` | statique | 200 | sitemap : 293 compétences (canoniques) + pages |
| **`/expertise`, page auteur dédiée, `/nouveautes`, `/role/<x>`** | n'existent pas | | |

## 2. Sources de données

Tout est en fichiers, validé par Zod au build, sans base ni API.

- `content/roadmaps/*.json` (6 roadmaps ; 36 à 63 nœuds ; 293 nœuds au total, 85 partagés) ; champ `source` (texte libre), `demande` (vide partout), `version`.
- `content/projets/coeur-5g-sur-caas.json` : 9 phases, 11 rôles dont 6 relient une roadmap ; **5 rôles sans roadmap : `chef-projet`, `securite`, `reseau`, `editeur`, `juridique`**.
- `content/orientation.json` : quiz 3 questions (métier ×6, niveau télécom ×3, objectif ×5) → 6 roadmaps, avec « premier nœud par niveau ».
- `content/ressources/apprentissage.json` (102 cursus), `frameworks.json`, `diagnostic.json` (brouillon), `analyses/*.mdx`.
- Progression : `localStorage`, clé `tcr:progression:<roadmapId>` (`{roadmap, statuts}`), orientation `tcr:orientation`. Export/import JSON existant (`progression.ts`).

**Provenance réelle des roadmaps** (champ `source`) : seule *Ingénieur CaaS telco* vient d'une synthèse « d'environ 14 offres » ; les 5 autres sont des rédactions éditoriales (sources publiques, 3GPP/ETSI, open source). La promesse « construites à partir d'offres d'emploi » (`instance.ts:39`, `opengraph-image.tsx:9`, `AccueilInterne`) est donc **fausse pour 5 parcours sur 6**. Le champ `demande` est vide partout.

## 3. Composants clés

- Pages : `src/app/ressources/roadmaps/[roadmap]/[noeud]/page.tsx` (noeud, JSON-LD, canonical), `[roadmap]/page.tsx`, `projet-fil-rouge/page.tsx`, `AccueilRefonte.tsx` / `AccueilInterne.tsx` (choix par import conditionnel sur la variable d'environnement).
- Îlots client (`"use client"`) : `RoadmapView` (arbre, métro, objectif, chemin), `GrapheRoadmap`, `CarteMetro`, `VueObjectif`, `TiroirNoeud`, `PanneauProgression`, `ProjetView`, `ChaineProjet`, `carte/*`, `Orientation` (quiz), `Diagnostic`, `RecherchePalette`, `ListeMobile`. **Limite** : `RoadmapView` et `ProjetView` sont des client components monolithiques qui reçoivent tout le JSON : le HTML est bien rendu, mais le coût JS est élevé (projet : 390 Ko de HTML, carte : 437 Ko).
- Lib : `urls.ts` (toute adresse passe par là), `noeuds.ts` (roadmap de référence), `orientation.ts`, `progression.ts`, `analytics.ts` (5 événements, Vercel).

## 4. Écarts avec le brief, chantier par chantier

| Chantier | État réel |
|---|---|
| P0 rendu serveur | Fait sur `public` (HTML, `generateStaticParams`, URL par compétence, OG par roadmap, sitemap, robots). **Manque** : `BreadcrumbList`, JSON-LD sur roadmap et projet, canonical/OG propre sur les pages roadmap et projet, OG par nœud, **déploiement**. |
| P0 honnêteté | Rien. Texte faux à corriger à 3 endroits ; aucun badge de provenance. Une seule roadmap a une vraie base « offres ». |
| P1 home | `public` : pas de quiz ni de résultat sur la home. `interne` : quiz présent, mais avec grille de chiffres, bandeau de sources et chaîne de 10 étapes avant/autour. |
| P1 zéro impasse | Le quiz ne couvre que les 6 métiers à roadmap. 5 rôles du projet sans roadmap ni page. Résultat sans durée ; pas de lien partageable `?profil=`. |
| P1 page roadmap | Progression et prérequis présents ; pas de bloc « Commencer ici », pas d'état vide guidé. |
| P1 consulting | `/offres` et `/contact` existent en gabarit, `noindex`, avec Calendly et auteur à fournir. **Pas de `/expertise`**, pas de formulaire, pas de CTA contextuels. |
| P2 rétention | Export JSON seulement. Pas de lien d'état, de « Nouveautés », d'alerte email. |
| P2 qualité | Lighthouse local 96/100/100/100 (à refaire déployé, avec LCP). Vue métro : liste mobile existante (`ListeMobile`), à vérifier au clavier. |
| P2 mesure | Vercel Analytics prévu, **inactif tant que `NEXT_PUBLIC_ANALYTICS=vercel` et le projet ne sont pas configurés**. Événements existants : `cta_clic`, `abonnement`, `contact_clic`, `diagnostic_termine`, `export_progression` ; **les 5 de votre brief n'existent pas**. |

## 5. Dette technique

1. **Deux instances dans un moteur** : chaque lien passe par `urls.ts`, chaque page par `exigerRefonte/exigerAncienSite`, accueils par import conditionnel. Coût de maintenance réel ; à supprimer dès que `interne` est retiré.
2. **Rien n'est déployé ni sauvegardé à distance** : pas de remote Git (proxy 407), déploiement manuel, CI GitHub écrite mais jamais exécutée. Un « une PR par chantier » est impossible sans dépôt distant.
3. **Production en retard** : le site en ligne date de `832c933` ; ni projet fil rouge à jour, ni quiz, ni roadmap IA, ni refonte n'y sont.
4. **Progression par roadmap** alors que 85 compétences sont partagées : un nœud acquis dans une roadmap ne l'est pas dans l'autre.
5. **Composants client monolithiques** (RoadmapView 157 l., ProjetView 357 l., VueObjectif 413 l.) et pages projet de 390–437 Ko de HTML.
6. **Textes divergents** entre copies d'un nœud partagé (6 nœuds), canonical vers une page de contenu différent.
7. **`demande` vide**, 22 ressources sans lien masquées, 5 liens à vérifier à la main, contenu non relu par un expert.
8. **Vidéos** : prononciation toujours ouverte, pas de vidéo pour la roadmap IA ; les vidéos ne sont pas publiées sur `public`.
9. **Poste contraint** : `.cmd` bloqués, Git sans remote, Vercel Hobby exige un commit signé du propriétaire.
10. **Mesures obsolètes** : Lighthouse local, pas de LCP 4G, pas d'axe clavier/WCAG 2.2 testé automatiquement au-delà des contrastes.

## 6. Questions à trancher avant tout code

1. **Base de travail** : partir de l'instance `public` et la mettre en ligne sur un second projet Vercel (ce que prévoit `final.md`), puis rediriger l'ancien domaine ? Ou faire évoluer l'instance `interne` actuelle ?
2. **Dépôt distant** : sans remote, « une PR par chantier » devient « un commit/branche local par chantier avec le rapport associé ». Vous pouvez créer un dépôt GitHub depuis un poste hors proxy et me donner l'accès, ou on reste en branches locales.
3. **Marque** : « TelcoArchi » et « John Doe » sont des noms de travail. Fournir le nom affiché, la bio, l'email, le lien Calendly (`[À_FOURNIR]`) ; sinon les pages concernées restent en brouillon.
4. **Rôles sans roadmap** : pour `chef-projet`, `securite`, `reseau`, `editeur`, `juridique`, la page « rôle » est construite uniquement à partir du projet fil rouge existant (activités par phase, compétences liées). OK ?
5. **Durée estimée du quiz** : aucune donnée de durée n'existe dans le contenu. Je la calcule à partir de champs à ajouter au JSON (heures par nœud, `[À_FOURNIR]`) ou je donne seulement le nombre de nœuds ?
6. **Formulaire et alertes email** : nécessitent un service tiers (Formspree, Resend…). Choix à justifier par écrit, comme demandé.

## 7. Plan proposé (après validation)

Ordre de votre brief ; chaque étape = une branche/commit + rapport (avant/après, Lighthouse, critères cochés).

0. **Mise en ligne de `public`** (prérequis, hors liste) : second projet Vercel, variables, redirections, vérification curl en production. Sans cela, aucun chantier n'est mesurable.
1. **P0 rendu** : compléter le manque réel (BreadcrumbList, JSON-LD roadmap/projet, canonical/OG partout, OG par nœud), pas de refonte du rendu. Alléger `RoadmapView`/`ProjetView` en isolant les îlots.
2. **P0 honnêteté** : corriger les 3 textes ; ajouter `provenance` au schéma de roadmap (`offres: {n, date}` ou `editoriale`) ; badge en tête de roadmap. Seule Ingénieur CaaS peut afficher « n offres · date » : n = environ 14 d'après `source`, **date à fournir**.
3. **P1 home** : promesse → bouton unique → quiz → résultat → grille → projet → preuves → auteur ; retrait des chiffres de volume.
4. **P1 zéro impasse** : quiz élargi, pages `/role/<id>`, résultat avec premier nœud et lien `?profil=`.
5. **P1 page roadmap** : « Commencer ici », état vide, prérequis cliquables.
6. **P1 consulting** : `/expertise`, page auteur, CTA contextuels, formulaire minimal.
7. **P2** : lien d'état de progression, « Nouveautés », alerte email ; qualité (Lighthouse déployé, WCAG 2.2, 360 px) ; mesure (5 événements + entonnoir documenté).

**Rien n'est inventé** : cas clients, bio, nom, email, date des offres et durées restent `[À_FOURNIR]`.
