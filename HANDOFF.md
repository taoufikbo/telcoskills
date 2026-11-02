# Passation : TelcoCloud Roadmaps

État au 2026-10-18. Production : https://telcocloud-roadmaps.vercel.app (instance `interne`, déployée depuis le commit `832c933`). Le site d'expertise (instance `public`) est **codé, testé et commité, mais pas déployé** : voir `reports/final.md`.

## Ce que c'est

Site en français, façon roadmap.sh, des compétences cloud télécom : six parcours par métier, un projet fil rouge (« Déployer un cœur 5G sur un CaaS : du design à la mise en production ») avec carte interactive, un assistant « Par où commencer ? ». Next.js (App Router), TypeScript, Tailwind v4, deux thèmes (interne et public). Le contenu est en JSON, validé au build (Zod). La progression de l'utilisateur est dans le navigateur (localStorage). Pas de base de données, pas de compte.

## Deux instances, un moteur

`NEXT_PUBLIC_INSTANCE` (lue au build, voir `src/lib/instance.ts`) choisit le site :

| | `interne` (défaut) | `public` |
|---|---|---|
| Rôle | MVP interne, charte orange (#ff7900), `noindex` | Site d'expertise de conseil (nom de travail « TelcoArchi ») |
| Routes | `/<roadmap>`, `/projets/…` | `/ressources/…`, `/analyses`, `/frameworks`, `/offres`, `/diagnostic`, `/contact`, … |
| Thème | `globals.css` | `theme-public.css` (jetons clair/sombre, contrastes testés par `palette.test.ts`) |

Les routes d'une instance répondent 404 dans l'autre ; `next.config.ts` redirige (301) les anciennes adresses vers les nouvelles sur `public`. Toute adresse de lien passe par `src/lib/urls.ts`. Contexte, décisions et plan : `reports/plan.md` ; livraison, mesures, placeholders à écrire : `reports/final.md`.

Nouveaux contenus du site public : `content/frameworks.json`, `content/diagnostic.json` (brouillon à relire), `content/analyses/*.mdx`. Le texte que l'auteur doit écrire est marqué `<Draft>` (visible en dev ou avec `NEXT_PUBLIC_SHOW_DRAFTS=1`, masqué en production).

## Contenu : où modifier quoi

| Quoi | Fichier |
|---|---|
| Un parcours (blocs, compétences, prérequis, ressources) | `content/roadmaps/<id>.json` |
| Cursus, playlists, formations rattachés aux compétences (par id de nœud, partagé entre parcours) | `content/ressources/apprentissage.json` |
| Projet fil rouge (rôles, phases, activités, jalons) | `content/projets/coeur-5g-sur-caas.json` |
| Assistant d'orientation (questions, poids, premiers nœuds) | `content/orientation.json` |
| Prononciation des vidéos | `scripts/videos/prononciations.json` |
| Frameworks de l'auteur (site public) | `content/frameworks.json` |
| Diagnostic d'équipe (site public, brouillon) | `content/diagnostic.json` |
| Analyses (site public, MDX) | `content/analyses/*.mdx` |
| Identité, auteur, Calendly, newsletter (site public) | `src/lib/instance.ts` |

Parcours actuels (ordre d'affichage) : `devops-integrateur-nf`, `sre-exploitation-telco`, `ingenieur-caas-telco`, `integrateur-nf-5gc`, `architecte-caas-telco`, `ia-agentique-telco`.

Règles vérifiées au build ou par les tests (le build échoue sinon) : prérequis existants et sans cycle, blocs déclarés, chaque nœud a au moins une référence `opensource` ou `libre` avec lien, toute roadmap est listée dans `orientation.json` (avec un premier nœud par niveau télécom) et atteignable par l'assistant, toute compétence citée par le projet existe.

**Ajouter une roadmap** : créer le JSON, la déclarer dans `orientation.json` (`ordre`, `premiers_noeuds`, poids dans au moins une option), et au besoin lui donner un rôle dans le projet.

## Lancer, vérifier, déployer

Sur un poste où les lanceurs `npm`/`.cmd` sont bloqués, tout passe par `node node_modules/...`.

```bash
cd telcocloud-skills-public
node node_modules/next/dist/bin/next dev -p 3000                  # local
node node_modules/eslint/bin/eslint.js .                          # lint
node node_modules/typescript/bin/tsc --noEmit                     # types
node node_modules/vitest/vitest.mjs run                           # 124 tests
node node_modules/next/dist/bin/next build                        # build
node scripts/verifier-liens.mjs --sans-youtube                    # liens
node scripts/audit-content.ts --employeur=<Nom>                   # audit du contenu → reports/content-audit.md
NEXT_PUBLIC_INSTANCE=public node node_modules/next/dist/bin/next build   # site public
node scripts/verifier-rendu.mjs                                   # après le build public : le texte des compétences est dans le HTML
# production : déploiement automatique à chaque push sur main (commit signé par le propriétaire du compte Vercel)
```

- Arrêter `next dev`/`next start` avant un `build`.
- Le déploiement part du dossier local (pas de dépôt distant). Il a échoué une fois avec « Not authorized » puis réussi au second essai sans changement : relancer.
- Projet Vercel : `telcocloud-roadmaps`, équipe `limada` (voir `.vercel/project.json`).
- `AGENTS.md` prévient que cette version de Next a des changements incompatibles : lire `node_modules/next/dist/docs/` avant de toucher aux API Next.
- Git : local uniquement, aucun remote. Le dernier commit est `459fa10`. Ce fichier n'est pas commité.

## Ce qui est en place (par ordre d'ajout récent)

- Accueil : titre, grille de chiffres clés, bandeau de sources, assistant en 3 questions (réponses gardées dans `localStorage`, clé `tcr:orientation`), cartes des parcours, trois vues illustrées par des captures (`public/captures/*.png`), bandeau projet, appel à l'action final.
- Roadmap IA (38 compétences, sources open source), rôle « Ingénieur IA » dans le projet (7 activités sur 7 phases).
- Carte interactive du projet : vues Graphe (colonnes par perspective de rôle), Couloirs, Flux (Sankey), Matrice. Une version « graphe à forces » a été annulée à la demande de l'utilisateur (commit `504be88`) : ne pas la remettre.
- Vues d'une roadmap : Arbre, Métro, Objectif (chemin critique), Chemin conseillé.

## Points ouverts

1. **Prononciation des vidéos (anomalie volontairement laissée ouverte).** Acronymes (VPN, CaaS…) et anglicismes encore mal prononcés malgré le lexique. L'utilisateur la traitera plus tard. Voix : Piper `fr_FR-siwis-medium` (CC BY 4.0, attribution affichée). Pipeline : `scripts/videos/generer_videos.py` (Python 3.14, piper-tts, imageio-ffmpeg, Chrome headless).
2. **Pas de vidéo pour la roadmap IA.** L'accueil annonce « 5 vidéos de présentation » pour 6 parcours.
3. **Captures de l'accueil figées** : à refaire si les vues Métro, Objectif ou Flux changent (prises sur la version de production, 1300×700). Elles sont petites, le texte n'y est pas lisible.
4. **Liens à vérifier à la main** (le site bloque les robots) : TM Forum, Légifrance, Linux Journey, Udemy CKA, ISO 27001.
5. **Contenu non relu par un expert du domaine.** Les roadmaps sont rédigées à partir de sources publiques, sans analyse d'offres d'emploi ; le champ `demande` est vide. Le domaine IA bouge vite (llm-d, A2A) : revérifier l'état des projets.
6. **Dépôt GitHub + déploiement automatique** : en place (dépôt privé taoufikbo/telcocloud-skills-public, projet Vercel telcocloud-roadmaps-v4, domaine telcoskills.com). Les commits doivent être signés par le propriétaire du compte (voir « Pièges rencontrés »).
7. **Mode sombre** : non contrôlé à l'œil sur les dernières pages (accueil refait, roadmap IA).
8. **Vidéo « tour du propriétaire » de l'accueil (reportée le 2026-11-02).** Format visé : 45 à 60 s, pour LinkedIn, les e-mails ou « À propos », pas sur l'accueil. Essai de voix open source Chatterbox multilingue (Resemble AI, licence MIT, français, filigrane audio) : jugé insuffisant. Pistes : la voix de l'auteur, enregistrée ou imitée à partir d'un extrait de 20 s, ou une voix commerciale. Notes techniques : générer phrase par phrase (en un bloc, la fin est coupée) ; environ 1 min de calcul pour 15 s d'audio sans carte graphique ; domaines réseau nécessaires dans l'environnement cloud : huggingface.co, cas-server.xethub.hf.co, us.aws.cdn.hf.co ; le paquet `resemble-perth` exige `setuptools<81`. À faire après avoir fixé l'auteur et la phrase chiffrée de l'accueil.
9. **Inscription aux mises à jour** : encart prêt (produit src/produits/inscription, essai sur /labo/inscription) ; il apparaît après le choix d'un parcours ou à la 3e page, ne revient pas avant 30 jours après « Plus tard », plus jamais après une inscription. Reste à faire par l'auteur : créer le formulaire chez le service d'envoi (Brevo : formulaire d'inscription, champ EMAIL ; Buttondown : champ email), puis renseigner `inscription: { action, champEmail }` dans src/lib/instance.ts et compléter la page Confidentialité (service, finalité, durée, droits).
10. **Dépôt public** : https://github.com/taoufikbo/telcoskills (créé le 2026-11-02, historique neuf : un seul commit de départ). Licences MIT (code) et CC BY-SA 4.0 (contenu), CONTRIBUTING.md, aucun secret ni mention de l'employeur. Reste à faire : relier le projet Vercel à ce dépôt (Settings → Git), activer Secret scanning et Push protection, puis travailler dans ce dépôt (l'ancien, privé, sert d'archive).
11. **Comptes clients (SSO Google) et sauvegarde de la progression** : chiffré à environ 20 à 50 $ par mois au démarrage (dont le plan Vercel Pro, requis pour un usage commercial) et 3 à 5 jours de développement. Différé : « aucun compte » reste un argument du site.
12. **Auteur** : « Taoufik Bouazza » affiché sur À propos (fictif: false). Bio courte et LinkedIn à fournir dans src/lib/instance.ts.
13. **Versions anglaise et arabe (backlog, chantier lourd).** À découper en étapes :
    - **Adresses par langue** : `/fr`, `/en`, `/ar` (segment `[langue]` de l'App Router ; lire le guide i18n de cette version de Next dans node_modules/next/dist/docs avant de coder), redirection selon la langue du navigateur, `hreflang` et plan du site par langue, liens canoniques par langue.
    - **Interface** : sortir tous les textes des composants dans des dictionnaires (fr, en, ar) ; aujourd'hui ils sont écrits en dur, en français.
    - **Contenu** : environ 177 compétences, 6 parcours, le parcours Sylva, le landscape et les pages de rubrique. Une compétence partagée doit garder la même traduction partout (comme aujourd'hui en français). Traduction assistée possible, mais relecture par un humain du domaine pour l'anglais et l'arabe technique (beaucoup de termes restent en anglais en arabe).
    - **Arabe = écriture de droite à gauche** : `dir="rtl"`, propriétés CSS logiques (start/end au lieu de left/right), police arabe, miroir de la mise en page (menu, tiroir, flèches) ; les cartes (SVG, React Flow) et les chemins de prérequis doivent rester lisibles ; les identifiants techniques (Kubernetes, SR-IOV) restent en latin dans le texte arabe.
    - **Recherche** : normalisation propre à l'arabe (diacritiques, formes de l'alif) dans src/produits/recherche.
    - **Tests** : les règles de contenu (source, ressource libre, compétence partagée identique) par langue ; contrôle de rendu des 3 langues ; captures en RTL.
    - Ordre conseillé : anglais d'abord (interface puis contenu), arabe ensuite, une fois l'infrastructure multilingue éprouvée.

## Idées issues de l'analyse du parcours utilisateur (non demandées)

Prochaine action visible sur chaque page de roadmap ; progression partagée entre parcours (les ids de nœud sont communs) ; tableau de bord « Reprendre » ; dates de relecture et signaux de confiance sur les ressources ; vue équipe ; mesure d'usage et entretiens utilisateurs. L'assistant d'orientation n'a pas été testé auprès de vrais utilisateurs.

## Pièges rencontrés

- Vercel Hobby **bloque un déploiement dont le commit n'est pas signé par le propriétaire du compte** (adresse du propriétaire du compte, réglée dans ce dépôt). Le déploiement part de `--scope limada` depuis ce dossier ; ailleurs, la CLI vise l'espace personnel et échoue.
- La règle vaut aussi pour les déploiements déclenchés par un push sur `main` (projet Vercel `telcocloud-roadmaps-v4`, dépôt GitHub privé) : un commit signé par un autre auteur (par exemple `Claude <noreply@anthropic.com>`) est reçu mais bloqué. Une session Claude qui commite ici règle d'abord `git config user.name "Taoufik Bouazza"` et `git config user.email "<adresse du compte>"` (accord de l'auteur du 2026-11-02). Un déploiement déjà bloqué se relance depuis le tableau de bord Vercel (« Redeploy »).
- `cyber.gouv.fr` répond 200 à n'importe quelle adresse : vérifier ses liens dans son plan du site (`/sitemap.xml`), jamais par le code HTTP.
- Une page choisit son contenu par instance avec un import conditionnel sur `process.env.NEXT_PUBLIC_INSTANCE` (voir `src/app/page.tsx`) : la branche inutile disparaît du bundle. Un `if (INSTANCE.refonte)` classique n'élague rien et embarque le code de l'autre site.
- Lighthouse : le lanceur `.cmd` de npm est bloqué ; installer le paquet dans un dossier temporaire et lancer `node …/lighthouse/cli/index.js`. Dans Git Bash, `MSYS_NO_PATHCONV=1` évite que `/` soit converti en chemin Windows.

- Ne pas importer `node:fs` dans un composant client (c'est pourquoi `formatVideo.ts` est séparé de `videos.ts`, et `orientation-schema.ts` de `orientation.ts`).
- Les tests ne doivent pas supposer « la première roadmap » ni un nombre fixe de nœuds : utiliser `getRoadmap(<id>)`.
- Règles ESLint react-hooks strictes : pas de lecture ni d'écriture de ref pendant le rendu.
- Aperçu sombre/clair : les thèmes remappent la palette slate de Tailwind vers les gris de la charte d'origine.
