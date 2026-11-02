import type { EtatPratique } from "@/produits/progression";
import { ajouterJours, jourLocal } from "./jour";

/** Échappement des valeurs de texte iCalendar (RFC 5545 §3.3.11). */
const echapper = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Plie une ligne à 75 octets au plus (RFC 5545 §3.1), sans couper un caractère UTF-8. */
function plier(ligne: string): string {
  const enc = new TextEncoder();
  if (enc.encode(ligne).length <= 75) return ligne;
  const morceaux: string[] = [];
  let courant = "";
  let octets = 0;
  let limite = 75;
  for (const c of ligne) {
    const n = enc.encode(c).length;
    if (octets + n > limite) {
      morceaux.push(courant);
      courant = "";
      octets = 0;
      limite = 74; // les lignes de continuation commencent par une espace
    }
    courant += c;
    octets += n;
  }
  morceaux.push(courant);
  return morceaux.join("\r\n ");
}

const compact = (j: string) => j.replaceAll("-", "");
const horodatage = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * Fichier .ics des prochaines révisions : un événement « journée entière » par compétence acquise, sans serveur.
 * L'identifiant (UID) est stable par compétence : réimporter un export plus récent **met à jour** l'événement au lieu d'en ajouter un.
 * Une révision en retard est placée aujourd'hui.
 */
export function genererIcs(etat: EtatPratique, titres: Map<string, string>, now: Date, urlRevision: string): string {
  const aujourdhui = jourLocal(now);
  const sequence = Math.floor(now.getTime() / 86_400_000);
  const evenements = Object.entries(etat.noeuds)
    .filter(([, n]) => n.boite && n.echeance)
    .sort(([a, x], [b, y]) => x.echeance!.localeCompare(y.echeance!) || a.localeCompare(b))
    .map(([id, n]) => {
      const debut = n.echeance! < aujourdhui ? aujourdhui : n.echeance!;
      return [
        "BEGIN:VEVENT",
        `UID:revision-${id}@telcocloud-roadmaps`,
        `DTSTAMP:${horodatage(now)}`,
        `SEQUENCE:${sequence}`,
        `DTSTART;VALUE=DATE:${compact(debut)}`,
        `DTEND;VALUE=DATE:${compact(ajouterJours(debut, 1))}`,
        `SUMMARY:${echapper(`Réviser : ${titres.get(id) ?? id}`)}`,
        `DESCRIPTION:${echapper(`Révision espacée (boîte ${n.boite} sur 4). Ouvrez la session du jour : ${urlRevision}`)}`,
        `URL:${urlRevision}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      ];
    });
  const lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TelcoCloud Roadmaps//Revisions//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${echapper("Révisions TelcoCloud")}`, ...evenements.flat(), "END:VCALENDAR"];
  return lignes.map(plier).join("\r\n") + "\r\n";
}
