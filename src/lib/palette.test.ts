import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Lit les jetons de couleur du thème public (src/app/theme-public.css) : un bloc clair, un bloc sombre qui le surcharge. */
function jetons(selecteur: string): Record<string, string> {
  const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "theme-public.css"), "utf8");
  const debut = css.indexOf(`${selecteur} {`);
  if (debut === -1) throw new Error(`Bloc introuvable : ${selecteur}`);
  const bloc = css.slice(debut, css.indexOf("\n}", debut));
  return Object.fromEntries([...bloc.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (haut + 0.05) / (bas + 0.05);
};

const clair = jetons('html[data-instance="public"]');
const sombre = { ...clair, ...jetons('html[data-instance="public"].dark') };

/** Texte (WCAG AA : 4,5) puis éléments d'interface (WCAG 1.4.11 : 3). */
const TEXTES: [string, string][] = [
  ["fg", "bg"], ["fg", "surface"], ["fg", "surface-2"],
  ["muted", "bg"], ["muted", "surface"], ["muted", "surface-2"],
  ["accent", "bg"], ["accent", "surface"],
  ["accent-fg", "accent"],
  ["ok", "bg"], ["ok", "surface"],
  ["crit", "bg"], ["crit", "surface"],
];
const INTERFACE: [string, string][] = [["bord", "bg"], ["bord", "surface"]];

describe.each([
  ["clair", clair],
  ["sombre", sombre],
])("thème public, mode %s", (_nom, p) => {
  it.each(TEXTES)("texte : %s sur %s atteint 4,5 : 1", (avant, arriere) => {
    expect(contraste(p[avant], p[arriere]), `${avant} ${p[avant]} sur ${arriere} ${p[arriere]}`).toBeGreaterThanOrEqual(4.5);
  });
  it.each(INTERFACE)("interface : %s sur %s atteint 3 : 1", (avant, arriere) => {
    expect(contraste(p[avant], p[arriere]), `${avant} ${p[avant]} sur ${arriere} ${p[arriere]}`).toBeGreaterThanOrEqual(3);
  });
});
