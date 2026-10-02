import books from "./books.enriched.json";
import covers from "./covers.json";

export type Book = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  collection: string;
  bajada: string;
  description: string;
  isbn?: string | null;
  price?: number | null;
  currency?: string | null;
  publishDate?: string | null;
  subject?: string | null;
  publicationType?: string | null;
  dataSource?: string;
  salesRank?: number | null;
};

export const allBooks = books as Book[];

// Portadas planas recortadas de las fotos originales (public/images/covers).
// Si un libro no tiene portada plana (p. ej. uno nuevo desde el admin) se usa su foto original.
const coverFiles: Record<string, number[]> = covers;

export function getCover(book: Book) {
  const file = book.image.split("/").pop() ?? "";
  const size = coverFiles[file];
  return size
    ? { src: `/images/covers/${file}`, width: size[0], height: size[1], flat: true }
    : { src: book.image, width: 850, height: 688, flat: false };
}

// Texto de relleno de la migración inicial: no se muestra al público hasta cargar la sinopsis real
const PLACEHOLDER_DESCRIPTION = "Titulo del catalogo de Nadar Ediciones.";

export function hasRealDescription(book: Book) {
  return Boolean(book.description) && !book.description.startsWith(PLACEHOLDER_DESCRIPTION);
}

// Ranking manual de ventas (1 = más vendido). Los libros sin ranking quedan al final en orden de catálogo.
export function getBestsellers(limit = 10) {
  return allBooks
    .map((book, index) => ({ book, index }))
    .sort((a, b) => (a.book.salesRank ?? Infinity) - (b.book.salesRank ?? Infinity) || a.index - b.index)
    .slice(0, limit)
    .map(({ book }) => book);
}

export const collections = [
  {
    slug: "horizontes-de-sentido",
    name: "Horizontes de sentido",
    description: "Pensamiento social y político para discutir el presente.",
  },
  {
    slug: "trayectorias",
    name: "Trayectorias",
    description: "Biografías intelectuales, archivos y recorridos de lectura.",
  },
  {
    slug: "mundo-telurico",
    name: "Mundo telúrico",
    description: "Territorio, memoria y formas de habitar lo común.",
  },
];

export const socialLinks = [
  { name: "Facebook", url: "https://www.facebook.com/nadarediciones/" },
  { name: "X", url: "https://twitter.com/nadarediciones" },
  { name: "Instagram", url: "https://instagram.com/nadarediciones" },
  { name: "YouTube", url: "https://www.youtube.com/@nadarediciones956" },
];

export function getBookBySlug(slug: string) {
  return allBooks.find((book) => book.slug === slug);
}
