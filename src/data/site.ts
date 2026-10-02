// Datos estáticos del sitio (no catálogo). El catálogo vive en PostgreSQL: ver services/catalog/repository.ts.
export type { Book, Collection } from "@/data/book-utils";
export { getCover, getLeadAndBody, hasRealDescription } from "@/data/book-utils";

export const socialLinks = [
  { name: "Facebook", url: "https://www.facebook.com/nadarediciones/" },
  { name: "X", url: "https://twitter.com/nadarediciones" },
  { name: "Instagram", url: "https://instagram.com/nadarediciones" },
  { name: "YouTube", url: "https://www.youtube.com/@nadarediciones956" },
];
