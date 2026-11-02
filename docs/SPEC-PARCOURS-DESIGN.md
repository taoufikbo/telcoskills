# Spécification : parcours et design du site public

Statut : validée, mise en œuvre sauf ce qui attend du contenu (§5). Voir « État de mise en œuvre » en fin de document.
Sources : réponses de Taoufik (cadrage du 2026-11-02) et audit des pages actuelles (captures bureau et mobile).

## 1. Cible

| | |
|---|---|
| Public principal | L'ingénieur qui monte en compétence (CaaS, 5G, cloud télécom). |
| Ensuite | Le décideur qui cherche une expertise, puis le pair ou recruteur. |
| Règle d'arbitrage | Si deux publics se contredisent sur une page, l'ingénieur l'emporte. Le décideur est servi par les pages de preuve (analyses, frameworks, offres), reliées par un lien discret. |
| Niveau d'arrivée | Mélangé : le site le détecte (diagnostic), il ne vise pas un niveau fixe. |
| Entrée | Mixte (lien partagé, Google, recommandation) : chaque page doit se comprendre seule. |
| Promesse en 2 minutes | Comprendre l'ampleur du problème et pourquoi c'est une vraie bascule dans le télécom, puis faire le diagnostic. |

## 2. Deux parcours séparés

### 2.1 Onboarding (nouveau visiteur) : « distillé, pas frontal »
Aucun écran d'introduction. La bascule se dit par touches, et le diagnostic est proposé, jamais imposé.

1. **Accueil, premier état.** Une phrase chiffrée sur la bascule, le graphe en grand, un seul bouton principal : « Faire le diagnostic ». « Prendre contact » devient un lien de texte dans l'en-tête.
2. **Diagnostic personnel** = le quiz d'orientation actuel (3 questions, moins d'une minute), déplacé de `/ressources/roadmaps` vers l'accueil et vers un lien direct. Sortie unique : un parcours et un premier pas.
3. **Page de compétence, arrivée par lien.** Une ligne de contexte en tête : « Cette compétence fait partie de la roadmap X. Ce site cartographie… » suivie d'une invitation discrète au diagnostic. La ligne disparaît dès que le visiteur a un parcours enregistré.

### 2.2 Usage (visiteur qui revient)
Détecté par la progression ou le parcours enregistrés dans le navigateur (`tcr:orientation`, `tcr:progression:*`). Aucun compte.

1. **Accueil, second état.** « Reprendre » : la prochaine compétence de son parcours, son avancement, un seul bouton. Puis « Nouveautés depuis votre dernière visite ».
2. **Roadmap.** Le bandeau actuel (avancement, « commencer ici », texte d'aide, « pas sûr du parcours ? ») est scindé : le revenant ne voit que l'avancement et la reprise ; le texte d'aide et le lien vers le test ne s'affichent que sans progression.
3. **Hors périmètre** : le moteur de révision espacée (non retenu).

## 3. Design cible
Direction : **éditorial sobre pour convaincre, carte interactive pour explorer.** Référence : atlas / carte (roadmap.sh, carte de métro).

### Interdits (à retirer ou à ne pas introduire)
- Dégradés violet/bleu, halos et lueurs (l'ombre bleue sous les boutons, le halo sur le fond de l'accueil).
- Grilles de cartes identiques avec icônes.
- Texte creux et superlatifs : toute affirmation porte un chiffre ou une source.
- Animations décoratives : le mouvement n'existe que s'il aide la lecture.

### Règles
- **La carte est le héros.** Sur l'accueil et sur la roadmap, elle occupe le premier écran, avec des libellés complets (aucun « Architecture Kube… »). Le bandeau d'avancement passe sous la carte ou se replie.
- **Une seule couleur d'accent**, réservée à l'action principale de la page. Le bleu ne sert plus aussi au surlignage du menu.
- **Typographie et vide** : grands titres, peu de couleurs, bordures fines, pas d'ombre portée colorée.
- **Même qualité sur ordinateur et sur mobile.** Le menu mobile tient sur une ligne (menu replié) et laisse le contenu dès le premier écran.
- Accessibilité conservée : contraste, focus visible, `prefers-reduced-motion`.

## 4. Changements par page

| Page | Changement |
|---|---|
| Accueil | Deux états (nouveau / revenant). Phrase chiffrée, graphe en grand, un bouton principal. Retirer les trois cartes identiques et le halo. |
| `/ressources/roadmaps` | Le quiz n'y est plus la porte d'entrée ; la page redevient un catalogue de parcours. |
| Roadmap | Carte d'abord ; bandeau scindé selon l'état (2.2). |
| Compétence | Ligne de contexte en tête pour les arrivées par lien (2.1). |
| `/diagnostic` (équipe) | Retiré du menu et du pied de page tant qu'il affiche « en cours de rédaction ». |
| En-tête | « Prendre contact » en lien discret ; menu mobile sur une ligne. |

## 5. Dépendances de contenu (bloquantes, à trancher)
- **La bascule n'est pas écrite.** La seule analyse du dépôt, « Thèse centrale », est un brouillon vide (`<Draft>`). Sans cette thèse, la phrase chiffrée de l'accueil n'a pas de source. À fournir par Taoufik : 3 faits chiffrés et sourcés sur la bascule dans le télécom.
- **« Nouveautés » n'a pas de données.** Seule la date d'une analyse (`meta.date`) existe, et aucune analyse n'est publiée. Il faut une date de publication ou de mise à jour par roadmap et par analyse. Tant qu'il n'y en a pas, on n'affiche pas ce bloc (jamais de contenu inventé).
- **Nom du site** : « TelcoSkills », domaine telcoskills.com (retenu le 2026-11-02). L'auteur est encore « John Doe » (fictif).

## 6. Critères de validation
1. Un visiteur sans historique voit un seul bouton principal et peut terminer le diagnostic en moins d'une minute.
2. Un visiteur avec progression ne voit ni le quiz ni le texte d'aide : il reprend en un clic.
3. Aucune page n'a de halo, de lueur ni de grille de cartes identiques.
4. Sur l'accueil, la carte est lisible en entier à 390 px et à 1280 px.
5. Aucune page du menu ne mène à un contenu « en cours de rédaction ».
6. Lint, tests, build et contrôle de rendu restent verts ; aucun lien interne cassé.

## 7. Ordre de mise en œuvre proposé
1. Design : retirer lueurs et halos, menu mobile, bouton unique (aucune dépendance de contenu).
2. Deux états d'accueil + déplacement du diagnostic.
3. Scinder le bandeau de roadmap ; ligne de contexte sur les compétences.
4. Phrase chiffrée de la bascule et « Nouveautés » : après réception du contenu (section 5).

## 8. État de mise en œuvre (2026-11-02)

Architecture : `docs/ARCHITECTURE-PRODUITS.md`.

| Critère (§6) | État |
|---|---|
| 1. Un seul bouton principal pour un visiteur sans historique, diagnostic en moins d'une minute | Fait : « Faire le diagnostic », trois questions sur l'accueil (`#diagnostic`). |
| 2. Le visiteur avec progression ne voit ni le quiz ni le texte d'aide, reprend en un clic | Fait : bloc « Reprendre » sur l'accueil ; aide et lien vers le diagnostic masqués sur la roadmap et sur les compétences. |
| 3. Aucun halo, aucune lueur, aucune grille de cartes identiques | Fait sur l'accueil, l'en-tête, la roadmap, le projet fil rouge ; animations décoratives retirées (carte, chaîne du projet). |
| 4. Carte lisible en entier à 390 et 1280 px | 1280 : texte de la carte à environ 11 px, libellés complets. 390 : le chemin vers la cible en liste, avec un lien vers la carte complète (le graphe entier y serait à environ 6 px). |
| 5. Aucune page du menu ne mène à « en cours de rédaction » | Fait (src/lib/sections.ts) : Analyses, Frameworks, Offres, Contact, Newsletter et Diagnostic d'équipe n'apparaissent dans le menu, le pied de page, les appels à l'action et le plan du site qu'une fois leur contenu présent. Vérifié en parcourant toutes les pages atteignables depuis l'accueil. Aujourd'hui, le menu ne propose donc que Ressources et À propos. |
| 6. Lint, tests, build, contrôle de rendu verts ; aucun lien interne cassé | Vérifié à chaque étape. |

En attente de contenu (§5, non contourné) : phrase chiffrée de la bascule (3 faits sourcés), « Nouveautés » (dates de publication), auteur (le nom du site est fixé : TelcoSkills).

Ce qui fait réapparaître chaque rubrique (aucune modification de code nécessaire, sauf pour les offres) :

| Rubrique | Condition |
|---|---|
| Analyses | une analyse sans `brouillon` dans content/analyses |
| Frameworks | `"redige": true` sur un framework de content/frameworks.json |
| Offres | `OFFRES_REDIGEES = true` dans src/lib/sections.ts, une fois les rubriques de src/app/offres/page.tsx rédigées |
| Contact (en-tête, accueil, compétences, frameworks, offres) | `contact.calendlyUrl` ou `contact.email` dans src/lib/instance.ts |
| Newsletter | `newsletterUrl` dans src/lib/instance.ts |
| Diagnostic d'équipe | `brouillon: false` dans content/diagnostic.json |

Roadmap : la carte occupe le premier écran (sur 1280 × 800, elle commence à 247 px au lieu de 335 et couvre environ 70 % de l'écran) : bandeau d'avancement sur une ligne, choix de vue, options et sauvegarde réunis sur une seule rangée. Sur mobile, la liste reste la vue principale.

