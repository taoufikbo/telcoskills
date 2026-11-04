# Spécification : fiche pédagogique par compétence

Statut : **spécification de départ du cycle en V** (décision de l'auteur du 2026-11-04 : « fait tout, j'auditerai à la fin, cycle en V »).
Source : idée de l'auteur (backlog, point 17 de `HANDOFF.md`), règles du dépôt (statuts `brouillon` / `valide`, jamais d'« acquis » sur simple déclaration).
Vocabulaire : « niveau » = difficulté d'une compétence (fondamental, intermédiaire, avancé, transverse) ; « palier » = maîtrise visée pour un rôle (1 à 5) ; « investissement » = léger, moyen, long.

## 1. Objet

Une page de compétence doit répondre à : **« concrètement, que dois-je apprendre et savoir faire pour la maîtriser dans mon métier ? »** Chaque fiche suit cinq temps : *Comprendre* (résumé existant), *Apprendre* (objectifs, notions), *Pratiquer* (mise en situation), *Valider* (critères au palier visé, mini-quiz), *Approfondir* (ressources en trois temps).

## 2. Exigences

| Id | Exigence | Critère de recette |
|---|---|---|
| EX-01 | Le modèle `pratique` (content/pratique/<id>.json) est **étendu**, pas dupliqué : un nouveau bloc `fiche` (avec son propre `statut`) porte `objectifs`, `notions`, `situation`, `validation`, `exercice`. Les champs existants (segments, vocabulaire, rappel, pourquoi, lienProjet) sont inchangés. | Le schéma accepte les 7 contenus existants sans modification ; `fiche` est facultatif. |
| EX-02 | **Objectifs d'apprentissage** : 3 à 7 phrases commençant par un verbe d'action (« savoir… », « diagnostiquer… »). | Test de schéma : 3 ≤ n ≤ 7 ; revue de couverture. |
| EX-03 | **Notions à maîtriser** : 3 à 8 notions courtes, cochables par la personne (auto-évaluation). | Test de schéma ; affichage d'une liste cochable. |
| EX-04 | **Mise en situation** : un contexte et 3 à 7 étapes numérotées, dans un environnement télécom. | Test de schéma ; affichage. |
| EX-05 | **Validation par palier, cumulative** : critères de P1 à P5 ; la page n'affiche que jusqu'au **palier visé du parcours consulté** (les paliers au-delà sont repliés, jamais présentés comme exigés). | Test : pour une compétence partagée, deux parcours montrent des paliers différents. |
| EX-06 | **Exercice pratique** (consigne et livrable attendu) pour les compétences **critiques** (palier visé ≥ 4 dans au moins un rôle). | Test de couverture : toute compétence critique a un exercice. |
| EX-07 | **Règle éditoriale par niveau** : fondamental = objectifs + notions + validation ; intermédiaire = + situation (exemple court) ; avancé = + situation (scénario) ; critique = + exercice. Une fiche courte et juste vaut mieux qu'une fiche longue. | Test de couverture automatique, rapport par parcours. |
| EX-08 | **Ressources en trois temps** : champ `etape` (`commencer`, `approfondir`, `aller-plus-loin`) sur chaque ressource ; affichage groupé ; règle de classement écrite et testée (3 « commencer » au plus par compétence ; une compétence a toutes ses ressources classées ou aucune). | Tests sur le contenu livré. |
| EX-09 | **Notions cochées = auto-évaluation distincte** : elles **ne comptent ni dans le palier atteint ni dans « acquis (testé) »**, et le disent. Elles sont conservées dans l'état du navigateur, le **lien de sauvegarde** (anciens liens toujours lus) et la **fusion** (union des notions). | Tests d'état, de lien et de fusion ; test négatif : cocher ne change pas `palierAtteint` ni `statutPratique`. |
| EX-10 | **Mini-quiz** : réutilise `rappel` (existant). Écrit pour un **pilote de 6 compétences du SRE** ; les autres compétences gardent leurs questions existantes ou aucune. | 6 compétences pilotes avec 3 questions chacune. |
| EX-11 | **Statuts** : tout contenu rédigé par l'assistant est `brouillon` ; **aucun brouillon n'atteint la production** (HTML et données). Le script de validation couvre `fiche`. | Test d'invariant (comme pour le reste du contenu) ; recherche de fuite dans le build. |
| EX-12 | **Distribution Linux neutre** : une compétence partagée entre parcours n'impose pas une distribution (RHEL/CentOS, SUSE, Ubuntu) ; les variantes sont dites en toutes lettres. | Revue de l'auditeur sur les compétences concernées. |
| EX-13 | **Sections vides absentes** : aucune page « en cours de rédaction » ; une section sans contenu n'est pas rendue. | Test de rendu. |
| EX-14 | **Accessibilité** : titres hiérarchisés, listes sémantiques, cases à cocher étiquetées, états annoncés. | Contrôle manuel et automatique de base. |
| EX-15 | **Couverture visée** : une fiche pour chacune des **178 compétences** (SRE d'abord, puis les cinq autres parcours et Sylva). | Rapport de couverture. |

Hors périmètre : comptes utilisateurs ; évaluation notée ; contenu en anglais ou en arabe (point 13 du backlog) ; mesure d'audience des fiches.

## 3. Conception

- **CD-01 Schéma** : `fiche: { statut, objectifs: string[3..7], notions: string[3..8], situation?: { contexte, etapes: string[3..7] }, validation?: { "1".."5": string[1..4] }, exercice?: { consigne, livrable } }`, dans `PratiqueSchema`. Filtré par `retirerBrouillons`, validé par `appliquerRelecture` et `scripts/valider-pratique.mjs`.
- **CD-02 Notions cochées** : champ `notions` de `EtatNoeud` = **masque de bits** (bit *i* = notion *i* cochée, au plus 30 notions) : compact, fusionnable par OU, ajouté en dernier élément optionnel du lien `p1.` (les liens d'avant restent lus).
- **CD-03 Palier affiché** : le palier visé vient du champ `cible` du nœud **dans le parcours consulté** ; la validation montre P1 à `cible`, le reste dans un repli « au-delà du palier visé ».
- **CD-04 Ressources** : `etape` ajouté au schéma `Ressource` (donc aussi au catalogue d'apprentissage) ; classement initial par règles (CD-05), corrigeable à la main dans les JSON.
- **CD-05 Règles de classement** : `certif`, `livre`, `retour-experience`, `spec` → `aller-plus-loin` ; `doc`, `opensource`, `libre` → `approfondir` ; `cours` et `video` → `commencer` si le titre indique une introduction (intro, débuter, bases, 101, pas à pas, comment ça marche, basics, fundamentals, for beginners, getting started), sinon `approfondir`. Au plus 3 `commencer` par compétence (les suivants passent en `approfondir`).
- **CD-06 Page** : ordre des sections : Objectifs, Pour démarrer, Ce qu'il faut maîtriser (notions cochables, vocabulaire, segments), Pourquoi ce choix, Mise en situation, Exercice, Validation au palier visé, Dans le projet fil rouge, Vérifiez vos acquis, Ressources (trois groupes).
- **CD-07 Contenu** : écrit par lots, parcours SRE d'abord ; chaque fiche s'appuie sur le résumé et les ressources du nœud ; commandes et notions courantes seulement, sans version précise.

## 4. Plan de tests (niveaux du cycle en V)

| Niveau | Tests | Exigences |
|---|---|---|
| Unitaire | schéma `fiche` (bornes) ; état des notions (cocher, décocher, indépendance du palier) ; lien (aller-retour, ancien lien) ; fusion (OU) ; classement des ressources | EX-01 à EX-03, EX-08, EX-09 |
| Intégration | fusion `pratique` dans les roadmaps ; filtrage des brouillons en production ; page de compétence : sections, ordre, absence de sections vides | EX-11, EX-13 |
| Contenu | couverture par niveau (règle éditoriale), palier max couvert par la validation, exercice des compétences critiques, notions ≤ 8, étapes de ressources | EX-02 à EX-08, EX-15 |
| Système (recette) | build de production sans fuite ; essai navigateur (cocher une notion, quiz, palier affiché par parcours) ; rapport de couverture ; dossier de revue pour l'auditeur | EX-05, EX-09 à EX-12, EX-14 |

## 5. Traçabilité

La matrice exigence → tests est maintenue dans `reports/recette-fiches.md` (générée par `scripts/couverture-fiches.mjs`) avec, pour chaque exigence, l'état de vérification. L'audit de l'auteur porte sur le **fond technique** des contenus (rien ne l'est automatiquement) et sur la décision de passer en `valide`.
