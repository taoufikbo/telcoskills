# METRICS : ce qu'on mesure, comment on le lit, ce qu'on ne peut pas savoir

Lecteur visé : le propriétaire du produit, pour décider après le pilote (bloc « Résilience et exploitabilité »).

## 0. État de la mesure

- **Rien n'est mesuré aujourd'hui sur l'instance `interne`** : le script d'audience n'y est pas chargé (`src/components/Analytics.tsx` ne le charge que pour l'instance `public`, en production, avec `NEXT_PUBLIC_ANALYTICS=vercel`). Les événements sont émis dans le code mais ne partent nulle part. Pour mesurer le pilote, il faut donc **soit** publier le pilote sur l'instance `public`, **soit** décider d'activer la mesure sur `interne` (réglage à faire, avec accord des personnes concernées).
- **Sans cookie, sans identifiant.** Aucune adresse, aucun nom, aucun contenu de réponse n'est envoyé : uniquement des identifiants de compétence, des nombres et des booléens.
- **Les événements personnalisés de Vercel Web Analytics peuvent exiger une offre payante** (non vérifié). Alternative sans cookie : Plausible. Le code n'appelle que `window.va` (`src/lib/analytics.ts`) : changer d'outil se fait à un seul endroit.

## 1. Les événements

| Événement | Quand | Données |
|---|---|---|
| `pretest_answer` | une réponse à la question préalable (page compétence) ou à une question du test de positionnement | `noeud`, `ok` ; test de positionnement : `contexte: "positionnement"`, `etape` (1 ou 2) |
| `segment_view` | passage d'une partie d'explication à la suivante | `noeud`, `segment` |
| `recall_attempt` | un rappel terminé (toutes les questions d'une compétence) | `noeud`, `correctes`, `total`, `premierEssai` |
| `recall_success` | un rappel entièrement réussi : la compétence devient « acquis (testé) » | `noeud`, `premierEssai` |
| `review_due_shown` | des révisions dues sont affichées (accueil ou session) ; **au plus une fois par jour et par navigateur** | `n` |
| `review_done` | une question de révision validée | `noeud`, `ok`, `boite` (avant la réponse), `retard` (jours après l'échéance), `premiereDuJour` |
| `ics_export` | export du calendrier | `n` (événements exportés) |
| `bloc_skip_test` | « Passer à la suite » après un bloc entièrement réussi au test | `bloc`, `roadmap` |
| `node_done` | première acquisition d'une compétence (par test ou par rappel) | `noeud`, `premiere` (première de la personne), `delaiJours` (si `premiere`) |
| `quiz_start` | première réponse au test d'orientation | aucune |
| `quiz_complete` | test d'orientation terminé | `metier`, `parcours` |
| `roadmap_open` | ouverture d'une roadmap | `roadmap` |
| `contact_submit` | formulaire envoyé (instance `public`) | `sujet` |
| `cta_clic` | clic sur un appel à l'action de conseil (instance `public`) | `emplacement` |
| `abonnement` | abonnement à la lettre (instance `public`) | `contexte` |
| `contact_clic` | clic vers la prise de rendez-vous (instance `public`) | `canal` |
| `diagnostic_termine` | diagnostic d'équipe terminé (instance `public`) | `niveau` |
| `export_progression` | export JSON de la progression d'une roadmap | `roadmap` |

Un test automatique vérifie que ce tableau et le code ne se contredisent pas (`src/lib/indicateurs.test.ts`).

## 2. Les quatre indicateurs

Les formules sont du code (`src/lib/indicateurs.ts`) : `node scripts/indicateurs.ts <export.json>` les calcule sur un export d'événements `[{ "name": "...", "data": { ... } }, ...]`.

| # | Indicateur | Formule | Ce qu'il dit |
|---|---|---|---|
| 1 | **Réussite au rappel au premier essai** | `recall_success[premierEssai]` ÷ `recall_attempt[premierEssai]` | Les questions et l'explication sont-elles calibrées ? Trop haut (≈ 100 %) : trop facile ; trop bas : explication ou question à revoir. |
| 2 | **Rétention à J+7** (la vraie mesure) | `review_done[boite = 3, ok]` ÷ `review_done[boite = 3]`, avec `retard ≤ 2` | Une compétence acquise il y a une semaine est-elle encore sue ? Même calcul pour J+1, J+3 et J+21 (courbe de rétention). |
| 3 | **Retour pour une révision échue** (proxy) | `review_done[premiereDuJour]` ÷ `review_due_shown` | Quand une révision est due, la personne revient-elle la faire ? |
| 4 | **Délai jusqu'à la première compétence acquise** | médiane et part ≤ 7 jours de `node_done[premiere].delaiJours` | En combien de temps un nouvel arrivant obtient-il une preuve ? |

### Pourquoi ces choix
- **« J+7 » exige un retard ≤ 2 jours** : une révision faite 9 jours en retard ne mesure plus la rétention à une semaine.
- **L'indicateur 3 est un proxy, pas une part d'utilisateurs.** Sans identifiant, on ne sait pas qui est qui. On compte des **navigateurs-jours** : `review_due_shown` et le premier `review_done` de la journée sont émis au plus une fois par jour et par navigateur. Le rapport lit donc « quelle part des jours où une révision était due a donné lieu à une révision ». Un navigateur vidé ou une navigation privée compte comme une nouvelle personne.
- **L'indicateur 4 ne voit que ceux qui arrivent à une première acquisition.** Il ne dit rien de ceux qui abandonnent avant : il faut le lire avec l'entonnoir ci-dessous.

## 3. L'entonnoir

1. Visite de l'accueil (pages vues de `/`)
2. `quiz_start` → `quiz_complete` : le test d'orientation est-il fait ?
3. `roadmap_open` → `segment_view` / `pretest_answer` : la personne entre-t-elle dans une compétence ?
4. `recall_attempt` → `recall_success` : réussit-elle le rappel ? (indicateur 1)
5. `node_done[premiere]` : première preuve (indicateur 4)
6. `review_due_shown` → `review_done` : revient-elle ? (indicateur 3) → réussit-elle à J+7 ? (indicateur 2)
7. `ics_export`, `bloc_skip_test` : adoption des outils d'espacement et du saut de bloc.

Les passages d'une étape à l'autre sont des **rapports de volumes**, pas des suivis de personnes.

## 4. Règles de lecture (à respecter avant de conclure)

- **Ne rien conclure d'un taux sur moins de 30 observations.** À 30 observations autour de 50 %, l'intervalle à 95 % est de ± 18 points (le code l'affiche : `fiable: false` en dessous de 30). Après deux semaines, avec un bloc pilote et peu de visiteurs, **la plupart des indicateurs ne seront pas lisibles** : le dire est la bonne réponse, pas en fabriquer un pourcentage.
- **La rétention à J+7 a un délai de grâce incompressible** : une première acquisition faite le jour 1 ne produit sa première mesure à J+7 que le jour 8. Une lecture à deux semaines ne couvre qu'une seule vague de révisions.
- **Les compétences du pilote ne sont pas indépendantes** (5 compétences d'un même bloc, 3 questions chacune) : un taux global peut cacher une seule mauvaise question. Regarder par `noeud` avant de généraliser.
- **Aucun seuil de réussite n'est fixé ici.** Le critère « le pilote est concluant » (par exemple une rétention à J+7 minimale) est une décision du propriétaire, à prendre **avant** de regarder les chiffres.

## 5. Ce qu'on ne peut pas savoir
- Qui revient, combien de personnes distinctes, sur quels appareils.
- Si une personne a refait un rappel ailleurs (autre navigateur) : son état local diffère.
- Pourquoi une personne abandonne (aucun entretien ici). Les chiffres disent où, pas pourquoi : prévoir 3 à 5 entretiens avec de vraies personnes du pilote.
