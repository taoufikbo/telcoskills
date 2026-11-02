// Calcule les indicateurs de rétention (METRICS.md) à partir d'un export d'événements.
// Usage : node scripts/indicateurs.ts export.json   où export.json = [{ "name": "recall_attempt", "data": { ... } }, ...]
import fs from "node:fs";
import { calculerIndicateurs, type Taux } from "../src/produits/mesure/indicateurs.ts";

const fichier = process.argv[2];
if (!fichier) {
  console.error("Usage : node scripts/indicateurs.ts <export.json>");
  process.exit(1);
}
const i = calculerIndicateurs(JSON.parse(fs.readFileSync(fichier, "utf8")));
const pct = (x: number | null) => (x === null ? "n/a" : `${Math.round(x * 100)} %`);
const ligne = (nom: string, t: Taux) =>
  `${nom.padEnd(44)} ${String(t.k).padStart(4)}/${String(t.n).padEnd(4)} ${pct(t.taux).padStart(6)}  IC95 ${t.ic95 ? `${pct(t.ic95[0])} à ${pct(t.ic95[1])}` : "n/a"}  ${t.fiable ? "" : "(< 30 : non interprétable)"}`;

console.log(ligne("Réussite au rappel, premier essai", i.rappelPremierEssai));
for (const [k, t] of Object.entries(i.retention)) console.log(ligne(`Rétention ${k}${k === "J+7" ? " (la vraie mesure)" : ""}`, t));
console.log(ligne("Retour pour une révision échue (proxy)", i.retourRevision) + (i.retourRevision.anomalie ? "  ANOMALIE : plus de révisions que d'affichages" : ""));
console.log(ligne("Première acquisition en 7 jours ou moins", i.delaiPremiereAcquisition.dansLesSeptJours) + `  médiane : ${i.delaiPremiereAcquisition.mediane ?? "n/a"} jours (n = ${i.delaiPremiereAcquisition.n})`);
