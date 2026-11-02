import Script from "next/script";
import { INSTANCE } from "@/lib/instance";

/**
 * Script de mesure d'audience de Vercel. Il faut activer « Web Analytics » dans le projet Vercel, puis définir
 * NEXT_PUBLIC_ANALYTICS=vercel : sans cela, le script n'existe pas et le navigateur signalerait une erreur 404.
 */
export default function Analytics() {
  if (!INSTANCE.refonte || process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ANALYTICS !== "vercel") return null;
  return (
    <>
      <Script id="va-init" strategy="afterInteractive">
        {"window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};"}
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" defer />
    </>
  );
}
