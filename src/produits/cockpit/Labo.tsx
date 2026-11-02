"use client";

import { useMemo, useState } from "react";
import type { Orientation } from "@/lib/orientation-schema";
import type { Roadmap } from "@/lib/schema";
import { compter, etatVide, enregistrerRappel, marquerVu, suiviNoeud, vueProgression } from "@/produits/progression";
import Cockpit from "./Cockpit";
import Programme from "./Programme";
import { calculerCockpit, calculerProgramme, placerSemaines } from "./calcul";

/** Page d'essai : progression fixe (1re compétence acquise, 2e vue, 3e à revoir), date fixe, rythme et événements d'essai. */
export default function LaboCockpit({ roadmap, parNiveau }: { roadmap: Roadmap; parNiveau: Orientation["duree_par_niveau_heures"] }) {
  const [rythme, setRythme] = useState(4);
  const [evenement, setEvenement] = useState("Aucun événement.");
  const [avecObjectif, setAvecObjectif] = useState(true);
  const now = useMemo(() => new Date("2026-11-02T12:00:00"), []);
  const [a, b, c] = roadmap.noeuds;
  const cible = roadmap.noeuds.find((n) => n.prerequis.length > 1) ?? roadmap.noeuds.at(-1)!;

  const etat = useMemo(() => {
    let e = marquerVu(enregistrerRappel(etatVide(now), a.id, true, now), b.id, now);
    e = enregistrerRappel(e, c.id, true, now);
    return enregistrerRappel(e, c.id, false, now);
  }, [a.id, b.id, c.id, now]);

  const donnees = useMemo(
    () =>
      calculerCockpit({
        roadmap,
        parNiveau,
        rythme,
        now,
        decompte: compter(etat, roadmap.id, roadmap.noeuds, now),
        suivi: (id) => suiviNoeud(etat, roadmap.id, id, now),
        echeances: [c.id],
        cibleId: avecObjectif ? cible.id : null,
        progression: vueProgression(etat, roadmap, now),
      }),
    [roadmap, parNiveau, rythme, now, etat, c.id, cible.id, avecObjectif],
  );
  const programmeVierge = useMemo(() => placerSemaines(calculerProgramme(roadmap, parNiveau), rythme), [roadmap, parNiveau, rythme]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Cockpit</h1>
      <p className="mono">Progression d&apos;essai : 1re compétence acquise, 2e vue, 3e à revoir (révision due). Date fixée au 2 novembre 2026.</p>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={avecObjectif} onChange={(e) => setAvecObjectif(e.target.checked)} /> Un objectif est choisi
      </label>
      <p className="mono" aria-live="polite" data-evenements>
        {evenement}
      </p>
      <div className="border" style={{ borderColor: "var(--filet)" }}>
        <Cockpit donnees={donnees} titre={roadmap.titre} parNiveau={parNiveau} onOuvrir={(id) => setEvenement(`ouvrir « ${id} »`)} onRythme={setRythme} onObjectif={(id) => setEvenement(`objectif ${id ?? "à choisir"}`)} aide />
      </div>
      <h2 className="text-xl font-semibold">Programme suivi</h2>
      <Programme programme={donnees.programme} parNiveau={parNiveau} suivi onOuvrir={(id) => setEvenement(`ouvrir « ${id} »`)} />
      <h2 className="text-xl font-semibold">Programme avant tout départ (résultat du diagnostic)</h2>
      <Programme programme={programmeVierge} parNiveau={parNiveau} href={(id) => `/ressources/roadmaps/${roadmap.id}/${id}`} />
    </section>
  );
}
