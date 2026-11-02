import fs from "node:fs";
import path from "node:path";
import { DiagnosticSchema, type Diagnostic } from "./diagnostic-schema";

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "diagnostic.json");

/** Lit et valide content/diagnostic.json (serveur seulement : la logique de calcul est dans diagnostic-schema.ts). */
export function chargerDiagnostic(fichier = FICHIER): Diagnostic {
  const res = DiagnosticSchema.safeParse(JSON.parse(fs.readFileSync(fichier, "utf8")));
  if (!res.success) {
    const details = res.error.issues.map((i) => `  - ${i.path.join(".")} : ${i.message}`).join("\n");
    throw new Error(`Diagnostic invalide :\n${details}`);
  }
  return res.data;
}

/** Le diagnostic d'équipe n'apparaît dans la navigation (pied de page, Ressources) que lorsqu'il n'est plus un brouillon. */
export function diagnosticEquipeVisible(): boolean {
  // Même règle que BROUILLONS_VISIBLES (src/components/Draft.tsx) : visible en développement et en aperçu.
  return !chargerDiagnostic().brouillon || process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1";
}
