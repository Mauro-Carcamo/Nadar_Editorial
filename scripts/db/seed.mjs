// Carga el catálogo actual (src/data/*.json) en PostgreSQL. Es idempotente: se puede correr
// varias veces; actualiza por slug y no duplica relaciones.
//   npm run db:seed
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const read = (f) => JSON.parse(fs.readFileSync(path.resolve("src/data", f), "utf8"));
const books = read("books.enriched.json");
const collections = read("collections.json");
const covers = read("covers.json");

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// "A, B y C (editores)" -> [{ name, role }]
function parseAuthors(subtitle) {
  let role = "author";
  let text = subtitle.trim();
  const m = text.match(/\((editores|editor|coordinadores|coordinador)\)\s*$/i);
  if (m) {
    role = /coord/i.test(m[1]) ? "coordinator" : "editor";
    text = text.slice(0, m.index).trim();
  }
  return text
    .split(/\s*,\s*|\s+y\s+|\s*&\s*/)
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ name, role }));
}

// "Sebastián Aguilera (traductor)" -> { name, role: "translator" }
const CONTRIB_ROLES = { traductor: "translator", traductora: "translator", prologo: "prologue", "prólogo": "prologue", ilustrador: "illustrator" };
function parseContributor(text) {
  const m = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { name: text.trim(), role: "author" };
  return { name: m[1].trim(), role: CONTRIB_ROLES[m[2].toLowerCase()] ?? "author" };
}

// Etiquetas: sin duplicados por mayúsculas; "Cartografía Social" sola es un residuo del scraping (nube de etiquetas)
function cleanTags(tags = []) {
  if (tags.length === 1 && tags[0] === "Cartografía Social") return [];
  const seen = new Map();
  for (const t of tags) {
    const key = t.toLowerCase();
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()];
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const one = async (sql, params) => (await client.query(sql, params)).rows[0];

try {
  await client.query("BEGIN");

  // Envío (mismas zonas y costos que el carrito actual)
  const zones = [
    ["pickup", "Retiro en librería", 0, 1],
    ["rm", "Región Metropolitana", 3500, 2],
    ["central", "Regiones centrales", 4500, 3],
    ["extreme", "Norte y Sur", 7900, 4],
  ];
  for (const [code, label, cost, position] of zones) {
    await client.query(
      `INSERT INTO shipping_zones (code, label, cost, position) VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, cost = EXCLUDED.cost, position = EXCLUDED.position`,
      [code, label, cost, position],
    );
  }

  const publisher = await one(
    `INSERT INTO publishers (name, slug, website) VALUES ('Nadar Ediciones', 'nadar-ediciones', 'https://nadarediciones.cl')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
  );

  const collectionIds = {};
  for (const [i, c] of collections.entries()) {
    const row = await one(
      `INSERT INTO collections (name, slug, description, intro, series, position, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
         intro = EXCLUDED.intro, series = EXCLUDED.series, position = EXCLUDED.position, source_url = EXCLUDED.source_url
       RETURNING id`,
      [c.name, c.slug, c.description, c.intro, c.series ?? [], i + 1, c.sourceUrl ?? null],
    );
    collectionIds[c.name] = row.id;
  }

  const authorIds = {};
  const upsertAuthor = async (name, bio) => {
    const slug = slugify(name);
    if (authorIds[slug]) return authorIds[slug];
    const row = await one(
      `INSERT INTO authors (name, slug, biography) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, biography = COALESCE(authors.biography, EXCLUDED.biography)
       RETURNING id`,
      [name, slug, bio || null],
    );
    authorIds[slug] = row.id;
    return row.id;
  };

  const categoryIds = {};
  const upsertCategory = async (name) => {
    const slug = slugify(name);
    if (categoryIds[slug]) return categoryIds[slug];
    const row = await one(
      `INSERT INTO categories (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = categories.name RETURNING id`,
      [name, slug],
    );
    categoryIds[slug] = row.id;
    return row.id;
  };

  let withStock = 0;
  for (const b of books) {
    const yearInt = b.year ? Number(b.year) : null;
    const row = await one(
      `INSERT INTO books (slug, title, isbn, bajada, description, author_bio, price, currency, status, publisher_id,
                          collection_id, series, publication_year, pages, size, format, subject, sales_rank, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', $9, $10, $11, $12, $13, $14, 'Libro impreso en papel', $15, $16, $17)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title, isbn = EXCLUDED.isbn, bajada = EXCLUDED.bajada, description = EXCLUDED.description,
         author_bio = EXCLUDED.author_bio, price = EXCLUDED.price, publisher_id = EXCLUDED.publisher_id,
         collection_id = EXCLUDED.collection_id, series = EXCLUDED.series, publication_year = EXCLUDED.publication_year,
         pages = EXCLUDED.pages, size = EXCLUDED.size, subject = EXCLUDED.subject, sales_rank = EXCLUDED.sales_rank,
         source_url = EXCLUDED.source_url
       RETURNING id`,
      [
        b.slug, b.title, b.isbn || null, b.bajada || null, b.description || null, b.authorBio || null,
        b.price ?? null, b.currency || "CLP", publisher.id, collectionIds[b.collection] ?? null, b.series ?? null,
        Number.isFinite(yearInt) ? yearInt : null, b.pages ?? null, b.size ?? null, b.subject ?? null,
        b.salesRank ?? null, b.sourceUrl ?? null,
      ],
    );
    const bookId = row.id;

    // Autores y colaboradores
    await client.query("DELETE FROM book_authors WHERE book_id = $1", [bookId]);
    const people = [...parseAuthors(b.subtitle || ""), ...(b.contributors ?? []).map(parseContributor)];
    for (const [position, p] of people.entries()) {
      const authorId = await upsertAuthor(p.name, people.length === 1 ? b.authorBio : null);
      await client.query(
        `INSERT INTO book_authors (book_id, author_id, role, position) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [bookId, authorId, p.role, position],
      );
    }

    // Categorías temáticas
    await client.query("DELETE FROM book_categories WHERE book_id = $1", [bookId]);
    for (const tag of cleanTags(b.tags)) {
      const categoryId = await upsertCategory(tag);
      await client.query(`INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
        bookId,
        categoryId,
      ]);
    }

    // Imágenes: portada plana + foto original (mockup)
    await client.query("DELETE FROM book_images WHERE book_id = $1", [bookId]);
    if (b.cover) {
      const file = b.cover.split("/").pop();
      const size = covers[file] ?? [null, null];
      await client.query(`INSERT INTO book_images (book_id, kind, url, width, height) VALUES ($1, 'cover', $2, $3, $4)`, [
        bookId, b.cover, size[0], size[1],
      ]);
    }
    if (b.image && b.image !== b.cover) {
      await client.query(`INSERT INTO book_images (book_id, kind, url, width, height) VALUES ($1, 'mockup', $2, 850, 688)`, [
        bookId, b.image,
      ]);
    }

    // Inventario inicial (solo si no existe): stock de prueba para libros con precio
    const stock = b.price ? 20 : 0;
    const inv = await client.query(
      `INSERT INTO inventory (book_id, stock) VALUES ($1, $2) ON CONFLICT (book_id) DO NOTHING RETURNING book_id`,
      [bookId, stock],
    );
    if (inv.rowCount && stock > 0) {
      withStock += 1;
      await client.query(
        `INSERT INTO inventory_movements (book_id, delta_stock, reason, note) VALUES ($1, $2, 'INITIAL', 'Stock de prueba (seed)')`,
        [bookId, stock],
      );
    }
  }

  await client.query("COMMIT");
  const counts = await one(`SELECT
    (SELECT count(*) FROM books) AS books, (SELECT count(*) FROM authors) AS authors,
    (SELECT count(*) FROM categories) AS categories, (SELECT count(*) FROM collections) AS collections,
    (SELECT count(*) FROM book_images) AS images, (SELECT count(*) FROM inventory WHERE stock > 0) AS in_stock`);
  console.log("Catálogo cargado:", counts, `· stock inicial nuevo en ${withStock} libros`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
