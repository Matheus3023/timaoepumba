import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * So as paginas publicas. O resto do produto exige sessao, entao nao entra
 * aqui (ver robots.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/signup`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/termos`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
