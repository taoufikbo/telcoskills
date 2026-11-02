import { ImageResponse } from "next/og";
import { INSTANCE } from "./instance";

export const TAILLE_OG = { width: 1200, height: 630 };

/** Image Open Graph sobre : titre et sous-titre sur fond uni. */
export function imageOg(titre: string, sousTitre: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#000000",
          color: "white",
        }}
      >
        <div style={{ fontSize: 30, color: INSTANCE.accent }}>{INSTANCE.nom}</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>{titre}</div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#cccccc" }}>{sousTitre}</div>
      </div>
    ),
    TAILLE_OG,
  );
}
