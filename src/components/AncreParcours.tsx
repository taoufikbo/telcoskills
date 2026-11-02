import Link from "next/link";
import { prochaineEtape, type RoadmapLegere } from "@/lib/objectif";
import { urlProjet } from "@/lib/urls";
import type { Decompte, Progression } from "@/produits/progression";

function Barre({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <div role="progressbar" aria-label={libelle} aria-valuemin={0} aria-valuemax={100} aria-valuenow={valeur} className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--filet)" }}>
      <div className="h-full rounded-full" style={{ width: `${valeur}%`, background: "var(--fg)" }} />
    </div>
  );
}

/**
 * La barre d'ancrage d'une roadmap : où j'en suis, et **une** action. Elle remplace le bloc « Commencer ici »
 * et la barre « Ma progression », qui disaient la même chose à deux endroits.
 */
export default function AncreParcours({
  roadmap,
  progression,
  decompte,
  monParcours,
  dues,
  projetId,
  aide,
  onOuvrir,
}: {
  roadmap: RoadmapLegere & { titre: string };
  progression: Progression;
  decompte: Decompte;
  monParcours: boolean;
  /** Révisions dues aujourd'hui (toutes roadmaps) : si > 0, c'est l'action principale. */
  dues: number;
  projetId?: string;
  /** Vrai pour un visiteur sans progression ni diagnostic : affiche le mode d'emploi et le lien vers le diagnostic. */
  aide: boolean;
  onOuvrir: (id: string) => void;
}) {
  const suite = prochaineEtape(roadmap, progression);
  const lien = "underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]";
  const etiquette = suite.type === "debut" ? "Commencer ici" : suite.type === "termine" ? "Parcours terminé" : suite.enCours ? "Reprendre ici" : "Prochaine étape";

  return (
    <section aria-label="Mon avancement" className="border-b px-4 py-2" style={{ borderColor: "var(--filet)", background: "var(--surface)" }}>
      {/* Une seule ligne : la carte doit occuper le premier écran (spécification §3). */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <p className="whitespace-nowrap text-sm">
            <span className="mono mr-2">{monParcours ? "Mon parcours" : "Avancement"}</span>
            <strong className="font-semibold">
              {decompte.acquis}/{decompte.actifs}
            </strong>{" "}
            acquis (testé){decompte.aRevoir > 0 && ` · dont ${decompte.aRevoir} à revoir`}
          </p>
          <div className="w-24 shrink-0">
            <Barre valeur={decompte.pourcentage} libelle="Compétences acquises par un test" />
          </div>
        </div>
        <div className="min-w-[12rem] flex-1 text-sm">
          {suite.noeud ? (
            <p>
              <span className="mono mr-2">{etiquette}</span>
              <strong className="font-semibold">{suite.noeud.titre}</strong>
            </p>
          ) : (
            <p>
              <span className="mono mr-2">{etiquette}</span>
              {projetId && (
                <Link href={urlProjet(projetId)} className={lien}>
                  Voyez ces compétences à l&apos;œuvre dans le projet fil rouge
                </Link>
              )}
            </p>
          )}
        </div>
        {suite.noeud && (
          <button type="button" className={dues > 0 ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"} onClick={() => onOuvrir(suite.noeud!.id)}>
            Ouvrir →
          </button>
        )}
      </div>
      {aide && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
          Ouvrez une compétence et marquez-la « vue » ; elle devient « acquise (testé) » quand vous réussissez le rappel. Le suivi reste dans ce navigateur, sans compte.{" "}
          <Link href="/#diagnostic" className={lien}>
            Pas sûr de ce parcours ? Choisir son parcours en trois questions
          </Link>
        </p>
      )}
    </section>
  );
}
