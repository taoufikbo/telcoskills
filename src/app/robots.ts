import type { MetadataRoute } from "next";
import { INSTANCE } from "@/lib/instance";
import { urlAbsolue } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!INSTANCE.refonte || !INSTANCE.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: urlAbsolue("/sitemap.xml") };
}
