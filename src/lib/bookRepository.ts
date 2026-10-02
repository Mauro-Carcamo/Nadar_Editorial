import { Book } from "@/data/site";
import {
  createBook as createLocalBook,
  deleteBook as deleteLocalBook,
  getBook as getLocalBook,
  listBooks as listLocalBooks,
  updateBook as updateLocalBook,
} from "@/lib/bookStore";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

type AdminBook = Book & {
  updatedAt: string;
};

type Result<T> = { item: T } | { error: string };

type ListResult<T> = { items: T[]; mode: "local" | "supabase" };

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapRowToAdminBook(row: Record<string, unknown>): AdminBook {
  return {
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? "Nadar Ediciones"),
    image: String(
      row.cover_image_url ?? "/images/books/671-historia-de-una-montana-de-elisee-reclus.png",
    ),
    collection: String(row.collection ?? "Sin coleccion"),
    bajada: String(row.bajada ?? ""),
    description: String(row.description ?? ""),
    isbn: row.isbn13 ? String(row.isbn13) : row.isbn_raw ? String(row.isbn_raw) : null,
    price: toNumber(row.price),
    currency: row.currency ? String(row.currency) : "CLP",
    publishDate: row.publish_date ? String(row.publish_date) : null,
    subject: row.subject ? String(row.subject) : null,
    publicationType: row.publication_type ? String(row.publication_type) : null,
    dataSource: "supabase",
    updatedAt: row.updated_at ? String(row.updated_at) : nowIso(),
  };
}

export async function listAdminBooks(): Promise<ListResult<AdminBook>> {
  if (!isSupabaseConfigured()) {
    return { items: listLocalBooks(), mode: "local" };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { items: listLocalBooks(), mode: "local" };
  }

  const { data, error } = await supabase
    .from("books")
    .select(
      "slug,title,bajada,description,isbn13,isbn_raw,price,currency,publish_date,subject,publication_type,cover_image_url,updated_at",
    )
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row) => mapRowToAdminBook(row as Record<string, unknown>));
  return { items, mode: "supabase" };
}

export async function getAdminBook(slug: string): Promise<Result<AdminBook>> {
  if (!isSupabaseConfigured()) {
    const local = getLocalBook(slug);
    return local ? { item: local } : { error: "not_found" };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "not_available" };

  const { data, error } = await supabase
    .from("books")
    .select(
      "slug,title,bajada,description,isbn13,isbn_raw,price,currency,publish_date,subject,publication_type,cover_image_url,updated_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "not_found" };

  return { item: mapRowToAdminBook(data as Record<string, unknown>) };
}

export async function createAdminBook(input: Partial<Book>): Promise<Result<AdminBook>> {
  if (!isSupabaseConfigured()) {
    const local = createLocalBook(input);
    if ("error" in local) return { error: local.error ?? "unknown_error" };
    return { item: local.book };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "not_available" };

  const title = (input.title ?? "").trim();
  if (!title) return { error: "title is required" };

  const slug = (input.slug ?? title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);

  const insertRow = {
    slug,
    title,
    bajada: input.bajada ?? "",
    description: input.description ?? "",
    isbn_raw: input.isbn ?? null,
    price: input.price ?? null,
    currency: input.currency ?? "CLP",
    publish_date: input.publishDate ?? null,
    subject: input.subject ?? null,
    publication_type: input.publicationType ?? null,
    cover_image_url:
      input.image ?? "/images/books/671-historia-de-una-montana-de-elisee-reclus.png",
    status: "draft",
  };

  const { data, error } = await supabase.from("books").insert(insertRow).select().single();

  if (error) return { error: error.message };
  return { item: mapRowToAdminBook(data as Record<string, unknown>) };
}

export async function updateAdminBook(slug: string, patch: Partial<Book>): Promise<Result<AdminBook>> {
  if (!isSupabaseConfigured()) {
    const local = updateLocalBook(slug, patch);
    if ("error" in local) return { error: local.error ?? "unknown_error" };
    return { item: local.book };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "not_available" };

  const updateRow: Record<string, unknown> = {};
  if (patch.title !== undefined) updateRow.title = patch.title;
  if (patch.bajada !== undefined) updateRow.bajada = patch.bajada;
  if (patch.description !== undefined) updateRow.description = patch.description;
  if (patch.isbn !== undefined) updateRow.isbn_raw = patch.isbn;
  if (patch.price !== undefined) updateRow.price = patch.price;
  if (patch.currency !== undefined) updateRow.currency = patch.currency;
  if (patch.publishDate !== undefined) updateRow.publish_date = patch.publishDate;
  if (patch.subject !== undefined) updateRow.subject = patch.subject;
  if (patch.publicationType !== undefined) updateRow.publication_type = patch.publicationType;
  if (patch.image !== undefined) updateRow.cover_image_url = patch.image;

  const { data, error } = await supabase
    .from("books")
    .update(updateRow)
    .eq("slug", slug)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "not_found" };

  return { item: mapRowToAdminBook(data as Record<string, unknown>) };
}

export async function deleteAdminBook(slug: string): Promise<Result<AdminBook>> {
  if (!isSupabaseConfigured()) {
    const local = deleteLocalBook(slug);
    if ("error" in local) return { error: local.error ?? "unknown_error" };
    return { item: local.book };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "not_available" };

  const before = await getAdminBook(slug);
  if ("error" in before) return before;

  const { error } = await supabase.from("books").delete().eq("slug", slug);
  if (error) return { error: error.message };

  return { item: before.item };
}

