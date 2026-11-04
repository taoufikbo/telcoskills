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
   **Mis au backlog le 2026-11-04 (décision de l'auteur : « laisse le mail dans le backlog »).** Brevo est écarté (interface jugée inutilisable : les options de formulaire attendues sont introuvables). **Service recommandé : Buttondown** : formulaire intégrable documenté (POST vers `https://buttondown.com/api/emails/embed-subscribe/<nom d'utilisateur>`, champ `email`, champ caché `embed=1`), double confirmation selon le réglage de la newsletter, gratuit jusqu'à 100 abonnés (page de tarifs lue le 2026-11-04). Autres pistes écartées : Resend (formulaire à construire côté serveur avec une clé secrète à poser dans Vercel), Substack (aucune interface officielle pour un formulaire sur un site tiers). **Pour reprendre** : l'auteur crée le compte Buttondown, laisse la confirmation par e-mail activée et donne son nom d'utilisateur ; il reste à renseigner `inscription: { action, champEmail }` dans `src/lib/instance.ts`, à ajouter le champ caché `embed` à l'encart (`src/produits/inscription/EncartInscription.tsx`), à compléter la page Confidentialité (service, finalité, durée : proposition « jusqu'à la désinscription »), puis à vérifier l'encart en ligne. Aucune inscription d'essai sur la vraie liste sans l'accord de l'auteur. Tant que `inscription` vaut `null`, l'encart n'apparaît pas.
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
14. **Refonte des roadmaps : un vrai cockpit (fait le 2026-11-02, non vérifié en ligne).** Constat de l'auteur : une fois le parcours choisi, la barre de gauche ne sert pas ; il manquait le programme et le volume d'heures. Livré :
    - **Produit `cockpit`** (src/produits/cockpit, essai /labo/cockpit) : `calculerProgramme` (blocs dans l'ordre, compétences, heures par bloc et au total), `placerSemaines` (semaine de fin de chaque bloc), `projeter` (semaines et date d'arrivée), `calculerCockpit` (décompte, heures faites et restantes, prochaine étape, révisions dues de la roadmap, objectif et chemin critique). Composants `Cockpit`, `Programme`, `Rythme`. Visualisation : tout est reçu en entrée, aucun accès au stockage.
    - **Rythme** : 4 h par semaine par défaut, réglable de 1 à 40, mémorisé dans `tcr:pratique` (champ `rythme`, produit Progression : `useRythme`, `definirRythme`). Le même rythme sert au cockpit, au résultat du diagnostic et à la phrase « Durée estimée » (`libelleDuree(h, rythme)`).
    - **Heures** : hypothèse éditoriale de content/orientation.json (`duree_par_niveau_heures`), toujours dites « estimation indicative ». Les heures « faites » sont celles des compétences acquises par un test (« à revoir » compte comme acquis, comme dans le décompte) ; « vu » ne compte pas.
    - **Page de roadmap** : titre, cockpit, programme, puis « La carte, en détail » (Arbre, Liste, Métro, Objectif, Options, Sauvegarde). Pas de barre latérale. Retiré : `AncreParcours` (remplacé par le cockpit), les barres par bloc de « Détail et sauvegarde » (remplacées par le programme ; il reste « Sauvegarde »), le bouton « Suivre ce parcours » de l'en-tête (déplacé dans le cockpit), la hauteur de carte liée au premier écran (la carte est désormais sous le cockpit, 75 % de la hauteur de l'écran).
    - **Résultat du diagnostic** : le programme du parcours recommandé (et le rythme) s'affiche avant la carte, chargé depuis `/programmes.json` (statique, environ 59 Ko, seulement après un diagnostic).
    - **Mode apprentissage (ajouté après retour de l'auteur : il veut la barre de gauche, comme un lecteur de cours)** : sur chaque page de compétence, barre de gauche = programme du parcours (`Sommaire`, produit cockpit ; raccord `SommaireParcours`) : blocs repliables, compétence en cours marquée, statut de chaque compétence, avancement et heures restantes ; repliée en « Programme du parcours » sur mobile. La page de roadmap reste le tableau de bord d'arrivée (cockpit) ; ajout d'un planning « Révisions à venir ».
    - **Reste ouvert** : le cockpit n'est pas encore sur « Mon espace » (/moi) ; le programme sur le catalogue /ressources/roadmaps ; la date d'arrivée suppose un rythme constant et ne tient pas compte des jours sautés ; à valider avec de vrais utilisateurs.

15. **Consentement à la mesure d'audience (fait le 2026-11-02).** Produit src/produits/consentement (essai /labo/consentement) : bandeau, « Gérer mes choix » en pied de page, script Vercel Web Analytics chargé seulement après accord. Visible seulement si `NEXT_PUBLIC_ANALYTICS=vercel` est défini sur Vercel (sinon aucune mesure, donc aucun bandeau). Page Confidentialité mise à jour ; durée de conservation du choix (6 mois) et rédaction juridique à valider par l'auteur.

16. **Un palier cible par compétence : des heures réalistes (backlog, demandé le 2026-11-03).**
    - **Problème constaté** : le site additionne, pour chaque compétence, des heures d'étude comme si on visait l'expertise partout. Résultat : des totaux déraisonnables (par exemple 544 h pour le parcours « Ingénieur CaaS telco », 63 compétences ; chiffre affiché par le cockpit et le programme depuis le point 14, qui reprend `duree_par_niveau_heures`). Personne ne peut tout maîtriser en expertise, même à l'usage. Le défaut vient du modèle : une seule valeur d'heures par compétence, sans notion de *jusqu'où* on la travaille.
    - **Principe retenu** : sur chaque item d'un parcours, **définir le palier à atteindre**, puis **décliner tout ce que le site propose en fonction de ce palier** : heures (celles pour atteindre le palier cible, pas l'expertise), programme, projection en semaines, prochaine étape, chemin critique d'un objectif, résultat du diagnostic, ce qui compte comme « acquis ».
    - **Vocabulaire** : « niveau » désigne déjà la difficulté d'une compétence (fondamental, intermédiaire, avancé, transverse). La maîtrise s'appelle **palier**.
    - **Échelle de paliers** (à trancher, voir plus bas) :
      - *Proposition de l'auteur* : 1 = je sais dire à quoi ça sert et je comprends le rôle du composant dans l'architecture ; 2 = palier 1 + je vois comment l'utiliser ; 3 = j'ai suivi le parcours.
      - *Complément proposé* pour couvrir composants **et** patterns (inspiré des taxonomies d'apprentissage classiques, Bloom et Dreyfus, sans en reprendre le détail) : 4 = diagnostiquer et arbitrer (dépanner, choisir entre alternatives, dire quand ne pas l'utiliser et les compromis) ; 5 = concevoir et transmettre (dimensionner, intégrer, composer plusieurs patterns, écrire la décision d'architecture). Les paliers 1 à 3 mesurent « j'ai appris » ; 4 et 5 mesurent « je sais arbitrer et concevoir », l'essentiel pour un pattern. Pour un pattern, le palier 1 se lit : dire le problème résolu et le contexte d'application.
      - Preuves possibles : palier 1 = rappel réussi (l'« acquis testé » actuel) ; palier 2 = segments pratiques (content/pratique) ; palier 3 = projet fil rouge (déclaratif, à dire clairement : pas de compte) ; paliers 4 et 5 = cas de panne ou d'arbitrage corrigé, livrable (hors site). Un palier sans preuve disponible pour une compétence ne s'affiche pas.
    - **Où vit la donnée** : le palier cible dépend du **rôle** (Multus : palier 3 pour l'ingénieur CaaS, palier 1 pour le SRE). Il se pose donc par compétence **dans chaque roadmap** (champ `cible` du nœud, validé par Zod), et non dans la compétence partagée. Les heures par palier sont une hypothèse éditoriale dans content/orientation.json (par niveau de difficulté × palier), comme aujourd'hui `duree_par_niveau_heures` : aucune valeur n'est inventée dans le code.
    - **Ce que verrait le visiteur** : le programme annonce, par compétence, le palier à atteindre et les heures pour y arriver ; le total devient celui du palier cible (ordre de grandeur réaliste), avec le rythme réglable existant. Les heures « pour aller plus loin » (au-delà du palier cible) restent consultables à part, jamais dans le total principal. Progression : le cockpit mesure l'atteint par rapport au *cible* (« 12 compétences au palier visé sur 63 »), pas par rapport à l'expertise.
    - **À décider par l'auteur avant de coder** : (a) l'échelle retenue (3 ou 5 paliers) ; (b) le palier cible de chaque compétence de chaque roadmap : c'est un travail éditorial de l'auteur sur environ 177 compétences et 6 parcours. Aide possible sans rien inventer : une première proposition calculée (par exemple d'après le niveau de difficulté et la demande, si renseignée) **présentée comme brouillon à valider**, jamais publiée telle quelle ; (c) la répartition des heures par palier ; (d) la valeur du palier 3 sans preuve ; (e) quel palier compte comme « acquis » dans le décompte et pour débloquer les suites dans le chemin critique (aujourd'hui : le rappel réussi, soit le palier 1).
    - **Pour le produit** : évolutions du schéma des roadmaps (`cible` par nœud) et d'orientation (heures par niveau et palier) ; du produit Progression (palier atteint par compétence dans `tcr:pratique`, sans casser les états existants) ; du produit Cockpit (`calculerProgramme`, `projeter`, `calculerCockpit` : heures selon le palier cible) ; du résultat du diagnostic (`/programmes.json`) ; tests de non-régression sur les états existants ; page d'essai /labo/cockpit à étendre. Tant que l'auteur n'a pas posé les paliers cibles, le site ne doit pas afficher de total présenté comme un temps d'apprentissage : à décider si l'on masque le total actuel en attendant (le bloc « sans donnée se masque »).

    - **Avancement (2026-11-03)** :
      - **Décidé** : 5 paliers ; plus d'heures, une échelle d'**investissement** léger / moyen / long (niveau de difficulté × palier, table `investissement_par_palier` dans content/orientation.json, hypothèse éditoriale) ; le palier se pose **par bloc et par rôle**, avec des exceptions par compétence.
      - **Livré, non branché** : brouillon de la grille (reports/paliers-grille.json, 61 blocs, 7 parcours) et rapport de contrôles (reports/paliers-brouillon.md, généré par scripts/paliers-controles.mjs : cohérence, prérequis, écarts entre rôles, échantillon de 15 à relire) ; second avis indépendant (7 agents sans accès au brouillon) : 36 % de paliers identiques, avis systématiquement plus haut (inflation), corrélation de rangs de 0,45 à 0,70 sauf IA agentique (0,13, parcours repris) ; champ optionnel `cible` (1 à 5) au schéma des nœuds ; src/lib/palier.ts (`investissement`, `repartition`) avec tests ; scripts/appliquer-paliers.mjs, qui n'écrit `cible` que pour les cases marquées `"valide": true`.
      - **Reste à faire par l'auteur** : relire la grille et l'échantillon, marquer les cases `"valide": true`. Points à surveiller : Sylva semble trop léger ; `reseau-ip` à P4 chez l'architecte est sans doute trop haut (la règle de remontée des prérequis est à plafonner).
      - **Reste à faire côté produit** (après validation) : lancer `node scripts/appliquer-paliers.mjs --ecrire`, puis remplacer les heures par l'échelle dans le cockpit (`calculerProgramme`, `placerSemaines`, `projeter`) : la projection en semaines et la date d'arrivée reposent sur des heures et sont à repenser (par exemple un nombre de compétences par semaine) ; progression mesurée par rapport au palier cible ; résultat du diagnostic (/programmes.json). Tant que ce n'est pas fait, le cockpit affiche toujours des heures par niveau (à masquer ou à relativiser).
      - **Fait le 2026-11-04 (v0.5.0), sur décision de l'auteur : « applique la grille brouillon, on corrigera en prod »** : la grille a été appliquée **sans relecture complète** (160 cases marquées `"valide": true`, 321 paliers écrits dans `content/roadmaps/*.json`, champ `cible` sur chaque compétence). **À relire et corriger** : Sylva (trop léger), `reseau-ip` à P4 chez l'architecte, avis indépendant plus haut (inflation) ; pour corriger, modifier `cible` dans la roadmap (ou la case de la grille puis `node scripts/appliquer-paliers.mjs --ecrire`). Les **heures sont retirées** : `duree_par_niveau_heures` et `src/lib/duree.ts` supprimés ; le programme, la carte, l'assistant, le diagnostic et le cockpit affichent le palier visé et l'investissement léger, moyen, long (table `investissement_par_palier`). Le **rythme se compte en compétences par semaine** (défaut 2, de 1 à 10 ; les anciens rythmes en heures restent lisibles, ramenés dans les bornes). **Fait le 2026-11-04 (v0.6.0)** : palier atteint par compétence dans `tcr:pratique` (champ `palier`, déclaratif de 1 à 5 ; le rappel réussi vaut le palier 1 ; conservé dans le lien de sauvegarde, anciens liens toujours lus, fusion au palier le plus haut) ; le cockpit mesure « N compétences au palier visé sur M » ; le tiroir de compétence permet de déclarer le palier atteint ; la page de chaque compétence affiche le palier visé, l'investissement et la définition du palier. **Relecture de la grille avec l'auteur (2026-11-04)** : la règle de remontée des prérequis est **plafonnée à P3** (4 compétences de l'architecte redescendent de P4 à P3, dont `reseau-ip`) ; Sylva est relevé sur 8 compétences (Kubernetes, Helm, GitOps, métriques, journaux, création de clusters de charge à P3 ; chaîne d'approvisionnement à P2 ; montée de version à P4), pour s'aligner sur l'ingénieur CaaS et le SRE. Les changements sont des exceptions validées dans `reports/paliers-grille.json` (réappliquer ne les défait pas). **Relecture complète des autres parcours (2026-11-04, sur délégation de l'auteur)** : contrôles automatiques (aucune incohérence de prérequis ; les écarts d'au moins 2 entre rôles opposent tous l'architecte aux autres, ce qui est voulu) puis lecture rôle par rôle. Architecte : inchangé. 8 paliers relevés, chacun avec un critère écrit dans `reports/paliers-grille.json` : Intégrateur NF 5GC (`helm-cnf`, `deploiement-lab`, `config-nf` à P3 : parité avec l'Intégrateur DevOps et intégration elle-même), SRE (`ha-geo`, `stockage-dr` à P3 : « répond aux incidents »), Intégrateur DevOps (`cni`, `multus`, `sriov` à P2 : lire la configuration réseau des charts). **Points de jugement tranchés le 2026-11-04 (« fait au mieux »)** : relevés à P3 SRE `ocp-upgrade` (opération critique de l'opérateur, comme Sylva) et IA `llmops-eval` (parité avec `llmops-obs` et `llmops-gateway`) ; **conservés** Ingénieur CaaS `perf-hugepages` et `perf-profile` à P2 (ordre cohérent : opérateur Sylva P1, ingénieur P2, architecte P3), Intégrateur DevOps bloc « Exploitation et observabilité » à P2 (il intègre et livre), SRE sécurité à P1 (le durcissement est appliqué par l'ingénieur CaaS) ; blocs IA restants à P2 (`gpu-reseau`, `rag-evaluation`, `cout-energie`) conservés, spécialisés. La grille est désormais relue en entier. **Reste à faire** : le diagnostic ne tient pas encore compte du palier atteint.

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
