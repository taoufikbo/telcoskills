import fs from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const racine = path.resolve(__dirname, "..", "..");
const produits = fs
  .readdirSync(path.join(racine, "src", "produits"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe("produits : convention", () => {
  it.each(produits)("%s a une entrée publique, des tests et une page d'essai", (nom) => {
    const dossier = path.join(racine, "src", "produits", nom);
    expect(fs.existsSync(path.join(dossier, "index.ts"))).toBe(true);
    expect(fs.readdirSync(dossier).some((f) => f.endsWith(".test.ts"))).toBe(true);
    expect(fs.existsSync(path.join(racine, "src", "app", "labo", nom, "page.tsx"))).toBe(true);
  });
});

describe("produits : frontière vérifiée par le linter", () => {
  const eslint = new ESLint({ cwd: racine });
  const erreurs = async (fichier: string, code: string) => {
    const [res] = await eslint.lintText(code, { filePath: path.join(racine, fichier) });
    return res.messages.filter((m) => m.ruleId === "no-restricted-imports").length;
  };

  it("refuse l'import d'un fichier interne depuis l'extérieur", async () => {
    expect(await erreurs("src/components/Essai.tsx", 'import { lireEtat } from "@/produits/progression/etat";\nexport const x = lireEtat;\n')).toBe(1);
  });
  it("accepte l'entrée publique", async () => {
    expect(await erreurs("src/components/Essai.tsx", 'import { lireEtat } from "@/produits/progression";\nexport const x = lireEtat;\n')).toBe(0);
  });
  it("refuse qu'un produit remonte vers un autre dossier par chemin relatif", async () => {
    expect(await erreurs("src/produits/progression/essai.ts", 'import { x } from "../visiteur/etat";\nexport const y = x;\n')).toBe(1);
  });
  it("accepte les imports relatifs internes au produit", async () => {
    expect(await erreurs("src/produits/progression/essai.ts", 'import { lireEtat } from "./etat";\nexport const y = lireEtat;\n')).toBe(0);
  });
  it("interdit à une visualisation de lire la progression ou le stockage elle-même", async () => {
    const fichier = "src/produits/carte-heros/essai.tsx";
    expect(await erreurs(fichier, 'import { usePratique } from "@/produits/progression";\nexport const x = usePratique;\n')).toBe(1);
    expect(await erreurs(fichier, 'import type { Progression } from "@/produits/progression";\nexport type X = Progression;\n')).toBe(0);
    const [res] = await eslint.lintText("export const x = () => localStorage.getItem('a');\n", { filePath: path.join(racine, fichier) });
    expect(res.messages.filter((m) => m.ruleId === "no-restricted-globals")).toHaveLength(1);
  });
}, 60_000);
