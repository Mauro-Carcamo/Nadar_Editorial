import books from "./books.enriched.json";
import collectionsData from "./collections.json";
import covers from "./covers.json";
import pagesData from "./pages.json";

// Catálogo unificado generado por Scraping/merge_catalogo.py (scraping + Excel + catálogo anterior).
export type Book = {
  slug: string;
  title: string;
  subtitle: string; // autor/es
  contributors?: string[]; // traducción, prólogo, etc.
  image: string; // foto original (o la portada, si no hay foto)
  cover?: string | null; // portada plana en /images/covers-hd
  collection: string; // "" si no se pudo determinar
  series?: string | null; // serie dentro de la colección (p. ej. Poesía en Nadar Contracorriente)
  bajada: string;
  description: string;
  authorBio?: string;
  tags?: string[];
  isbn?: string | null;
  price?: number | null;
  currency?: string | null;
  year?: string | null;
  pages?: number | null;
  size?: string | null;
  publishDate?: string | null;
  subject?: string | null;
  publicationType?: string | null;
  sourceUrl?: string;
  dataSource?: string;
  salesRank?: number | null;
};

export type Collection = {
  slug: string;
  name: string;
  description: string;
  intro: string;
  series: string[];
  sourceUrl: string;
};

export type SitePage = {
  slug: string;
  title: string;
  kind: string;
  url: string;
  text: string;
};

export const allBooks = books as Book[];

// Las 6 colecciones declaradas en /colecciones/ del sitio original
export const collections = collectionsData as Collection[];

// Contenido de páginas institucionales del sitio original (proyecto, puntos de venta, amistad, etc.)
export const sitePages = pagesData as SitePage[];

export function getBooksByCollection(name: string) {
  return allBooks.filter((book) => book.collection === name);
}

// Portadas planas (public/images/covers-hd). Si un libro no tiene (p. ej. uno nuevo desde el admin),
// se usa su foto original y los estilos la muestran llenando el marco.
const coverFiles: Record<string, number[]> = covers;

export function getCover(book: Book) {
  const file = book.cover?.split("/").pop() ?? "";
  const size = coverFiles[file];
  return size && book.cover
    ? { src: book.cover, width: size[0], height: size[1], flat: true }
    : { src: book.image, width: 850, height: 688, flat: false };
}

// Texto de relleno de la migración inicial: no se muestra al público hasta cargar la sinopsis real
const PLACEHOLDER_DESCRIPTION = "Titulo del catalogo de Nadar Ediciones.";

export function hasRealDescription(book: Book) {
  return Boolean(book.description) && !book.description.startsWith(PLACEHOLDER_DESCRIPTION);
}

/**
 * Entrada (bajada) y cuerpo sin repetir texto. La bajada del merge suele ser la primera frase de la sinopsis:
 * - si es la frase completa, va como entrada y el cuerpo sigue desde la segunda frase;
 * - si es un recorte ("…") del mismo texto, se omite y se muestra la sinopsis completa.
 */
export function getLeadAndBody(book: Book) {
  const description = hasRealDescription(book) ? book.description.trim() : "";
  const bajada = (book.bajada ?? "").trim();
  const lead = bajada.replace(/…$/, "");
  if (!description) return { lead: bajada, body: "" };
  if (!lead || !description.startsWith(lead)) return { lead: bajada, body: description };
  if (bajada.endsWith("…")) return { lead: "", body: description };
  return { lead: bajada, body: description.slice(lead.length).trim() };
}

// Ranking manual de ventas (1 = más vendido). Los libros sin ranking quedan al final en orden de catálogo
// (el catálogo está ordenado del más reciente al más antiguo).
export function getBestsellers(limit = 10) {
  return allBooks
    .map((book, index) => ({ book, index }))
    .sort((a, b) => (a.book.salesRank ?? Infinity) - (b.book.salesRank ?? Infinity) || a.index - b.index)
    .slice(0, limit)
    .map(({ book }) => book);
}

export const socialLinks = [
  { name: "Facebook", url: "https://www.facebook.com/nadarediciones/" },
  { name: "X", url: "https://twitter.com/nadarediciones" },
  { name: "Instagram", url: "https://instagram.com/nadarediciones" },
  { name: "YouTube", url: "https://www.youtube.com/@nadarediciones956" },
];

export function getBookBySlug(slug: string) {
  return allBooks.find((book) => book.slug === slug);
}
