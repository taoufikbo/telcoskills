# Recette des fiches pédagogiques

Généré par `scripts/couverture-fiches.mjs`. Source : `docs/SPEC-FICHE-COMPETENCE.md`.

## Couverture (EX-15)

- Compétences : 178
- Avec fiche : 178
- Fiches encore en brouillon (non publiées) : 178
- Avec mise en situation : 153
- Avec exercice : 23
- Avec mini-quiz de 3 questions ou plus : 11
- Écarts à la règle éditoriale : 0


## Traçabilité exigence → vérification

| Exigence | Vérifiée par |
|---|---|
| EX-01, EX-02, EX-03, EX-04 | `src/lib/pratique-schema.ts`, `scripts/valider-pratique.mjs`, ce rapport |
| EX-05 | ce rapport (validation jusqu'au palier visé) ; affichage : page de compétence |
| EX-06, EX-07 | ce rapport |
| EX-08 | `src/lib/etapes.test.ts`, `src/lib/ressources-etapes.test.ts` |
| EX-09 | `src/produits/progression/etat.test.ts` |
| EX-10 | ce rapport (compétences avec 3 questions) |
| EX-11 | `src/lib/pratique.ts` (filtre), recherche de fuite dans le build |
| EX-12, fond technique | **audit humain** : rien n'est vérifié automatiquement |
