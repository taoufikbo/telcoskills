"use client";

import { useEffect, useState } from "react";
import type { Orientation } from "@/lib/orientation-schema";
import type { DonneesProgramme as Donnees } from "@/produits/cockpit";
import { Programme, Rythme, placerSemaines, projeter } from "@/produits/cockpit";
import { urlNoeud } from "@/lib/urls";
import { useRythme } from "@/produits/progression";

type Avec = Donnees & { titre: string };
let promesse: Promise<Record<string, Avec>> | null = null;
/** Une seule requête par page. */
const charger = () => (promesse ??= fetch("/programmes.json").then((r) => (r.ok ? r.json() : {})));

/**
 * Raccord de page (pas un produit) : le programme du parcours recommandé, avec le rythme mémorisé par le produit Progression.
 * Se masque tant que les données ne sont pas là (hors ligne : le résultat du diagnostic reste complet sans lui).
 */
export default function ProgrammeChoisi({ roadmapId, parNiveau }: { roadmapId: string; parNiveau: Orientation["duree_par_niveau_heures"] }) {
  const [programmes, setProgrammes] = useState<Record<string, Avec> | null>(null);
  const { rythme, definir } = useRythme();
  useEffect(() => {
    let actif = true;
    charger()
      .then((p) => actif && setProgrammes(p))
      .catch(() => {
        // hors ligne : le bloc reste masqué
      });
    return () => {
      actif = false;
    };
  }, []);
  const base = programmes?.[roadmapId];
  if (!base) return null;
  const programme = placerSemaines(base, rythme);
  return (
    <div className="space-y-4">
      <Programme programme={programme} parNiveau={parNiveau} href={(id) => urlNoeud(roadmapId, id)} />
      <Rythme rythme={rythme} onChange={definir} projection={projeter(programme.restantes, rythme, new Date())} />
    </div>
  );
}
