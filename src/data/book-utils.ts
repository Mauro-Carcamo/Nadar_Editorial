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
  discount?: BookDiscount | null; // descuento vigente (campaña activa); price sigue siendo el de lista
};

/** Descuento vigente de un libro (lo calcula el servidor según la campaña y sus fechas). */
export type BookDiscount = {
  percent: number;
  label: string; // texto del círculo: "Descuento <label>"
  campaign: string;
  campaignSlug: string;
  endsAt: string | null;
  price: number | null; // precio final con descuento
};

/** Campaña vigente con banner (p. ej. Cyber Week), para el banner del home. */
export type ActiveCampaign = {
  slug: string;
  name: string;
  label: string;
  headline: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  maxPercent: number;
  bookCount: number;
};

export type Collection = {
  slug: string;
  name: string;
  description: string;
  intro: string;
  series: string[];
  sourceUrl: string;
};

/** Precio con descuento (redondeado al peso). */
export function discountedPrice(price: number, percent: number) {
  return Math.round((price * (100 - percent)) / 100);
}

/** Precio que paga el cliente: con descuento si hay uno vigente; si no, el de lista. */
export function finalPrice(book: Book) {
  return book.discount?.price ?? book.price ?? null;
}

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

/** Descripción breve (bajada o comienzo del texto), cortada en una palabra completa. */
export function getShortDescription(book: Book, max = 200) {
  const { lead, body } = getLeadAndBody(book);
  const text = (lead || body).replace(/\s+/g, " ").replace(/^[«"“]+/, "").trim();
  if (text.length <= max) return text;
  // Si la primera oración cabe, se usa completa; si no, se corta en la última palabra que entra
  const sentence = text.match(/^.{40,}?[.!?»](?=\s|$)/)?.[0];
  if (sentence && sentence.length <= max) return sentence.replace(/»$/, "");
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/**
 * Separa el título en el primer punto o guion largo:
 * "Drago. Oficio y escritura" -> { main: "Drago", rest: "Oficio y escritura" }
 * "Asota e'in añunwiin wammamain – Memoria de…" -> { main: "Asota e'in añunwiin wammamain", rest: "Memoria de…" }
 */
export function splitTitle(title: string) {
  const m = title.match(/^(.+?)(?:\.\s+|\s+[–—]\s+)(.+)$/);
  return m ? { main: m[1].trim(), rest: m[2].trim() } : { main: title, rest: "" };
}

/** "A, B y C" a partir de una lista de nombres. */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}
