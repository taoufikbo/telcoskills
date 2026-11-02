import Draft, { BROUILLONS_VISIBLES } from "@/components/Draft";
import { LienSuivi } from "@/produits/mesure";
import { INSTANCE } from "@/lib/instance";

/**
 * Abonnement à la newsletter : une seule promesse, un seul bouton, jamais de fenêtre qui s'ouvre toute seule.
 * Sans URL renseignée (instance.newsletterUrl), rien n'est affiché en production.
 */
export default function Subscribe({ contexte = "accueil" }: { contexte?: "accueil" | "analyse" | "roadmap" | "export" }) {
  const url = INSTANCE.newsletterUrl;
  if (!url && !BROUILLONS_VISIBLES) return null;
  return (
    <section aria-labelledby={`titre-abonnement-${contexte}`} className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="panneau flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 id={`titre-abonnement-${contexte}`} className="text-xl font-semibold">
            Recevoir les nouvelles roadmaps et analyses
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Un message quand une roadmap ou une analyse paraît. Désabonnement en un clic.
          </p>
        </div>
        {url ? (
          <LienSuivi href={url} externe evenement="abonnement" donnees={{ contexte }} className="btn btn-primary shrink-0">
            S&apos;abonner
          </LienSuivi>
        ) : (
          <Draft titre="URL d'abonnement (instance.newsletterUrl dans src/lib/instance.ts)" />
        )}
      </div>
    </section>
  );
}
