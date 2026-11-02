import type { Metadata } from "next";
import type { ReactNode } from "react";
import { exigerRefonte } from "@/lib/refonte";

/** Pages d'essai des produits (src/produits/<nom>) : non indexées, absentes du menu et du plan du site. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutLabo({ children }: { children: ReactNode }) {
  exigerRefonte();
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-14 sm:px-6 sm:py-20">
      <p className="mono" style={{ color: "var(--muted)" }}>
        Page d&apos;essai : un produit isolé, avec les données de ce navigateur.
      </p>
      {children}
    </main>
  );
}
