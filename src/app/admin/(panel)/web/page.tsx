import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Texto de relleno de la migración inicial (no cuenta como descripción real)
const PLACEHOLDER = "Titulo del catalogo de Nadar Ediciones.%";

type Pending = {
  id: string;
  title: string;
  status: string;
  no_cover: boolean;
  no_bajada: boolean;
  no_description: boolean;
  no_price: boolean;
  no_collection: boolean;
  no_people: boolean;
};

const MISSING: [keyof Pending, string][] = [
  ["no_cover", "portada"],
  ["no_bajada", "bajada"],
  ["no_description", "descripción"],
  ["no_people", "autor"],
  ["no_price", "precio"],
  ["no_collection", "colección"],
];

export default async function AdminWebHome() {
  const [counts, pending] = await Promise.all([
    query<{ published: number; drafts: number; hero: number; collections: number; points: number }>(
      `SELECT (SELECT count(*) FROM books WHERE status = 'PUBLISHED')::int AS published,
              (SELECT count(*) FROM books WHERE status = 'DRAFT')::int AS drafts,
              (SELECT count(*) FROM books WHERE sales_rank BETWEEN 1 AND 10 AND status = 'PUBLISHED')::int AS hero,
              (SELECT count(*) FROM collections)::int AS collections,
              (SELECT count(*) FROM points_of_sale WHERE active)::int AS points`,
    ),
    // Libros publicados o en borrador a los que les falta algo que se muestra en el sitio
    query<Pending>(
      `SELECT * FROM (
         SELECT b.id, b.title, b.status,
                NOT EXISTS (SELECT 1 FROM book_images WHERE book_id = b.id AND kind = 'cover') AS no_cover,
                coalesce(trim(b.bajada), '') = '' AS no_bajada,
                coalesce(trim(b.description), '') = '' OR b.description LIKE $1 AS no_description,
                b.price IS NULL AS no_price,
                b.collection_id IS NULL AS no_collection,
                NOT EXISTS (SELECT 1 FROM book_authors WHERE book_id = b.id) AS no_people
         FROM books b WHERE b.status IN ('PUBLISHED', 'DRAFT')) t
       WHERE no_cover OR no_bajada OR no_description OR no_price OR no_collection OR no_people
       ORDER BY status DESC, title`,
      [PLACEHOLDER],
    ),
  ]);
  const c = counts.rows[0];

  const cards = [
    {
      href: "/admin/libros",
      title: "Libros",
      text: "Crear y editar libros: textos de cada sección, autores, ficha, portada, precio y stock.",
      meta: `${c.published} publicados · ${c.drafts} borradores`,
      action: { href: "/admin/libros/nuevo", label: "Nuevo libro" },
    },
    {
      href: "/admin/web/destacados",
      title: "Destacados (hero)",
      text: "Los 10 libros del carrusel del inicio y su orden.",
      meta: `${c.hero} de 10 elegidos`,
    },
    {
      href: "/admin/web/colecciones",
      title: "Colecciones",
      text: "Nombre, descripción y orden de cada colección de la sección Rutas de lectura.",
      meta: `${c.collections} colecciones`,
    },
    {
      href: "/admin/web/puntos-de-venta",
      title: "Puntos de venta",
      text: "Librerías del mapa: dirección, región y ubicación.",
      meta: `${c.points} activos`,
    },
  ];

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Editar web</p>
        <h2>Centro de edición</h2>
        <p className="admin-sub">Todo lo que se muestra en el sitio. Los cambios se ven en la web al guardar.</p>
      </header>

      <div className="admin-web-cards">
        {cards.map((card) => (
          <article key={card.href} className="admin-panel admin-web-card">
            <h3>
              <Link href={card.href}>{card.title}</Link>
            </h3>
            <p>{card.text}</p>
            <small>{card.meta}</small>
            <div className="admin-web-card-actions">
              <Link href={card.href} className="btn btn-outline">
                Abrir
              </Link>
              {card.action ? (
                <Link href={card.action.href} className="btn btn-primary">
                  {card.action.label}
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <section className="admin-panel admin-web-pending">
        <h3>Libros con información incompleta</h3>
        <p className="admin-sub">
          Lo que falta se nota en el sitio: sin portada no hay imagen, sin bajada la sección Colecciones queda sin texto,
          sin precio no se puede comprar.
        </p>
        {pending.rows.length ? (
          <ul>
            {pending.rows.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/libros/${b.id}`}>
                  <strong>{b.title}</strong>
                </Link>
                {b.status === "DRAFT" ? <span className="admin-badge is-wait">Borrador</span> : null}
                <span className="admin-web-missing">
                  Falta:{" "}
                  {MISSING.filter(([key]) => b[key])
                    .map(([, label]) => label)
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">Todos los libros tienen su información completa.</p>
        )}
      </section>
    </>
  );
}
