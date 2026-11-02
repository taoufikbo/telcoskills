// Vérifie que les liens du contenu répondent : roadmaps (ressources) et catalogue d'apprentissage.
// Usage : node scripts/verifier-liens.mjs [--sans-youtube]
//   - Les playlists YouTube sont contrôlées par oEmbed (200 = playlist publique existante).
//   - 202 / 403 / 429 : le site bloque les robots, le lien est à vérifier à la main (non compté comme cassé).
//   - 404, 410, erreur réseau : lien cassé, code de sortie 1.
import fs from "node:fs";
import path from "node:path";

const racine = path.resolve(import.meta.dirname, "..");
const sansYoutube = process.argv.includes("--sans-youtube");

const liens = new Map(); // url -> contexte
const ajouter = (url, contexte) => url && !liens.has(url) && liens.set(url, contexte);

for (const f of fs.readdirSync(path.join(racine, "content", "roadmaps"))) {
  const r = JSON.parse(fs.readFileSync(path.join(racine, "content", "roadmaps", f), "utf8"));
  for (const n of r.noeuds) for (const x of n.ressources) ajouter(x.url, `${r.id}/${n.id}`);
}
const catalogue = path.join(racine, "content", "ressources", "apprentissage.json");
if (fs.existsSync(catalogue)) for (const x of JSON.parse(fs.readFileSync(catalogue, "utf8")).ressources) ajouter(x.url, x.noeuds.join(","));

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
/** Trois essais : un délai de connexion ponctuel ne doit pas faire passer un lien pour cassé. */
async function recuperer(url) {
  for (let essai = 1; ; essai++) {
    try {
      return await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000), headers: { "user-agent": "Mozilla/5.0 (verifier-liens)" } });
    } catch (e) {
      if (essai === 3) throw e;
      await dormir(2000 * essai);
    }
  }
}
const resultats = { ok: 0, aVerifier: [], casses: [] };

for (const [url, contexte] of liens) {
  const youtube = url.includes("youtube.com/playlist");
  if (youtube && sansYoutube) continue;
  try {
    const cible = youtube ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json` : url;
    const r = await recuperer(cible);
    if (r.status === 200) resultats.ok++;
    else if ([202, 403, 429].includes(r.status)) resultats.aVerifier.push(`${r.status} ${url} (${contexte})`);
    else resultats.casses.push(`${r.status} ${url} (${contexte})`);
  } catch (e) {
    resultats.casses.push(`${e.cause?.code ?? e.message} ${url} (${contexte})`);
  }
  if (youtube) await dormir(300);
}

console.log(`${resultats.ok} liens OK sur ${liens.size}`);
if (resultats.aVerifier.length) console.log(`À vérifier à la main (le site bloque les robots) :\n- ${resultats.aVerifier.join("\n- ")}`);
if (resultats.casses.length) console.log(`CASSÉS :\n- ${resultats.casses.join("\n- ")}`);
process.exit(resultats.casses.length ? 1 : 0);
