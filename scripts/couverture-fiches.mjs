// Couverture des fiches pédagogiques (EX-15, EX-02 à EX-07). Écrit reports/recette-fiches.md avec --ecrire.
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");
const lire = (p) => JSON.parse(fs.readFileSync(path.join(racine, p), "utf8"));
const roadmaps = fs.readdirSync(path.join(racine, "content/roadmaps")).filter((f) => f.endsWith(".json")).map((f) => lire(`content/roadmaps/${f}`));

const comp = new Map();
for (const r of roadmaps) for (const n of r.noeuds) {
  const c = comp.get(n.id) ?? { id: n.id, niveau: n.niveau, cible: 0, parcours: [] };
  c.cible = Math.max(c.cible, n.cible ?? 1);
  c.parcours.push(r.id);
  comp.set(n.id, c);
}

export function analyser() {
  const ecarts = [];
  const stats = { total: comp.size, avecFiche: 0, quiz: 0, exercices: 0, situations: 0, brouillon: 0 };
  for (const c of comp.values()) {
    const f = path.join(racine, "content/pratique", `${c.id}.json`);
    const p = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
    const fiche = p?.fiche;
    if (!fiche) { ecarts.push([c.id, "fiche absente"]); continue; }
    stats.avecFiche++;
    if (fiche.statut === "brouillon") stats.brouillon++;
    if (fiche.situation) stats.situations++;
    if (fiche.exercice) stats.exercices++;
    if ((p.rappel?.length ?? 0) >= 3) stats.quiz++;
    if (fiche.objectifs.length < 3 || fiche.objectifs.length > 7) ecarts.push([c.id, "objectifs hors bornes"]);
    if (fiche.notions.length < 3 || fiche.notions.length > 8) ecarts.push([c.id, "notions hors bornes"]);
    if ((c.niveau === "intermediaire" || c.niveau === "avance") && !fiche.situation) ecarts.push([c.id, "situation manquante (EX-07)"]);
    for (let k = 1; k <= c.cible; k++) if (!fiche.validation?.[String(k)]?.length) ecarts.push([c.id, `validation palier ${k} manquante (EX-05)`]);
    if (c.cible >= 4 && !fiche.exercice) ecarts.push([c.id, "exercice manquant (EX-06)"]);
  }
  return { ecarts, stats };
}

const { ecarts, stats } = analyser();
const lignes = [
  "# Recette des fiches pédagogiques",
  "",
  `Généré par \`scripts/couverture-fiches.mjs\`. Source : \`docs/SPEC-FICHE-COMPETENCE.md\`.`,
  "",
  "## Couverture (EX-15)",
  "",
  `- Compétences : ${stats.total}`,
  `- Avec fiche : ${stats.avecFiche}`,
  `- Fiches encore en brouillon (non publiées) : ${stats.brouillon}`,
  `- Avec mise en situation : ${stats.situations}`,
  `- Avec exercice : ${stats.exercices}`,
  `- Avec mini-quiz de 3 questions ou plus : ${stats.quiz}`,
  `- Écarts à la règle éditoriale : ${ecarts.length}`,
  "",
  ...ecarts.map(([i, m]) => `  - ${i} : ${m}`),
  "",
  "## Traçabilité exigence → vérification",
  "",
  "| Exigence | Vérifiée par |",
  "|---|---|",
  "| EX-01, EX-02, EX-03, EX-04 | `src/lib/pratique-schema.ts`, `scripts/valider-pratique.mjs`, ce rapport |",
  "| EX-05 | ce rapport (validation jusqu'au palier visé) ; affichage : page de compétence |",
  "| EX-06, EX-07 | ce rapport |",
  "| EX-08 | `src/lib/etapes.test.ts`, `src/lib/ressources-etapes.test.ts` |",
  "| EX-09 | `src/produits/progression/etat.test.ts` |",
  "| EX-10 | ce rapport (compétences avec 3 questions) |",
  "| EX-11 | `src/lib/pratique.ts` (filtre), recherche de fuite dans le build |",
  "| EX-12, fond technique | **audit humain** : rien n'est vérifié automatiquement |",
  "",
];
if (process.argv.includes("--ecrire")) fs.writeFileSync(path.join(racine, "reports/recette-fiches.md"), lignes.join("\n"));
console.log(lignes.slice(5, 13).join("\n"));
if (ecarts.length) { console.log(ecarts.map((e) => e.join(" : ")).join("\n")); process.exitCode = 1; }
