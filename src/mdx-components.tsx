import type { MDXComponents } from "mdx/types";
import Diagram from "@/components/Diagram";
import Draft from "@/components/Draft";

/** Composants disponibles dans toutes les analyses MDX. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { Draft, Diagram, ...components };
}
