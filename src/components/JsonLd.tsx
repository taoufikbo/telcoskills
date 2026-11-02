/** Données structurées (schema.org) : script JSON-LD, avec « < » échappé pour ne jamais fermer la balise. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
