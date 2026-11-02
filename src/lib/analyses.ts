import fs from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";
import { BROUILLONS_VISIBLES } from "@/components/Draft";

export type MetaAnalyse = { titre: string; description: string; brouillon?: boolean; date?: string };
export type Analyse = { slug: string; meta: MetaAnalyse; Contenu: ComponentType };

const DOSSIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "analyses");

export const slugsAnalyses = (): string[] =>
  fs.existsSync(DOSSIER) ? fs.readdirSync(DOSSIER).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, "")).sort() : [];

export async function chargerAnalyse(slug: string): Promise<Analyse | null> {
  if (!slugsAnalyses().includes(slug)) return null;
  const mod = (await import(`../../content/analyses/${slug}.mdx`)) as { default: ComponentType; metadata: MetaAnalyse };
  return { slug, meta: mod.metadata, Contenu: mod.default };
}

/** Une analyse en brouillon n'est publiée qu'avec les brouillons visibles (développement, aperçus). */
export const estPubliee = (a: Analyse) => !a.meta.brouillon || BROUILLONS_VISIBLES;

export async function analysesPubliees(): Promise<Analyse[]> {
  const toutes = await Promise.all(slugsAnalyses().map(chargerAnalyse));
  return toutes.filter((a): a is Analyse => a !== null && estPubliee(a)).sort((a, b) => (b.meta.date ?? "").localeCompare(a.meta.date ?? ""));
}
