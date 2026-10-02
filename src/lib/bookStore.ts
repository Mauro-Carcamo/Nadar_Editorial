import { allBooks, Book } from "@/data/site";

type AdminBook = Book & {
  updatedAt: string;
};

const now = new Date().toISOString();
const store: AdminBook[] = allBooks.map((book) => ({ ...book, updatedAt: now }));

function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

export function listBooks() {
  return [...store].sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export function getBook(slug: string) {
  return store.find((book) => book.slug === slug);
}

export function createBook(input: Partial<Book>) {
  const title = (input.title ?? "").trim();
  if (!title) return { error: "title is required" as const };

  const baseSlug = normalize(input.slug?.trim() || title);
  let slug = baseSlug || `libro-${Date.now()}`;
  let i = 2;
  while (store.some((b) => b.slug === slug)) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }

  const book: AdminBook = {
    slug,
    title,
    subtitle: (input.subtitle ?? "Nadar Ediciones").trim(),
    image:
      input.image?.trim() ||
      "/images/books/671-historia-de-una-montana-de-elisee-reclus.png",
    collection: (input.collection ?? "Sin coleccion").trim(),
    bajada: (input.bajada ?? "").trim(),
    description: (input.description ?? "").trim(),
    isbn: input.isbn?.trim() || null,
    price: typeof input.price === "number" ? input.price : null,
    currency: (input.currency ?? "CLP").trim(),
    publishDate: input.publishDate?.trim() || null,
    subject: input.subject?.trim() || null,
    publicationType: input.publicationType?.trim() || null,
    dataSource: "admin-local",
    updatedAt: new Date().toISOString(),
  };

  store.push(book);
  return { book };
}

export function updateBook(slug: string, patch: Partial<Book>) {
  const book = getBook(slug);
  if (!book) return { error: "not_found" as const };

  if (patch.title !== undefined) book.title = patch.title.trim();
  if (patch.subtitle !== undefined) book.subtitle = patch.subtitle.trim();
  if (patch.collection !== undefined) book.collection = patch.collection.trim();
  if (patch.bajada !== undefined) book.bajada = patch.bajada.trim();
  if (patch.description !== undefined) book.description = patch.description.trim();
  if (patch.image !== undefined) book.image = patch.image.trim();
  if (patch.isbn !== undefined) book.isbn = patch.isbn?.trim() || null;
  if (patch.subject !== undefined) book.subject = patch.subject?.trim() || null;
  if (patch.publicationType !== undefined)
    book.publicationType = patch.publicationType?.trim() || null;
  if (patch.publishDate !== undefined) book.publishDate = patch.publishDate?.trim() || null;
  if (patch.currency !== undefined) book.currency = patch.currency?.trim() || "CLP";
  if (patch.price !== undefined) {
    book.price = typeof patch.price === "number" ? patch.price : null;
  }

  book.updatedAt = new Date().toISOString();
  return { book };
}

export function deleteBook(slug: string) {
  const idx = store.findIndex((book) => book.slug === slug);
  if (idx === -1) return { error: "not_found" as const };
  const [removed] = store.splice(idx, 1);
  return { book: removed };
}
