// Contrôles du brouillon des paliers cibles : produit reports/paliers-brouillon.md. Lecture seule sur le contenu du site.
// Usage : node scripts/paliers-controles.mjs
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");

const lire = (...c) => JSON.parse(fs.readFileSync(path.join(racine, ...c), "utf8"));
const grille = lire("reports", "paliers-grille.json");
const orientation = lire("content", "orientation.json");
const inv = grille.investissement;
const NOM = { 1: "léger", 2: "moyen", 3: "long" };
const roadmaps = fs.readdirSync(path.join(racine, "content", "roadmaps")).filter((f) => f.endsWith(".json")).sort().map((f) => lire("content", "roadmaps", f));
const pratique = new Set(fs.readdirSync(path.join(racine, "content", "pratique")).map((f) => f.replace(/\.json$/, "")));

const out = [];
const L = (t = "") => out.push(t);
const alertes = [];
const alerte = (t) => alertes.push(t);

// palier effectif d'un nœud dans une roadmap : exception, sinon palier du bloc
const palier = (rm, n) => {
  const g = grille.roadmaps[rm.id];
  const ex = g?.exceptions?.[n.id];
  if (ex) return { p: ex.palier, source: "exception", raison: ex.raison };
  const b = g?.blocs?.[n.bloc];
  return b ? { p: b.palier, source: "bloc", raison: b.raison } : null;
};
const invest = (n, p) => inv[n.niveau]?.[p] ?? 2;

const effectifs = new Map(); // `${rm}/${id}` -> palier
const parRoadmap = [];

for (const rm of roadmaps) {
  const g = grille.roadmaps[rm.id];
  if (!g) { alerte(`Roadmap sans grille : ${rm.id}`); continue; }
  for (const b of rm.blocs) if (!g.blocs[b]) alerte(`${rm.id} : bloc sans palier : « ${b} »`);
  for (const b of Object.keys(g.blocs)) if (!rm.blocs.includes(b)) alerte(`${rm.id} : bloc de la grille inconnu : « ${b} »`);
  const ids = new Set(rm.noeuds.map((n) => n.id));
  for (const id of Object.keys(g.exceptions ?? {})) if (!ids.has(id)) alerte(`${rm.id} : exception sur un nœud inconnu : ${id}`);
  for (const [id, e] of Object.entries(g.exceptions ?? {})) {
    const n = rm.noeuds.find((x) => x.id === id);
    if (n && g.blocs[n.bloc] && e.palier === g.blocs[n.bloc].palier) alerte(`${rm.id} : exception inutile (même palier que le bloc) : ${id}`);
  }
  const cible = { 1: 0, 2: 0, 3: 0 }, plein = { 1: 0, 2: 0, 3: 0 };
  const parBloc = new Map();
  const compte = {};
  for (const n of rm.noeuds) {
    const r = palier(rm, n);
    if (!r) continue;
    effectifs.set(`${rm.id}/${n.id}`, r.p);
    const h = invest(n, r.p);
    cible[h]++;
    plein[invest(n, 3)]++;
    compte[r.p] = (compte[r.p] ?? 0) + 1;
    const e = parBloc.get(n.bloc) ?? { n: 0, h: { 1: 0, 2: 0, 3: 0 }, ex: 0 };
    e.n++; e.h[h]++; if (r.source === "exception") e.ex++;
    parBloc.set(n.bloc, e);
  }
  parRoadmap.push({ rm, cible, plein, parBloc, compte });
}

// Contrôle prérequis : un prérequis direct ne doit pas être ciblé 2 paliers sous la compétence qui en dépend
const prereqs = [];
for (const rm of roadmaps) {
  for (const n of rm.noeuds) {
    const pn = effectifs.get(`${rm.id}/${n.id}`);
    for (const pid of n.prerequis ?? []) {
      const pp = effectifs.get(`${rm.id}/${pid}`);
      if (pp !== undefined && pn !== undefined && pn - pp >= 2) prereqs.push(`${rm.id} : ${n.id} (palier ${pn}) dépend de ${pid} (palier ${pp})`);
    }
  }
}

// Écarts entre rôles sur une compétence partagée
const parNoeud = new Map();
for (const [k, p] of effectifs) {
  const [rmId, id] = k.split("/");
  if (!parNoeud.has(id)) parNoeud.set(id, []);
  parNoeud.get(id).push({ rmId, p });
}
const ecarts = [...parNoeud].filter(([, v]) => v.length > 1 && Math.max(...v.map((x) => x.p)) - Math.min(...v.map((x) => x.p)) >= 2);

// Preuves disponibles
const nbSans2 = [];
const hors = [];
for (const [k, p] of effectifs) {
  const id = k.split("/")[1];
  if (p === 2 && !pratique.has(id)) nbSans2.push(k);
  if (p >= 4) hors.push(k);
}

// Échantillon reproductible (graine fixe)
let graine = 20261103;
const alea = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const tous = roadmaps.flatMap((rm) => rm.noeuds.map((n) => ({ rm, n })));
const echantillon = [];
const pris = new Set();
// stratifié : au moins 1 nœud par roadmap, le reste au hasard
for (const rm of roadmaps) {
  const c = rm.noeuds[Math.floor(alea() * rm.noeuds.length)];
  echantillon.push({ rm, n: c }); pris.add(`${rm.id}/${c.id}`);
}
while (echantillon.length < 15) {
  const x = tous[Math.floor(alea() * tous.length)];
  const k = `${x.rm.id}/${x.n.id}`;
  if (!pris.has(k)) { pris.add(k); echantillon.push(x); }
}

// ---- Rapport
L("# Paliers cibles : brouillon et contrôles");
L();
L(`Généré le ${new Date().toISOString().slice(0, 10)} par \`scripts/paliers-controles.mjs\` à partir de \`reports/paliers-grille.json\`. **Brouillon non validé : rien n'est publié ni branché sur le site.**`);
L();
L("## Hypothèses à valider");
L();
L("| Palier | Définition |");
L("|---|---|");
for (const k of ["1", "2", "3", "4", "5"]) L(`| ${k} | ${grille.paliers[k]} |`);
L();
L("Investissement par compétence (léger, moyen, long) selon le niveau de difficulté et le palier visé, sans durée en heures :");
L();
L("| Palier | Fondamental | Intermédiaire | Avancé |");
L("|---|---|---|---|");
for (const p of [1, 2, 3, 4, 5]) L(`| ${p} | ${NOM[inv.fondamental[p]]} | ${NOM[inv.intermediaire[p]]} | ${NOM[inv.avance[p]]} |`);
L();
L("## Synthèse par parcours");
L();
L("| Parcours | Compétences | Investissement aujourd'hui (tout au palier 3) | Investissement au palier cible | Répartition des paliers |");
L("|---|---|---|---|---|");
for (const { rm, cible, plein, compte } of parRoadmap) {
  const fmt = (c) => `${c[1]} légers · ${c[2]} moyens · ${c[3]} longs (${Math.round((100 * c[3]) / rm.noeuds.length)} % longs)`;
  L(`| ${rm.id} | ${rm.noeuds.length} | ${fmt(plein)} | **${fmt(cible)}** | ${[1, 2, 3, 4, 5].map((p) => `P${p}: ${compte[p] ?? 0}`).join(" · ")} |`);
}
L();
L("## Grille à valider (un palier par bloc)");
for (const { rm, parBloc } of parRoadmap) {
  const g = grille.roadmaps[rm.id];
  L();
  L(`### ${rm.id} : ${rm.titre}`);
  L();
  L(`*Rôle : ${g.role}*`);
  L();
  L("| Bloc | Palier | Compétences | Dont exceptions | Investissement | Raison |");
  L("|---|---|---|---|---|---|");
  for (const b of rm.blocs) {
    const e = parBloc.get(b);
    if (!e) continue;
    L(`| ${b} | **${g.blocs[b].palier}** | ${e.n} | ${e.ex} | ${e.h[1]} l · ${e.h[2]} m · ${e.h[3]} L | ${g.blocs[b].raison} |`);
  }
  const ex = Object.entries(g.exceptions ?? {});
  if (ex.length) {
    L();
    L("Exceptions : " + ex.map(([id, e]) => `\`${id}\` → P${e.palier} (${e.raison})`).join(" ; "));
  }
}
L();
L("## Contrôles automatiques");
L();
L(`- **Cohérence de la grille** : ${alertes.length ? alertes.length + " alerte(s)" : "aucune alerte"}.`);
for (const a of alertes) L(`  - ${a}`);
L(`- **Prérequis** (un prérequis direct ciblé 2 paliers sous la compétence qui en dépend) : ${prereqs.length} cas.`);
for (const p of prereqs) L(`  - ${p}`);
L(`- **Compétences partagées dont le palier diffère de 2 ou plus selon le rôle** : ${ecarts.length} cas (la raison doit se lire dans la grille de chaque rôle).`);
for (const [id, v] of ecarts) L(`  - \`${id}\` : ${v.map((x) => `${x.rmId} P${x.p}`).join(", ")}`);
L(`- **Preuve du palier 2** (segment pratique dans content/pratique) : ${nbSans2.length} compétences au palier 2 sans segment pratique, dont la preuve est donc à définir.`);
L(`- **Paliers 4 et 5** (preuve hors site : cas de panne ou d'arbitrage corrigé, livrable) : ${hors.length} compétences concernées.`);
L();
L("## Échantillon à relire (15 compétences, tirage reproductible)");
L();
L("Question pour chaque ligne : « un professionnel de ce rôle devrait-il atteindre ce palier, ni plus ni moins ? ». Seuil proposé : 13 sur 15 jugés justes ; sinon on corrige les règles et on retire un échantillon.");
L();
L("| # | Parcours | Compétence | Niveau | Palier proposé | Origine | Justification | Juste ? |");
L("|---|---|---|---|---|---|---|---|");
echantillon.forEach(({ rm, n }, i) => {
  const r = palier(rm, n);
  L(`| ${i + 1} | ${rm.id} | ${n.titre} (\`${n.id}\`) | ${n.niveau} | **P${r.p}** | ${r.source} | ${r.raison} | |`);
});
L();

fs.writeFileSync(path.join(racine, "reports", "paliers-brouillon.md"), out.join("\n"));
console.log(out.slice(out.indexOf("## Synthèse par parcours"), out.indexOf("## Grille à valider (un palier par bloc)")).join("\n"));
console.log(`\nAlertes grille: ${alertes.length} · prérequis: ${prereqs.length} · écarts rôles: ${ecarts.length} · P2 sans pratique: ${nbSans2.length} · P4/P5: ${hors.length}`);
