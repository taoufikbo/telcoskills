import Link from "next/link";
import { chargerMondes, partCloud, repartition, type Repartition } from "@/lib/mondes";
import { parcoursMetier } from "@/lib/rubriques";
import type { Roadmap } from "@/lib/schema";
import { urlRoadmap } from "@/lib/urls";

const COULEURS = { cloud: "var(--accent)", convergence: "color-mix(in srgb, var(--accent) 50%, var(--crit))", telecom: "var(--crit)" } as const;
const MONDES = ["cloud", "convergence", "telecom"] as const;
const LIBELLE = { cloud: "compétences cloud", convergence: "là où les deux se touchent", telecom: "compétences télécom" } as const;

/**
 * Où se situe chaque métier entre le cloud et le télécom : une barre par parcours, calculée sur les compétences des roadmaps
 * (classement des blocs : content/mondes.json). Du plus proche du cloud au plus proche du télécom ; chaque barre mène à son parcours.
 */
export default function ConvergenceMetiers({ roadmaps, these }: { roadmaps: Roadmap[]; these: string }) {
  const mondes = chargerMondes();
  const lignes = parcoursMetier(roadmaps)
    .map((r) => ({ r, rep: repartition(r, mondes) as Repartition }))
    .sort((a, b) => partCloud(b.rep) - partCloud(a.rep));
  return (
    <section aria-labelledby="titre-convergence" className="mx-auto max-w-6xl space-y-6 px-4 py-14 sm:px-6">
      <div className="max-w-3xl space-y-2">
        <h2 id="titre-convergence" className="text-2xl font-semibold sm:text-3xl">
          Où se situe chaque métier, entre le cloud et le télécom
        </h2>
        <p style={{ color: "var(--muted)" }}>{these}</p>
      </div>
      <div className="panneau space-y-3 p-4 sm:p-6">
        <div aria-hidden="true" className="hidden items-center gap-3 px-2 sm:flex">
          <span className="w-60 shrink-0" />
          <div className="flex-1">
            <div className="mono flex justify-between" style={{ fontSize: "0.75rem" }}>
              <span style={{ color: COULEURS.cloud }}>MONDE CLOUD</span>
              <span style={{ color: COULEURS.telecom }}>MONDE TÉLÉCOM</span>
            </div>
            <div className="mt-1 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${COULEURS.cloud}, ${COULEURS.convergence}, ${COULEURS.telecom})` }} />
          </div>
        </div>
        <ul className="space-y-2">
          {lignes.map(({ r, rep }) => {
            const total = rep.cloud + rep.convergence + rep.telecom;
            return (
              <li key={r.id}>
                <Link href={urlRoadmap(r.id)} className="flex flex-col gap-2 rounded-md border p-2 transition-colors hover:bg-[var(--surface-2)] sm:flex-row sm:items-center sm:gap-3" style={{ borderColor: "var(--filet)" }}>
                  <span className="block w-full sm:w-60 sm:shrink-0">
                    <span className="block text-sm font-medium leading-tight">{r.titre.split(" (")[0]}</span>
                    <span className="mono block" style={{ fontSize: "0.75rem" }}>
                      {r.noeuds.length} compétences dont {rep.transverse} transverses
                    </span>
                  </span>
                  <span
                    className="flex h-7 flex-1 gap-0.5"
                    role="img"
                    aria-label={`${r.titre} : ${MONDES.filter((k) => rep[k] > 0).map((k) => `${rep[k]} ${LIBELLE[k]}`).join(", ")}`}
                  >
                    {MONDES.filter((k) => rep[k] > 0).map((k) => (
                      <span key={k} className="mono flex min-w-1.5 items-center justify-center rounded-sm" style={{ flex: rep[k] / total, background: COULEURS[k], color: "var(--accent-fg)", fontSize: "0.75rem" }}>
                        {rep[k] / total > 0.07 ? rep[k] : ""}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mono flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: "0.75rem" }}>
          {MONDES.map((k) => (
            <span key={k}>
              <span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COULEURS[k] }} />
              {LIBELLE[k]}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
