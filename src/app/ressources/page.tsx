import type { Metadata } from "next";
import Link from "next/link";
import { diagnosticEquipeVisible } from "@/lib/diagnostic";
import { exigerRefonte } from "@/lib/refonte";
import { BASE_PROJET, BASE_ROADMAPS } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Ressources",
  description: "Ressources gratuites : roadmaps de compétences, projet fil rouge et landscape des outils, du serveur nu à la production.",
};

const RESSOURCES = [
  { href: BASE_ROADMAPS, titre: "Roadmaps", texte: "Un parcours par métier, avec prérequis, ressources et suivi de progression." },
  { href: BASE_PROJET, titre: "Projet fil rouge", texte: "Un déploiement de bout en bout, avec les rôles et les compétences à chaque phase." },
  { href: "/ressources/landscape", titre: "Landscape", texte: "Les outils d'une pile cloud télécom, par fonction et par rôle, reliés aux compétences qui les enseignent." },
  { href: "/diagnostic", titre: "Diagnostic d'équipe", texte: "Douze questions pour situer la maturité d'une équipe plateforme télécom." },
] as const;

export default function Ressources() {
  exigerRefonte();
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-14 sm:px-6 sm:py-20">
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold sm:text-5xl">Ressources</h1>
        <p className="max-w-2xl text-lg" style={{ color: "var(--muted)" }}>
          Des ressources gratuites pour monter en compétence sur le cloud télécom.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {RESSOURCES.filter((r) => r.href !== "/diagnostic" || diagnosticEquipeVisible()).map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="panneau flex h-full flex-col gap-2 p-6">
              <h2 className="text-xl font-semibold">{r.titre}</h2>
              <p style={{ color: "var(--muted)" }}>{r.texte}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
