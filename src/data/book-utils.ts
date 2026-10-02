// Tipos y funciones puras del catálogo. Sin datos ni acceso a base: se pueden usar en el navegador.

export type Book = {
  slug: string;
  title: string;
  subtitle: string; // autor/es tal como se muestran
  contributors?: string[]; // traducción, prólogo, etc.
  image: string; // foto original (o la portada, si no hay foto)
  cover?: string | null; // portada plana
  coverWidth?: number | null;
  coverHeight?: number | null;
  collection: string; // "" si no tiene colección
  series?: string | null;
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
  available?: number | null; // stock disponible (solo cuando el catálogo viene de la base)
};

export type Collection = {
  slug: string;
  name: string;
  description: string;
  intro: string;
  series: string[];
  sourceUrl: string;
};

/** Portada plana si existe; si no, la foto original llenando el marco. */
export function getCover(book: Book) {
  return book.cover && book.coverWidth && book.coverHeight
    ? { src: book.cover, width: book.coverWidth, height: book.coverHeight, flat: true }
    : { src: book.image, width: 850, height: 688, flat: false };
}

// Texto de relleno de la migración inicial: no se muestra al público
const PLACEHOLDER_DESCRIPTION = "Titulo del catalogo de Nadar Ediciones.";

export function hasRealDescription(book: Book) {
  return Boolean(book.description) && !book.description.startsWith(PLACEHOLDER_DESCRIPTION);
}

/**
 * Entrada (bajada) y cuerpo sin repetir texto. La bajada suele ser la primera frase de la sinopsis:
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

/** "A, B y C" a partir de una lista de nombres. */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}
