import { cache } from "react";
import type { ActiveCampaign, Book, BookDiscount, Collection } from "@/data/book-utils";
import { discountedPrice, joinNames } from "@/data/book-utils";
import { isDatabaseConfigured, query } from "@/lib/db";

// Catálogo para el storefront (solo servidor). Fuente: PostgreSQL.
// Si no hay base configurada se usa el JSON del repositorio (misma forma de datos).

const ROLE_LABEL: Record<string, string> = {
  translator: "traductor",
  prologue: "prólogo",
  illustrator: "ilustración",
};

type BookRow = {
  slug: string;
  title: string;
  isbn: string | null;
  bajada: string | null;
  description: string | null;
  author_bio: string | null;
  price: number | null;
  currency: string;
  series: string | null;
  publication_year: number | null;
  pages: number | null;
  size: string | null;
  subject: string | null;
  format: string | null;
  sales_rank: number | null;
  source_url: string | null;
  collection: string | null;
  available: number | null;
  people: { name: string; role: string }[] | null;
  tags: string[] | null;
  cover: string | null;
  cover_width: number | null;
  cover_height: number | null;
  mockup: string | null;
  disc_percent: number | null;
  disc_label: string | null;
  disc_campaign: string | null;
  disc_campaign_slug: string | null;
  disc_ends_at: Date | null;
};

// Descuento vigente de cada libro: campaña activa, dentro de sus fechas y solo si el libro tiene precio;
// si está en varias campañas, gana el mayor porcentaje
export const ACTIVE_DISCOUNT_JOIN = `
  LEFT JOIN LATERAL (SELECT bd.percent, dc.badge_label, dc.name, dc.slug, dc.ends_at
                     FROM book_discounts bd JOIN discount_campaigns dc ON dc.id = bd.campaign_id
                     WHERE bd.book_id = b.id AND b.price IS NOT NULL AND dc.is_active AND dc.starts_at <= now()
                       AND (dc.ends_at IS NULL OR dc.ends_at > now())
                     ORDER BY bd.percent DESC LIMIT 1) disc ON true`;

const BOOK_SELECT = `
  SELECT b.slug, b.title, b.isbn, b.bajada, b.description, b.author_bio, b.price, b.currency, b.series,
         b.publication_year, b.pages, b.size, b.subject, b.format, b.sales_rank, b.source_url,
         c.name AS collection, i.available,
         (SELECT json_agg(json_build_object('name', a.name, 'role', ba.role) ORDER BY ba.position)
            FROM book_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id) AS people,
         (SELECT array_agg(cat.name ORDER BY cat.name)
            FROM book_categories bc JOIN categories cat ON cat.id = bc.category_id WHERE bc.book_id = b.id) AS tags,
         cov.url AS cover, cov.width AS cover_width, cov.height AS cover_height,
         (SELECT url FROM book_images WHERE book_id = b.id AND kind = 'mockup' ORDER BY position LIMIT 1) AS mockup,
         disc.percent AS disc_percent, disc.badge_label AS disc_label, disc.name AS disc_campaign,
         disc.slug AS disc_campaign_slug, disc.ends_at AS disc_ends_at
  FROM books b
  LEFT JOIN collections c ON c.id = b.collection_id
  LEFT JOIN inventory i ON i.book_id = b.id
  LEFT JOIN LATERAL (SELECT url, width, height FROM book_images
                     WHERE book_id = b.id AND kind = 'cover' ORDER BY position LIMIT 1) cov ON true
  ${ACTIVE_DISCOUNT_JOIN}`;

function toBook(r: BookRow): Book {
  const people = r.people ?? [];
  const main = people.filter((p) => ["author", "editor", "coordinator"].includes(p.role));
  const onlyEditors = main.length > 0 && main.every((p) => p.role === "editor");
  const onlyCoordinators = main.length > 0 && main.every((p) => p.role === "coordinator");
  const subtitle =
    joinNames(main.map((p) => p.name)) + (onlyEditors ? " (editores)" : onlyCoordinators ? " (coordinadores)" : "");
  return {
    slug: r.slug,
    title: r.title,
    subtitle: subtitle || "Nadar Ediciones",
    contributors: people.filter((p) => ROLE_LABEL[p.role]).map((p) => `${p.name} (${ROLE_LABEL[p.role]})`),
    image: r.mockup ?? r.cover ?? "",
    cover: r.cover,
    coverWidth: r.cover_width,
    coverHeight: r.cover_height,
    collection: r.collection ?? "",
    series: r.series,
    bajada: r.bajada ?? "",
    description: r.description ?? "",
    authorBio: r.author_bio ?? "",
    tags: r.tags ?? [],
    isbn: r.isbn,
    price: r.price,
    currency: r.currency,
    year: r.publication_year ? String(r.publication_year) : null,
    pages: r.pages,
    size: r.size,
    subject: r.subject,
    publicationType: r.format,
    sourceUrl: r.source_url ?? undefined,
    salesRank: r.sales_rank,
    available: r.available,
    discount: r.disc_percent
      ? {
          percent: r.disc_percent,
          label: r.disc_label ?? "",
          campaign: r.disc_campaign ?? "",
          campaignSlug: r.disc_campaign_slug ?? "",
          endsAt: r.disc_ends_at ? r.disc_ends_at.toISOString() : null,
          price: r.price === null ? null : discountedPrice(r.price, r.disc_percent),
        }
      : null,
    dataSource: "postgres",
  };
}

// ---------------------------------------------------------------- respaldo JSON (sin base de datos)
type JsonCampaign = {
  slug: string;
  name: string;
  badgeLabel: string;
  headline: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  showBanner: boolean;
  books: { slug: string; percent: number }[];
};

/** Campañas vigentes del respaldo JSON (mismas reglas que en la base: activa y dentro de fechas). */
async function loadJsonCampaigns() {
  const data = await import("@/data/discounts.json");
  const now = Date.now();
  return (data.default.campaigns as JsonCampaign[]).filter(
    (c) => c.isActive && Date.parse(c.startsAt) <= now && (!c.endsAt || Date.parse(c.endsAt) > now),
  );
}

async function loadJsonCatalog() {
  const [books, collections, covers, campaigns] = await Promise.all([
    import("@/data/books.enriched.json"),
    import("@/data/collections.json"),
    import("@/data/covers.json"),
    loadJsonCampaigns(),
  ]);
  const sizes = covers.default as Record<string, number[]>;
  const discountFor = (b: Book): BookDiscount | null => {
    let best: BookDiscount | null = null;
    for (const c of campaigns) {
      const entry = b.price ? c.books.find((x) => x.slug === b.slug) : undefined;
      if (entry && (!best || entry.percent > best.percent)) {
        best = {
          percent: entry.percent,
          label: c.badgeLabel,
          campaign: c.name,
          campaignSlug: c.slug,
          endsAt: c.endsAt,
          price: b.price ? discountedPrice(b.price, entry.percent) : null,
        };
      }
    }
    return best;
  };
  return {
    books: (books.default as Book[]).map((b) => {
      const size = sizes[(b.cover ?? "").split("/").pop() ?? ""];
      return { ...b, coverWidth: size?.[0] ?? null, coverHeight: size?.[1] ?? null, discount: discountFor(b) };
    }),
    collections: collections.default as Collection[],
  };
}

// ---------------------------------------------------------------- API pública del repositorio

/** Libros publicados, del más reciente al más antiguo. */
export const listPublishedBooks = cache(async (): Promise<Book[]> => {
  if (!isDatabaseConfigured()) return (await loadJsonCatalog()).books;
  const { rows } = await query<BookRow>(
    `${BOOK_SELECT} WHERE b.status = 'PUBLISHED' ORDER BY b.publication_year DESC NULLS LAST, b.title`,
  );
  return rows.map(toBook);
});

export const getPublishedBook = cache(async (slug: string): Promise<Book | undefined> => {
  if (!isDatabaseConfigured()) return (await loadJsonCatalog()).books.find((b) => b.slug === slug);
  const { rows } = await query<BookRow>(`${BOOK_SELECT} WHERE b.status = 'PUBLISHED' AND b.slug = $1`, [slug]);
  return rows[0] ? toBook(rows[0]) : undefined;
});

export const listCollections = cache(async (): Promise<Collection[]> => {
  if (!isDatabaseConfigured()) return (await loadJsonCatalog()).collections;
  const { rows } = await query<{ slug: string; name: string; description: string | null; intro: string | null; series: string[]; source_url: string | null }>(
    "SELECT slug, name, description, intro, series, source_url FROM collections ORDER BY position, name",
  );
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description ?? "",
    intro: c.intro ?? "",
    series: c.series ?? [],
    sourceUrl: c.source_url ?? "",
  }));
});

export async function getBooksByCollection(name: string) {
  return (await listPublishedBooks()).filter((b) => b.collection === name);
}

/** Ranking manual de ventas (1 = más vendido); el resto en orden de catálogo. */
export async function getBestsellers(limit = 10) {
  const books = await listPublishedBooks();
  return books
    .map((book, index) => ({ book, index }))
    .sort((a, b) => (a.book.salesRank ?? Infinity) - (b.book.salesRank ?? Infinity) || a.index - b.index)
    .slice(0, limit)
    .map(({ book }) => book);
}

/** Campaña vigente con banner (la de mayor descuento si hay varias); null si no hay ninguna. */
export const getActiveCampaign = cache(async (): Promise<ActiveCampaign | null> => {
  if (!isDatabaseConfigured()) {
    const c = (await loadJsonCampaigns()).find((x) => x.showBanner && x.books.length);
    if (!c) return null;
    return {
      slug: c.slug,
      name: c.name,
      label: c.badgeLabel,
      headline: c.headline,
      description: c.description,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      maxPercent: Math.max(...c.books.map((b) => b.percent)),
      bookCount: c.books.length,
    };
  }
  const { rows } = await query<{
    slug: string;
    name: string;
    badge_label: string;
    headline: string | null;
    description: string | null;
    starts_at: Date;
    ends_at: Date | null;
    max_percent: number;
    book_count: number;
  }>(
    `SELECT dc.slug, dc.name, dc.badge_label, dc.headline, dc.description, dc.starts_at, dc.ends_at,
            max(bd.percent)::int AS max_percent, count(*)::int AS book_count
     FROM discount_campaigns dc
     JOIN book_discounts bd ON bd.campaign_id = dc.id
     JOIN books b ON b.id = bd.book_id AND b.status = 'PUBLISHED' AND b.price IS NOT NULL
     WHERE dc.is_active AND dc.show_banner AND dc.starts_at <= now() AND (dc.ends_at IS NULL OR dc.ends_at > now())
     GROUP BY dc.id
     ORDER BY max(bd.percent) DESC, dc.starts_at DESC
     LIMIT 1`,
  );
  const c = rows[0];
  if (!c) return null;
  return {
    slug: c.slug,
    name: c.name,
    label: c.badge_label,
    headline: c.headline ?? c.name,
    description: c.description ?? "",
    startsAt: c.starts_at.toISOString(),
    endsAt: c.ends_at ? c.ends_at.toISOString() : null,
    maxPercent: c.max_percent,
    bookCount: c.book_count,
  };
});
