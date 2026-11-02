# DESIGN : du catalogue qu'on lit au système de pratique

Statut : **proposition, en attente de validation.** Aucun code n'a été écrit pour ce chantier.
Lecteur visé : le propriétaire du produit, qui valide avant toute implémentation.

## 0. Ce qui n'est pas en place

Le brief place ce chantier « après la mise en ligne de l'instance public et le modèle de compétence unique (0a à 0c du plan validé) ». Dans le dépôt :

- L'instance `public` n'est **pas déployée**. La mise en production est bloquée dans cette session par les permissions (voir l'échange précédent).
- Je ne trouve **aucun « plan validé 0a à 0c »** : `reports/plan.md` et `AUDIT.md` ne les définissent pas. Je suppose que « modèle de compétence unique » veut dire : une compétence partagée entre roadmaps (85 le sont) a **un seul contenu** et non une copie par roadmap. Aujourd'hui, 6 compétences ont des textes qui divergent (`reports/final.md`). Si ce n'est pas ce que vous entendez, dites-le : cela change la place des nouveaux champs (§6).
- Les branches de travail : `interne` (version sans volet commercial) et `p2-qualite` (version avec business). **Sur quelle base construire** est à trancher (§9, question 1).

Le design ci-dessous ne dépend pas de ces points, mais l'implémentation, si.

## 1. Constat de départ

| Aujourd'hui | Conséquence pour l'apprentissage |
|---|---|
| Une compétence = un titre, un résumé, des liens (`Noeud` : `resume`, `ressources`, `projet`, `avis`) | On lit, on ne se teste jamais. |
| Statuts : `a-faire`, `en-cours`, `maitrise`, `ignore`, **déclarés par la personne** | « Maîtrisé » sur simple déclaration : c'est ce que le brief interdit. |
| Progression en `localStorage`, clé `tcr:progression:<roadmap>`, une roadmap à la fois | Aucune date : impossible d'espacer les révisions. |
| Questions : aucune | Pas de matière pour le rappel. Tout reste à écrire. |
| Quiz d'orientation : 3 questions **déclaratives** | Il dit où commencer, jamais ce que la personne sait. |
| Projet fil rouge : 9 phases, 11 rôles, compétences reliées | Matière prête pour les exemples résolus et la mise en situation. |

## 2. Principes → décisions

Chaque décision cite le principe qu'elle sert (numéros du brief). Les références sont celles du brief ; je ne les ai pas revérifiées une à une. Les effets décrits ont été mesurés ailleurs (laboratoire, cours) : **rien ne garantit qu'ils se reproduisent ici**, d'où le pilote et les mesures (§7, §8).

| # | Décision | Principe |
|---|---|---|
| D1 | Une page compétence = un **parcours en 5 étapes**, une seule action principale visible par étape | 1 (charge cognitive) |
| D2 | La **question préalable** vient avant tout contenu ; se tromper est sans conséquence (aucun statut, aucun score) ; la bonne réponse s'affiche ensuite, avec la raison | 4 (question avant le contenu), 11 (retour) |
| D3 | Le **rappel** (2-3 QCM) est l'activité centrale ; relire n'a jamais d'effet sur le statut | 2 (se tester) |
| D4 | « **Acquis (testé)** » = rappel réussi, daté. Jamais de case à cocher. Seul cet état compte dans la progression | 2, interdit « acquis sur déclaration » |
| D5 | Révisions à J+1, J+3, J+7, J+21 (boîtes de Leitner), calculées **en local** | 3 (espacement) |
| D6 | Une session de révision **mélange** les blocs, pas de série par bloc | 5 (entrelacement) |
| D7 | Explication en **segments de 4 éléments au plus** ; schéma à côté du texte (bureau), dans l'ordre de lecture (mobile) ; vocabulaire de base **avant** | 1, 8 (multimédia) |
| D8 | **Exemple résolu** = lien vers l'endroit du projet fil rouge où la compétence sert ; il est **replié par défaut pour les avancés** | 6 (inversion de l'expertise) |
| D9 | Sur les nœuds avancés : « **Pourquoi ce choix plutôt que X ?** », réponse libre courte puis comparaison à la réponse de référence | 7 (auto-explication) |
| D10 | Statut codé par **forme + couleur + texte** (icône, pas la couleur seule), annoncé aux lecteurs d'écran | 9 (perception), accessibilité |
| D11 | Aucun point, badge, série, classement, félicitation générique. La seule trace de progrès est le nombre de compétences « acquis (testé) » et la prochaine révision | 10 (motivation intrinsèque) |
| D12 | Le retour dit **ce qui était faux sur la tâche et quoi faire ensuite**, jamais un jugement sur la personne | 11 |
| D13 | **Autonomie** : le test de positionnement et le saut de bloc sont optionnels ; on peut toujours ouvrir une compétence sans rien faire d'autre | 10 |
| D14 | Navigation, home, expertise : **fluides** (peu de texte, un chemin évident). Apprentissage : **volontairement exigeant** (on doit produire une réponse) | 12 (arbitrage) |

## 3. Modèle de progression

### 3.1 Statuts

| Statut | Forme + couleur | Condition | Compte dans la progression ? |
|---|---|---|---|
| À découvrir | ○ cercle vide, gris | rien fait | non |
| Vu | ◐ demi-cercle, bleu | segments lus ou question préalable répondue | non |
| Acquis (testé) | ● disque plein + coche, vert | un rappel réussi, daté | **oui** |
| À revoir | ◔ cercle avec flèche, ambre | l'échéance Leitner est dépassée | **oui, signalé** (voir ci-dessous) |

À revoir : la compétence reste comptée comme acquise, mais affichée avec le marqueur « à revoir » dans la barre (partie hachurée). Raison : oublier fait partie de l'apprentissage (Bjork) ; la retirer du total punirait la personne pour avoir été honnête. **À valider** (question 3).

### 3.2 Boîtes de Leitner

- Boîtes 1 à 4 = intervalles **J+1, J+3, J+7, J+21** (votre choix ; ils sont croissants, ce que soutient Cepeda et al. 2006 dans son principe, pas pour ces valeurs précises).
- Réussite en boîte *k* → échéance = date de réussite + intervalle *k+1*. En boîte 4 : échéance J+21 renouvelée.
- Échec → retour en boîte 1 (révision le lendemain).
- Une compétence n'entre dans le système qu'à son premier rappel réussi.
- Tout est calculé à partir de **dates de réussite stockées dans le navigateur**, sans horloge serveur. Conséquence : changer l'heure de l'appareil fausse les échéances ; c'est accepté.

### 3.3 Migration des données existantes

Les clés `tcr:progression:<roadmap>` ne sont **jamais supprimées** ; une nouvelle clé `tcr:pratique` est ajoutée. Correspondance :

| Avant | Après | Compte ? |
|---|---|---|
| `maitrise` (déclaré) | **Vu**, avec la mention « déclaré maîtrisé, à confirmer par un test » | non |
| `en-cours` | Vu | non |
| `ignore` | marqueur « hors parcours » (n'est pas un statut), conservé | n'entre ni au numérateur ni au dénominateur, comme aujourd'hui |
| `a-faire` | À découvrir | non |

Une personne qui avait 40 compétences « maîtrisées » verra donc sa progression retomber à 0 % tant qu'elle ne se teste pas. C'est la conséquence directe de l'interdit « acquis sur déclaration » : **je la signale pour que vous la validiez** (question 4). Mitigation proposée : un message unique, au premier chargement, qui l'explique et propose le test de positionnement du bloc.

## 4. Les 4 écrans clés (basse fidélité)

Notation : `[ACTION]` = l'action principale de l'écran (une seule, couleur d'action unique). `( )` = actions secondaires, en lien ou bouton discret. Les écrans mobiles gardent le même ordre, en une colonne.

### Écran 1 : Home, avec révisions dues

La home sert **deux personnes**. La personne qui n'a jamais pratiqué (le décideur, l'apprenant en première visite) voit l'état A. L'état B n'apparaît que si le navigateur contient une révision échue : un décideur n'y est donc jamais exposé. *(Principes 1, 12 ; parcours décideur du brief.)*

```
ÉTAT A : première visite                       ÉTAT B : révision échue (n = 3)
┌──────────────────────────────────┐           ┌──────────────────────────────────┐
│ TelcoArchi         Projet  À propos         │ TelcoArchi         Projet  À propos │
│                                  │           │                                  │
│ Architecture de plateformes      │           │ À revoir aujourd'hui (3)         │
│ télécom : cloud, 5G et IA.       │           │ 4 min · 3 compétences mélangées  │
│ <pour qui · quel problème>       │           │                                  │
│                                  │           │ [ Commencer la révision ]        │
│ [ Trouver mon parcours ]         │           │ ( Plus tard )                    │
│ ( Voir le projet fil rouge )     │           ├──────────────────────────────────┤
│                                  │           │ Reprendre : Résilience…  2/5     │
│ preuve : projet de bout en bout  │           │ ( Trouver un autre parcours )    │
│ (9 phases, 11 rôles)             │           │ <promesse en une ligne>          │
└──────────────────────────────────┘           └──────────────────────────────────┘
```

Décisions : en B, la carte de révision est **la première action** (critère d'acceptation) ; la promesse se réduit à une ligne ; le quiz d'orientation passe en lien secondaire. En A, la promesse tient en 5 secondes : *pour qui, quel problème, quelle preuve, une action*. Le graphe animé actuel de la home publique est **décoratif** au sens du brief (principe 1) : je propose de le retirer de l'état B et de le garder en A seulement s'il passe le test « transmet-il une information ? » (question 6).

### Écran 2 : Page compétence (parcours en 5 étapes)

Une étape visible à la fois, un indicateur « étape 2 sur 5 » (3 niveaux de hiérarchie : titre de la compétence, étape, contenu). *(Principes 1, 4, 6, 7, 8.)*

```
Résilience et exploitabilité › Prometheus, Alertmanager, Thanos                 Étape 3 sur 5
────────────────────────────────────────────────────────────────────────────────
 ◐ Vu          Prérequis : Workloads : Pods, Deployments… ● acquis

 ① Question   ② Vocabulaire   ③ Explication   ④ Dans le projet   ⑤ Rappel
 ─────────────────────────────  (étape courante en gras)

 ③ Explication · segment 2 sur 3
 ┌───────────────────────────────────┬────────────────────────────────┐
 │ Pourquoi mesurer la saturation    │  [schéma : les 4 signaux       │
 │ avant la latence ?                │   → seuil → alerte]            │
 │  • signal 1 : …                   │                                │
 │  • signal 2 : …                   │  légende courte, signalée par  │
 │  • signal 3 : …                   │  les mêmes numéros que le texte│
 │  (4 éléments au plus)             │                                │
 └───────────────────────────────────┴────────────────────────────────┘
 ( Segment précédent )                              [ Segment suivant ]
```

Ordre fixe : ① question préalable (avec réponse et raison affichées ensuite) → ② vocabulaire (étape **sautée** s'il n'y a pas de terme nouveau) → ③ explication en segments → ④ « où cette compétence sert dans le projet » (lien vers la phase ; **replié** pour un nœud avancé) → ⑤ rappel de 2 à 3 QCM. Pour un nœud avancé, une étape « Pourquoi ce choix plutôt que X ? » s'insère avant le rappel. Mobile : le schéma passe **sous** le segment qu'il illustre, jamais en fin de page. Les ressources externes existantes restent accessibles dans un volet « Pour aller plus loin », **hors parcours** (elles n'ont pas d'effet sur le statut).

### Écran 3 : Révision mélangée

Une question par écran, d'un bloc différent à chaque fois. *(Principes 2, 3, 5, 11.)*

```
 Révision · question 2 sur 3                              ( Quitter, sans perdre )
 ──────────────────────────────────────────────────────────────────────────────
 D'où vient cette question : « Sécurité et conformité » (pas le bloc précédent)

 Un cluster perd un site. Quel indicateur décide du basculement ?
   ( ) a. …
   ( ) b. …
   ( ) c. …
   ( ) d. …

 [ Valider ]
 ── après validation ─────────────────────────────────────────────────────────
 ✗ Pas tout à fait. Le RTO mesure la durée de reprise, pas la perte de données.
   Pour la prochaine fois : revoir le segment 2 « RPO et RTO ».  ( Ouvrir le segment )
 [ Question suivante ]
```

Le retour porte sur la **tâche** et indique l'**étape suivante** ; jamais « bravo » ni « vous n'y êtes pas arrivé ». L'état de chaque réponse se lit par l'icône ✓/✗ **et** le texte. En fin de session : « 2 compétences à nouveau acquises, prochaine révision demain », sans score ni série.

### Écran 4 : Résultat du test de positionnement

Optionnel (5 questions, moins de 2 min), proposé après le quiz d'orientation. *(Principes 6, 10, 11, 13.)*

```
 Votre point de départ, d'après le test
 ──────────────────────────────────────────────────────────────────────────────
 Parcours : Architecte cloud / CaaS telco
 Point de départ : Exploitabilité dès la conception        ( Pourquoi cette compétence ? )

 Déjà acquis, d'après le test (2)
   ● Prometheus, Alertmanager, Thanos   acquis (testé) · à revoir demain
   ● Logs centralisés (EFK/ELK, Loki)   acquis (testé) · à revoir demain

 Sauter le bloc « Fondations » ?  Vous avez réussi 4 questions sur 4.
   ( Garder le bloc )                                [ Passer à la suite ]
```

Décisions : le test ne place **jamais** une compétence en « acquis » sur une seule bonne réponse sans garde-fou : chaque question propose « je ne sais pas » (qui ne donne aucun statut), et toute réussite entre en boîte 1, donc **revérifiée dès le lendemain** (voir §9, question 5 : 1 question par compétence ne suffit pas à écarter un coup de chance à 25 %). Le saut de bloc se **propose** après réussite du test du bloc ; il ne s'impose pas.

## 5. Règles de design

- **Hiérarchie à 3 niveaux au plus par écran** : titre de la page, titre de la section ou étape, contenu.
- **Une seule couleur d'action** (l'accent `--accent`, bleu de l'instance public) ; aucune autre couleur n'invite à cliquer. Les couleurs de statut (vert, ambre, bleu) ne servent qu'à coder un statut, toujours doublées d'une forme.
- **Mesure de 60 à 75 caractères** par ligne de texte (`max-width: 68ch` sur le corps).
- **Schéma et texte côte à côte** au-dessus de 768 px, **empilés dans l'ordre de lecture** en dessous.
- **Mouvement** : seulement un retour d'information (validation d'une réponse, passage d'un segment) ; **désactivé** sous `prefers-reduced-motion`. Aucune animation d'ambiance.
- **WCAG 2.2 AA** : les contrastes des jetons sont déjà testés (`palette.test.ts`). À ajouter : cible tactile 24 px minimum (critère 2.5.8), focus visible non masqué (2.4.11), aide cohérente (3.2.6), QCM utilisables au clavier, annonce du retour par `aria-live`.
- **Pas d'élément pédagogique dans les pages expertise** (§6).

## 6. Parcours décideur (sans régression)

- **Home état A** : compréhensible en 5 secondes, une action. Le projet fil rouge est présenté comme **démonstration de méthode** (« voici comment je mène un déploiement, phase par phase »), pas comme exercice à faire.
- **Étape d'engagement faible** avant le contact : le **diagnostic d'équipe** déjà présent sur l'instance public (12 questions, calculé dans le navigateur, imprimable) devient la marche intermédiaire : projet → diagnostic → contact. Le diagnostic est aujourd'hui un **brouillon non relu** (`brouillon: true`) : il doit être relu avant d'être mis en avant.
- **Pages expertise** : aucune question, aucun statut, aucun parcours. Les cartes « À revoir » n'y apparaissent pas.
- Le décideur n'a ni état local ni révision : il ne voit **jamais** l'état B de la home.

## 7. Contenu : extension du schéma d'une compétence

Champs ajoutés à `NoeudSchema` (tous optionnels : une compétence sans ces champs reste lisible comme aujourd'hui) :

```
questionPrealable : { enonce, options[4], bonne (0..3), explication, statut }
vocabulaire[]     : { terme, definition }
segments[]        : { titre, elements[1..4], schema? , ordre }
lienProjet        : { phase, role }          // doit exister dans le projet fil rouge
pourquoi          : { question, reference }  // nœuds avancés seulement
rappel[]          : 2 à 3 × { enonce, options[4], bonne, mauvaisChoixPlausible, explication, statut }
statut (par question) : "brouillon" | "valide"
```

Garde-fous vérifiés au build : `lienProjet` désigne une phase et un rôle existants ; chaque `rappel` a une bonne réponse dans ses options et une explication ; ≤ 4 éléments par segment ; `pourquoi` seulement sur un nœud de niveau `avance`. **Aucune question `brouillon` n'est incluse dans le build de production** (filtrage à la génération, pas seulement à l'affichage, pour qu'elle n'apparaisse ni dans le HTML ni dans le JSON envoyé).

**Où écrire les champs** : si la compétence partagée n'a qu'un contenu (« modèle unique »), ces champs vivent **une seule fois**, pas dans chaque roadmap. Aujourd'hui les nœuds sont dupliqués par roadmap : c'est le point du §0 à clarifier.

**Relecture** : écran local (`/relecture`, désactivé en production), liste des questions `brouillon` par compétence, trois actions par question : **valider** (passe à `valide`), **corriger** (édition sur place), **rejeter** (supprime). Il écrit dans les fichiers de contenu ; il n'a aucune exposition publique.

**Qui écrit les questions** : moi, en brouillon, à partir des ressources déjà vérifiées du nœud ; vous validez. Je ne fournis **aucune** question sans source dans le dépôt, et chaque explication cite la ressource d'où elle vient. Une question fausse enseigne une erreur : c'est le risque principal du chantier.

## 8. Pilote

Un bloc de la roadmap Architecte. **Proposition : « Résilience et exploitabilité »** (5 compétences).

| Compétence | Niveau | Lien projet (phases) |
|---|---|---|
| Prometheus, Alertmanager, Thanos | intermédiaire | plateforme, production |
| Logs centralisés (EFK/ELK, Loki) | intermédiaire | plateforme |
| Exploitabilité dès la conception : observabilité et supervision | intermédiaire | dimensionnement |
| Haute disponibilité et géo-redondance | avancé (nœud de jugement) | design, plateforme, tests, recette |
| PRA/PCA : objectifs RPO/RTO et architecture associée | avancé | recette |

Pourquoi ce bloc : (1) les 5 compétences sont **toutes** utilisées dans le projet fil rouge, donc l'exemple résolu et la mise en situation de fin de bloc sont possibles partout ; (2) il mélange niveaux intermédiaire et avancé, ce qui permet de tester la réduction du guidage ; (3) il a une chaîne de prérequis interne (métriques + logs → design ; géo-redondance → PRA) qui rend le **mélange** testable ; (4) un nœud de jugement (`ha-geo`) porte naturellement la question « Pourquoi ce choix plutôt que X ? ». Alternatives écartées : « Réseau telco » (7 compétences, jargon dense, risque d'écrire des questions fausses), « Fondations » (trop facile pour tester l'adaptation).

**Limite du pilote** : avec un seul bloc, le mélange entre blocs (principe 5) **ne peut pas être testé** ; on mélange seulement les 5 compétences entre elles. À assumer ou à compenser en ajoutant quelques questions d'un second bloc au pilote (question 2).

**Mise en situation de fin de bloc** (transfert) : « Phase 7, recette : le site A est coupé, que fais-tu ? » tirée des activités de la phase `recette` du projet. Une seule, à réponse libre comparée à une référence, en brouillon puis validée par vous.

Pas de généralisation avant votre validation (a) des questions du bloc, (b) du parcours testé sur mobile et bureau, (c) des mesures après 2 semaines.

## 9. Mesure

Événements demandés : `pretest_answer`, `segment_view`, `recall_attempt`, `recall_success`, `review_due_shown`, `review_done`, `ics_export`, `bloc_skip_test`. Aucune donnée personnelle ; données jointes : identifiant de compétence, boîte Leitner, résultat.

- **Taux de réussite au rappel au premier essai** : `recall_success` / `recall_attempt` pour la boîte 0.
- **Taux de réussite à J+7** : même rapport, pour les tentatives en boîte 3 (échéance J+7). C'est la mesure de rétention.
- **Retour pour une révision échue** : `review_done` / `review_due_shown`. Sans identifiant, c'est un rapport de volumes, **pas** une part d'utilisateurs ; ce n'est donc qu'une approximation de l'indicateur demandé.
- **Délai première visite → première compétence « acquis (testé) »** : la date de première visite est gardée en local ; à la première réussite, le navigateur envoie un événement unique avec le délai en jours. Calculable sans identifiant.

Limites à connaître : les événements personnalisés de Vercel Web Analytics peuvent exiger une offre payante (non vérifié) ; une alternative sans cookie (Plausible) est possible. Avec très peu de visiteurs, ces taux seront **trop bruités pour conclure** après 2 semaines ; je le dirai dans METRICS.md plutôt que de présenter des pourcentages sur 10 personnes. `METRICS.md` sera écrit à l'étape d'implémentation de la mesure.

**Export .ics** : fichier local listant les prochaines révisions (un événement par compétence échue, `UID` stable pour qu'un nouvel export **mette à jour** les événements au lieu de les dupliquer). Il est instantané : une fois importé, il n'est pas mis à jour tout seul ; l'écran le précise.

## 10. Décisions validées (2026-10-22)

1. **Base de travail : `interne`.** Le volet décideur (étape 6, diagnostic avant contact) concerne l'instance `public` et attend la bascule : il n'est pas implémenté sur `interne`.
2. **Pilote : oui**, bloc « Résilience et exploitabilité », **avec quelques questions d'un second bloc** pour tester le mélange. Choix retenu : 4 questions de rappel sur `ceph` et `stockage-dr` (bloc « Stockage et virtualisation »), voisins des prérequis de `ha-geo` et `pra-rpo-rto`.
3. **« À revoir » compte comme acquis**, avec marquage visible (partie hachurée de la barre).
4. **Migration : acceptée.** Les compétences « maîtrisées » par déclaration repassent à « Vu » ; un message unique l'explique et propose le test du bloc.
5. **Test de positionnement : deux questions par compétence.** Pour tenir l'objectif de moins de 2 minutes, la seconde question n'est posée **que si la première est réussie** (confirmation avant « acquis (testé) »). Une personne qui ne sait pas répond à 5 questions ; une personne qui sait en répond à 10, soit environ 3 minutes. L'écart avec « moins de 2 minutes » du brief est assumé : à confirmer à la relecture du parcours.
6. **Graphe animé de la home : à retirer de la home, animation conservée dans un onglet.** Il n'existe **que sur l'instance `public`** (`AccueilRefonte`) ; la home de `interne` n'en a pas. À appliquer à la bascule. Condition posée : le **résultat doit être visible dès la home**. Retenu : la home de `interne` montre déjà le résultat du test d'orientation à la place du quiz (parcours, premier nœud, durée), et la carte « À revoir aujourd'hui » en tête pour la personne de retour. Pour `public`, le graphe passe dans un onglet « Comment c'est construit » et la home affiche le résultat du quiz au même endroit.
7. **« Modèle de compétence unique » : oui**, un contenu par compétence partagée. Mis en œuvre : `content/pratique/<nœud>.json`, fusionné dans **toutes** les roadmaps qui contiennent le nœud.

## 11. Livraison après validation

Une branche par étape, chacune avec rapport, avant/après, Lighthouse et critères cochés :

1. Schéma étendu + garde-fous + filtrage des brouillons + écran de relecture.
2. Modèle de progression (statuts, Leitner, migration `localStorage`) + tests.
3. Page compétence pilote (parcours en 5 étapes).
4. Révision mélangée + carte « À revoir » + export .ics.
5. Test de positionnement + saut de bloc.
6. Home (états A et B) + parcours décideur.
7. Mesure + `METRICS.md`.

Critères d'acceptation globaux repris du brief : aucune compétence « acquis » sans rappel réussi ; la révision échue est la première action de la personne de retour ; une seule action principale par écran du parcours apprenant ; aucune question en brouillon visible en production ; aucune régression Lighthouse ni accessibilité (référence : accueil 95/100, compétence 96/100, rôle 100/100 sur la branche `interne`).

## 12. Ancrage : un menu qui dit où je suis, ce que j'ai fait, ce que je fais maintenant

Ajout du 2026-10-22, à la demande : « ça reste fouillis, il faudrait un menu qui regroupe ma progression, mon parcours… en une vue, sans réflexion ». Principes servis : 1 (une action principale par écran), 9 (perception immédiate), 10 (autonomie), 12 (fluide pour trouver, exigeant pour apprendre).

### 12.1 Constat mesuré (page roadmap actuelle, build local)

| Mesure | Valeur |
|---|---|
| Éléments interactifs dans le premier écran (bureau 1280 × 800) | **24** (dont 6 d'en-tête) |
| Éléments interactifs sur la page entière | 86 (projet fil rouge : 235) |
| Étages empilés avant la première compétence | **6** : provenance, titre, légende, 5 boutons de vue, vidéo, « Commencer ici », barre de progression |
| Mobile 360 px : défilement avant le premier bloc de compétences | **779 px**, soit plus qu'un écran |
| Éléments du menu qui parlent de **la personne** | **0** (« Projets », « À propos ») |

Le diagnostic : la page **décrit le parcours** mais ne dit jamais **où en est la personne**. Rien ne persiste d'une page à l'autre, et tout est au même niveau (5 vues, un filtre, une vidéo, une légende, des statistiques).

### 12.2 Ce dont une personne a besoin pour s'ancrer, sans réfléchir

Cinq questions, dans cet ordre. L'écran doit y répondre **avant** qu'elle ait à chercher :

| # | Question | Réponse affichée | Où aujourd'hui |
|---|---|---|---|
| 1 | Où suis-je ? | Le parcours que je suis | nulle part |
| 2 | Où j'en suis ? | « 12/63 acquis (testé) · dont 3 à revoir » + une barre | repliée, dans un panneau |
| 3 | Que dois-je faire maintenant ? | **Une** action : réviser, sinon continuer | noyée dans « Commencer ici » |
| 4 | Où est-ce que je vais ? | Les blocs du parcours avec leur avancement | dans un détail replié |
| 5 | Mes données sont-elles en sécurité ? | Un lien de sauvegarde, visible | dans un détail replié |

### 12.3 Décisions

| # | Décision | Principe |
|---|---|---|
| D15 | **Un menu de 5 entrées, identique sur toutes les pages** : *Mon espace* · *Mon parcours* · *Parcours* · *Projet* · *À propos*. « Mon espace » porte un compteur en texte (« 3 à revoir ») quand des révisions sont dues. « Mon parcours » n'apparaît que lorsqu'il y en a un | 12 |
| D16 | **« Mon espace » = une seule vue** qui répond aux questions 1 à 5 : le parcours, l'avancement, **une** action principale, les blocs avec leur avancement, la sauvegarde. Sans parcours, une seule invitation : trouver son parcours | 1, 9 |
| D17 | **« Mon parcours » = le dernier parcours sur lequel j'ai agi** (marquer vu, rappel, « Suivre ce parcours », ou clic sur le point de départ du test). Ouvrir une page ne change rien : parcourir n'est pas s'engager | 10 |
| D18 | **En-tête de roadmap : de 6 étages à 3.** (1) titre + origine ; (2) **barre d'ancrage** unique : avancement + prochaine étape + **un** bouton ; (3) choix de la vue. Légende, chemin conseillé, vidéo, détail par bloc et sauvegarde passent dans « Options » (repliée) | 1 |
| D19 | **Une action principale par écran** : réviser s'il y a des révisions dues, sinon continuer. « Suivre ce parcours » est un bouton secondaire | 1 |
| D20 | Les statuts de l'espace sont dits **en texte et par forme** (○ à découvrir, ◐ vu, ● acquis, ◔ à revoir), jamais par la couleur seule | 9 |

### 12.4 Maquette basse fidélité : « Mon espace »

```
 TelcoCloud   [Mon espace · 3 à revoir]  Mon parcours  Parcours  Projet  À propos        Rechercher  ☾
 ───────────────────────────────────────────────────────────────────────────────────────────────────
 Mon parcours : Architecte cloud / CaaS telco

 ┌─ À faire maintenant ───────────────────────────────────────────┐
 │  [ Réviser 3 compétences ]        (sinon : Continuer : <titre>) │   ← une seule action
 └────────────────────────────────────────────────────────────────┘

 Où j'en suis                                         ● 12 acquis   ◔ 3 à revoir   ◐ 5 vus   ○ 41
 ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░  12/61 acquis (testé)

 Mon parcours en un coup d'œil
   Fondations                    ▓▓▓▓▓▓▓▓░░  3/4
   Kubernetes et OpenShift       ▓▓▓░░░░░░░  3/14
   Réseau telco                  ░░░░░░░░░░  0/7                 … (un bloc = un lien)

 Mes autres parcours : Ingénieur CaaS telco 4/63 · …      ( Choisir un autre parcours )
 Garder ma progression : [ Copier un lien de sauvegarde ]
```

Sans parcours : un titre (« Vous n'avez pas encore de parcours »), **un** bouton (« Trouver mon parcours »), et la liste des parcours en dessous.

### 12.5 Ce qui n'est pas encore branché
La session de révision mélangée n'existe qu'à l'étape 4 : d'ici là, la ligne « Réviser n compétences » ouvre la première compétence due. Aucune compétence ne peut être due avant l'étape 3 (le rappel), donc ce cas ne se produit pas encore.

## 13. État de livraison (2026-10-22)

Branches empilées, chacune avec son rapport dans `reports/` : `pratique-1-schema` → `pratique-2-progression` → `pratique-menu` → `pratique-3-competence` → `pratique-4-revision` → `pratique-5-positionnement` → `pratique-6-accueil` → `pratique-7-mesure`.

| Étape | Rapport | État |
|---|---|---|
| 1. Schéma, brouillons, relecture | `pratique-1-schema.md` | fait ; **31 contenus à relire par vous** |
| 2. Progression, espacement, migration | `pratique-2-progression.md` | fait |
| Ancrage : menu, Mon espace | `pratique-menu.md` | fait |
| 3. Page compétence en parcours | `pratique-3-competence.md` | fait |
| 4. Révision mélangée, .ics, lien complet | `pratique-4-revision.md` | fait |
| 5. Test de positionnement, saut de bloc | `pratique-5-positionnement.md` | fait |
| 6. Accueil à deux états | `pratique-6-accueil.md` | interne fait ; **volet décideur = instance publique, non fait** |
| 7. Mesure | `pratique-7-mesure.md` + `METRICS.md` | fait ; **mesure inactive sur l'interne** |

Rien de ce chantier n'est visible en production tant que les contenus sont en brouillon (`/relecture` pour les valider).
