import { explicationProvenance, libelleProvenance } from "@/lib/provenance";
import type { Roadmap } from "@/lib/schema";

/** Origine de la roadmap, rendue côté serveur : badge, explication courte et source complète. */
export default function BadgeProvenance({ roadmap }: { roadmap: Roadmap }) {
  return (
    <div className="mt-1 text-sm">
      <details>
        <summary className="cursor-pointer">
          <span className="border border-black px-2 py-0.5 text-xs font-semibold dark:border-white">{libelleProvenance(roadmap.provenance)}</span>
        </summary>
        <p className="mt-2 max-w-3xl text-slate-700 dark:text-slate-300">{explicationProvenance(roadmap.provenance)}</p>
        <p className="mt-1 max-w-3xl text-xs text-slate-600 dark:text-slate-400">Source : {roadmap.source}</p>
      </details>
    </div>
  );
}
