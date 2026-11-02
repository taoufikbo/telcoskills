// Audit du contenu : produit reports/content-audit.md. Lecture seule, aucun fichier du site n'est modifié.
// Usage : node scripts/audit-content.ts [--sans-reseau] [--employeur=Nom] [--concurrence=8]
//   (Node 24+ exécute le TypeScript directement ; pas de dépendance.)
import fs from "node:fs";
import path from "node:path";

type Ressource = { type: string; nom: string; url?: string; acces?: string; langue?: string; auteur?: string };
type Noeud = { id: string; titre: string; bloc: string; niveau: string; prerequis: string[]; resume: string; ressources: Ressource[] };
type Roadmap = { id: string; titre: string; presentation?: string; source?: string; noeuds: Noeud[] };
type Entree = Ressource & { noeuds: string[] };

const racine = path.resolve(import.meta.dirname, "..");
const arg = (nom: string) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.split("=")[1];
const sansReseau = process.argv.includes("--sans-reseau");
const employeur = arg("employeur");
const concurrence = Number(arg("concurrence") ?? 8);

const lire = <T>(...chemin: string[]): T => JSON.parse(fs.readFileSync(path.join(racine, ...chemin), "utf8"));
const roadmaps: Roadmap[] = fs
  .readdirSync(path.join(racine, "content", "roadmaps"))
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => lire<Roadmap>("content", "roadmaps", f));
const fichierCatalogue = path.join(racine, "content", "ressources", "apprentissage.json");
const catalogue: Entree[] = fs.existsSync(fichierCatalogue) ? lire<{ ressources: Entree[] }>("content", "ressources", "apprentissage.json").ressources : [];

/** Ressources d'un nœud : celles de la roadmap, plus le catalogue d'apprentissage (partagé par identifiant de nœud), sans doublon d'URL. */
function ressourcesFusionnees(n: Noeud): Ressource[] {
  const vues = new Set(n.ressources.map((r) => r.url).filter(Boolean));
  const ajouts = catalogue.filter((e) => e.noeuds.includes(n.id) && !vues.has(e.url));
  return [...n.ressources, ...ajouts];
}

const sections: string[] = [];
const titre = (t: string) => sections.push(`\n## ${t}\n`);
const ligne = (t = "") => sections.push(t);

// --- Chiffres généraux
const tousNoeuds = roadmaps.flatMap((r) => r.noeuds.map((n) => ({ r, n, res: ressourcesFusionnees(n) })));
const idsUniques = new Set(tousNoeuds.map((x) => x.n.id));

// --- 1. Ressources sans URL
titre("1. Ressources sans URL");
const sansUrl = tousNoeuds.flatMap(({ r, n, res }) => res.filter((x) => !x.url).map((x) => ({ roadmap: r.id, noeud: n.id, nom: x.nom, type: x.type })));
ligne(`Total : **${sansUrl.length}** ressource(s) sans lien, sur ${tousNoeuds.reduce((s, x) => s + x.res.length, 0)} ressources.\n`);
ligne("| Roadmap | Ressources sans URL |\n|---|---|");
for (const r of roadmaps) ligne(`| ${r.id} | ${sansUrl.filter((x) => x.roadmap === r.id).length} |`);
ligne("\nListe :\n");
for (const x of sansUrl) ligne(`- \`${x.roadmap}/${x.noeud}\` (${x.type}) : ${x.nom}`);

// --- 2. URL en erreur
titre("2. URL en erreur");
type Verdict = "ok" | "robots" | "casse";
const urls = new Map<string, string[]>();
for (const { r, n, res } of tousNoeuds) for (const x of res) if (x.url) urls.set(x.url, [...(urls.get(x.url) ?? []), `${r.id}/${n.id}`]);
if (sansReseau) {
  ligne(`Contrôle réseau ignoré (\`--sans-reseau\`). ${urls.size} URL distinctes à contrôler.`);
} else {
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function controler(url: string): Promise<{ verdict: Verdict; detail: string }> {
    const youtube = url.includes("youtube.com/playlist");
    const cible = youtube ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json` : url;
    for (let essai = 1; essai <= 2; essai++) {
      for (const methode of youtube ? ["GET"] : ["HEAD", "GET"]) {
        try {
          const rep = await fetch(cible, { method: methode, redirect: "follow", signal: AbortSignal.timeout(10_000), headers: { "user-agent": "Mozilla/5.0 (audit-content)" } });
          if (rep.status < 400) return { verdict: "ok", detail: String(rep.status) };
          if ([202, 403, 429].includes(rep.status)) return { verdict: "robots", detail: String(rep.status) };
          if (methode === "HEAD") continue; // beaucoup de serveurs répondent mal à HEAD : on confirme par GET
          return { verdict: "casse", detail: String(rep.status) };
        } catch (e) {
          if (methode === "GET" && essai === 2) return { verdict: "casse", detail: e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : "erreur réseau" };
        }
      }
      await dormir(1500);
    }
    return { verdict: "casse", detail: "échec" };
  }
  const file = [...urls.keys()];
  const resultats = new Map<string, { verdict: Verdict; detail: string }>();
  await Promise.all(
    Array.from({ length: Math.max(1, concurrence) }, async () => {
      while (file.length > 0) {
        const url = file.shift()!;
        resultats.set(url, await controler(url));
      }
    }),
  );
  const casses = [...resultats].filter(([, v]) => v.verdict === "casse");
  const robots = [...resultats].filter(([, v]) => v.verdict === "robots");
  ligne(`${urls.size} URL distinctes : **${[...resultats.values()].filter((v) => v.verdict === "ok").length} répondent**, **${casses.length} en erreur**, ${robots.length} bloquent les robots (à vérifier à la main).\n`);
  ligne("### En erreur\n");
  if (casses.length === 0) ligne("Aucune.");
  for (const [url, v] of casses) ligne(`- ${url} (${v.detail}) : ${urls.get(url)!.join(", ")}`);
  ligne("\n### Bloquent les robots (202 / 403 / 429)\n");
  if (robots.length === 0) ligne("Aucune.");
  for (const [url, v] of robots) ligne(`- ${url} (${v.detail}) : ${urls.get(url)!.join(", ")}`);
}

// --- 3. Nœuds de moins de 2 ressources
titre("3. Nœuds de moins de 2 ressources");
const maigres = tousNoeuds.filter((x) => x.res.length < 2);
ligne(`**${maigres.length}** nœud(s) sur ${tousNoeuds.length} (ressources de la roadmap et cursus fusionnés).\n`);
ligne("| Roadmap | Bloc | Nœud | Ressources |\n|---|---|---|---|");
for (const { r, n, res } of maigres) ligne(`| ${r.id} | ${n.bloc} | \`${n.id}\` | ${res.length} |`);

// --- 4. Mots suspects de confidentialité
titre("4. Mots suspects de confidentialité");
const mots = ["équipe", "interne", "notre", "nos", "client", ...(employeur ? [employeur.toLowerCase()] : [])];
ligne(`Mots recherchés : ${mots.map((m) => `\`${m}\``).join(", ")}. Un « équipe » peut être légitime (équipe d'exploitation) ; chaque occurrence est à relire.\n`);
const motRe = new RegExp(`(?<![\\p{L}])(${mots.join("|")})s?(?![\\p{L}])`, "iu");
function parcourir(valeur: unknown, chemin: string, fichier: string, sortie: { fichier: string; chemin: string; mot: string; extrait: string }[]) {
  if (typeof valeur === "string") {
    const m = valeur.match(motRe);
    if (m) sortie.push({ fichier, chemin, mot: m[1].toLowerCase(), extrait: valeur.length > 150 ? `${valeur.slice(Math.max(0, m.index! - 50), m.index! + 90)}…` : valeur });
  } else if (Array.isArray(valeur)) valeur.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, fichier, sortie));
  else if (valeur && typeof valeur === "object") for (const [k, v] of Object.entries(valeur)) if (k !== "url") parcourir(v, chemin ? `${chemin}.${k}` : k, fichier, sortie);
}
const trouves: { fichier: string; chemin: string; mot: string; extrait: string }[] = [];
const dossiers = ["roadmaps", "projets", "ressources"];
for (const d of dossiers) for (const f of fs.readdirSync(path.join(racine, "content", d)).filter((x) => x.endsWith(".json"))) parcourir(lire("content", d, f), "", `content/${d}/${f}`, trouves);
for (const f of ["orientation.json", "chaine-projet.json"]) if (fs.existsSync(path.join(racine, "content", f))) parcourir(lire("content", f), "", `content/${f}`, trouves);
const parMot = new Map<string, number>();
for (const t of trouves) parMot.set(t.mot, (parMot.get(t.mot) ?? 0) + 1);
ligne(`**${trouves.length}** occurrence(s) dans les données : ${[...parMot].map(([m, n]) => `${m} ×${n}`).join(", ") || "aucune"}.\n`);
const motsFortsRe = /(?<![\p{L}])(notre|nos|interne|internes)(?![\p{L}])/iu;
const forts = trouves.filter((t) => motsFortsRe.test(t.extrait) || (employeur && t.mot === employeur.toLowerCase()));
ligne("### À traiter en priorité (« notre », « nos », « interne »" + (employeur ? `, « ${employeur} »` : "") + ")\n");
if (forts.length === 0) ligne("Aucune.");
for (const t of forts) ligne(`- \`${t.fichier}\` ${t.chemin} : « ${t.extrait} »`);
ligne("\n### Autres occurrences (« équipe », « client »)\n");
for (const t of trouves.filter((x) => !forts.includes(x))) ligne(`- \`${t.fichier}\` ${t.chemin} : « ${t.extrait} »`);
// Textes en dur dans l'interface
ligne("\n### Textes en dur dans l'interface (src/)\n");
const dansSrc: string[] = [];
const reSrc = new RegExp(`(?<![\\p{L}])(notre|nos|interne|équipe de|${employeur ? employeur.toLowerCase() + "|" : ""}orange)(?![\\p{L}])`, "iu");
function lireSrc(dossier: string) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) lireSrc(p);
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\./.test(e.name))
      fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(l) || !/["'`>]/.test(l)) return;
        if (/(bg|text|border|ring|fill|stroke|decoration|from|to|via)-orange|--color-orange|#ff7900/i.test(l) && !/>[^<]*orange/i.test(l)) return; // couleur, pas du texte
        if (reSrc.test(l)) dansSrc.push(`- \`${path.relative(racine, p).replaceAll("\\", "/")}:${i + 1}\` : ${l.trim().slice(0, 140)}`);
      });
  }
}
lireSrc(path.join(racine, "src"));
for (const l of dansSrc.slice(0, 60)) ligne(l);
if (dansSrc.length > 60) ligne(`… et ${dansSrc.length - 60} autre(s).`);
if (dansSrc.length === 0) ligne("Aucune.");

// --- 5. Prérequis orphelins
titre("5. Prérequis orphelins");
const orphelins = roadmaps.flatMap((r) => {
  const ids = new Set(r.noeuds.map((n) => n.id));
  return r.noeuds.flatMap((n) => n.prerequis.filter((p) => !ids.has(p)).map((p) => `\`${r.id}/${n.id}\` → prérequis inconnu \`${p}\``));
});
ligne(orphelins.length === 0 ? "Aucun (la validation au build l'impose déjà)." : orphelins.map((o) => `- ${o}`).join("\n"));

// --- 6. Doublons de nœuds entre roadmaps
titre("6. Nœuds partagés ou dupliqués entre roadmaps");
const parId = new Map<string, { r: string; n: Noeud }[]>();
for (const { r, n } of tousNoeuds) parId.set(n.id, [...(parId.get(n.id) ?? []), { r: r.id, n }]);
const partages = [...parId].filter(([, v]) => v.length > 1);
ligne(`**${idsUniques.size}** identifiants distincts pour ${tousNoeuds.length} nœuds ; **${partages.length}** partagés entre plusieurs roadmaps.\n`);
const divergents = partages.filter(([, v]) => new Set(v.map((x) => x.n.resume)).size > 1 || new Set(v.map((x) => x.n.titre)).size > 1);
ligne(`Dont **${divergents.length}** avec un titre ou un résumé qui diverge d'une roadmap à l'autre (risque d'incohérence) :\n`);
for (const [id, v] of divergents) ligne(`- \`${id}\` : ${v.map((x) => x.r).join(", ")}`);
const parTitre = new Map<string, Set<string>>();
for (const { n } of tousNoeuds) parTitre.set(n.titre.toLowerCase(), new Set([...(parTitre.get(n.titre.toLowerCase()) ?? []), n.id]));
const memeTitre = [...parTitre].filter(([, ids]) => ids.size > 1);
ligne("\nMême titre sous des identifiants différents :\n");
if (memeTitre.length === 0) ligne("Aucun.");
for (const [t, ids] of memeTitre) ligne(`- « ${t} » : ${[...ids].map((i) => `\`${i}\``).join(", ")}`);

// --- 7. Nœuds cités par le prompt de refonte
titre("7. Nœuds visés par la refonte");
const cibles = ["dimensionnement", "matrice-exigences", "ha-geo", "evaluation-fournisseurs", "cout-energie", "cycle-vie-plateforme", "gitops", "ztp"];
ligne("| Nœud | Présent dans | Ressources (fusionnées) |\n|---|---|---|");
for (const c of cibles) {
  const v = tousNoeuds.filter((x) => x.n.id === c);
  ligne(`| \`${c}\` | ${v.length ? v.map((x) => x.r.id).join(", ") : "**absent**"} | ${v.length ? v.map((x) => x.res.length).join(", ") : "-"} |`);
}

const entete = `# Audit du contenu\n\nGénéré par \`scripts/audit-content.ts\`${sansReseau ? " (sans contrôle réseau)" : ""}${employeur ? `, employeur recherché : ${employeur}` : ""}.\n\n- ${roadmaps.length} roadmaps, ${tousNoeuds.length} nœuds (${idsUniques.size} identifiants distincts)\n- ${catalogue.length} entrées dans le catalogue d'apprentissage`;
fs.mkdirSync(path.join(racine, "reports"), { recursive: true });
fs.writeFileSync(path.join(racine, "reports", "content-audit.md"), `${entete}\n${sections.join("\n")}\n`);
console.log(`reports/content-audit.md écrit (${urls.size} URL, ${tousNoeuds.length} nœuds)`);
