"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CatalogGrid, CatalogPlainGrid } from "@/components/CatalogGrid";
import type { Book } from "@/data/book-utils";

// Catálogo del home + barra de filtros fija abajo (visible solo mientras se está en la sección).
// - Categorías: hasta 2 a la vez; se muestran los libros que tengan cualquiera de ellas.
// - Buscador: desde 4 letras consulta /api/search (libros y autores en la base de datos).
//   Un libro abre su ficha; un autor filtra la grilla con sus libros.

export const CATALOG_CATEGORIES = [
  "Cartografía Social",
  "Ciencias Sociales",
  "Crónica",
  "Ensayo",
  "Estudios Literarios",
  "Filosofía Antigua",
  "Filosofía Contemporánea",
  "Filosofía Política",
  "Geografía Humana",
  "Geografía Indígena",
  "Historia Medieval",
  "Historia Social",
  "Narrativa",
  "Poesía",
];

const MAX_CATEGORIES = 2;
const MIN_CHARS = 4;

type SearchResult = {
  books: {
    slug: string;
    title: string;
    authors: string | null;
    cover: string | null;
  }[];
  authors: { name: string; slugs: string[] }[];
};

export function CatalogBrowser({ books }: { books: Book[] }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [categories, setCategories] = useState<string[]>([]);
  const [author, setAuthor] = useState<{
    name: string;
    slugs: string[];
  } | null>(null);
  const [inView, setInView] = useState(false);
  const [term, setTerm] = useState("");
  // Celular: las categorías se despliegan con un botón (en escritorio siempre visibles, vía CSS)
  const [chipsOpen, setChipsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  // Solo categorías que tienen libros publicados
  const available = useMemo(
    () =>
      CATALOG_CATEGORIES.filter((c) => books.some((b) => b.tags?.includes(c))),
    [books],
  );

  const filtered = useMemo(() => {
    if (author) return books.filter((b) => author.slugs.includes(b.slug));
    if (categories.length)
      return books.filter((b) => categories.some((c) => b.tags?.includes(c)));
    return books;
  }, [books, categories, author]);

  // La barra aparece mientras la sección Catálogo está en pantalla
  useEffect(() => {
    const section = document.getElementById("catalogo");
    if (!section) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "-20% 0px -20% 0px",
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Búsqueda con espera breve y cancelación de la consulta anterior
  const q = term.trim();
  const ready = q.length >= MIN_CHARS;
  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        // consulta cancelada o sin conexión: se mantiene el resultado anterior
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, ready]);
  const shown = ready ? results : null;

  // Tras filtrar, centra la primera fila de libros en el espacio visible (entre la cabecera y la barra)
  const [scrollRequest, setScrollRequest] = useState(0);
  // true solo en el navegador (después de hidratar): el portal necesita document.body
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const goToSection = () => setScrollRequest((n) => n + 1);
  useEffect(() => {
    if (!scrollRequest) return;
    const raf = requestAnimationFrame(() => {
      const target =
        document.querySelector<HTMLElement>(
          ".catalog-plain-grid .catalog-slide, .catalog-swiper .swiper-slide",
        ) ?? document.querySelector<HTMLElement>(".catalog-filter-empty");
      if (!target) return;
      const header =
        document
          .querySelector<HTMLElement>(".site-header")
          ?.getBoundingClientRect().bottom ?? 0;
      const bar =
        document
          .querySelector<HTMLElement>(".catalog-filter-bar")
          ?.getBoundingClientRect().top ?? window.innerHeight;
      const visibleCenter =
        (Math.max(0, header) + Math.min(window.innerHeight, bar)) / 2;
      const r = target.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top + r.height / 2 - visibleCenter,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [scrollRequest, reduceMotion]);

  const toggleCategory = (name: string) => {
    setAuthor(null);
    setCategories((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      // Máximo 2: la tercera reemplaza a la más antigua
      return [...prev, name].slice(-MAX_CATEGORIES);
    });
    goToSection();
  };

  const chooseAuthor = (a: { name: string; slugs: string[] }) => {
    setCategories([]);
    setAuthor(a);
    setTerm("");
    goToSection();
  };

  const clear = () => {
    setCategories([]);
    setAuthor(null);
    goToSection();
  };

  const filterLabel = author
    ? `Libros de ${author.name}`
    : categories.length
      ? categories.join(" + ")
      : null;

  return (
    <div>
      {filterLabel ? (
        <div className="catalog-filter-status" role="status">
          <span>
            {filterLabel} · {filtered.length}{" "}
            {filtered.length === 1 ? "libro" : "libros"}
          </span>
          <button type="button" className="text-link" onClick={clear}>
            Ver todos
          </button>
        </div>
      ) : null}

      {filterLabel && filtered.length ? (
        <CatalogPlainGrid
          key={`${author?.name ?? ""}|${categories.join("|")}`}
          books={filtered}
        />
      ) : filtered.length ? (
        <CatalogGrid books={filtered} />
      ) : (
        <p className="catalog-filter-empty">
          No hay libros con esa combinación. Prueba con una sola categoría.
        </p>
      )}

      {/* La barra va en <body> (portal): así ninguna sección con z-index propio puede taparla */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {inView ? (
              <motion.div
                className="catalog-filter-bar"
                role="region"
                aria-label="Filtrar catálogo"
                initial={reduceMotion ? false : { y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { y: 120, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="catalog-filter-search">
                  <input
                    type="search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setTerm("")}
                    placeholder="Buscar libro o autor…"
                    aria-label="Buscar libro o autor"
                    aria-describedby="catalog-filter-hint"
                    autoComplete="off"
                  />
                  <span id="catalog-filter-hint" className="sr-only">
                    Escribe al menos {MIN_CHARS} letras
                  </span>
                  {q.length > 0 && q.length < MIN_CHARS ? (
                    <p className="catalog-filter-results is-hint">
                      Escribe al menos {MIN_CHARS} letras
                    </p>
                  ) : null}
                  {shown ? (
                    <div
                      className="catalog-filter-results"
                      role="listbox"
                      aria-label="Resultados"
                    >
                      {shown.books.length === 0 &&
                      shown.authors.length === 0 ? (
                        <p className="catalog-filter-none">
                          {searching ? "Buscando…" : "Sin resultados"}
                        </p>
                      ) : null}
                      {shown.authors.length ? (
                        <>
                          <p className="catalog-filter-group">Autores</p>
                          {shown.authors.map((a) => (
                            <button
                              key={a.name}
                              type="button"
                              role="option"
                              aria-selected={false}
                              onClick={() => chooseAuthor(a)}
                            >
                              <span
                                className="catalog-filter-avatar"
                                aria-hidden="true"
                              >
                                {a.name.charAt(0)}
                              </span>
                              <span>
                                <strong>{a.name}</strong>
                                <small>
                                  {a.slugs.length}{" "}
                                  {a.slugs.length === 1 ? "libro" : "libros"}
                                </small>
                              </span>
                            </button>
                          ))}
                        </>
                      ) : null}
                      {shown.books.length ? (
                        <>
                          <p className="catalog-filter-group">Libros</p>
                          {shown.books.map((b) => (
                            <button
                              key={b.slug}
                              type="button"
                              role="option"
                              aria-selected={false}
                              onClick={() => router.push(`/libros/${b.slug}`)}
                            >
                              {b.cover ? (
                                <Image
                                  src={b.cover}
                                  alt=""
                                  width={30}
                                  height={42}
                                  className="catalog-filter-thumb"
                                />
                              ) : (
                                <span
                                  className="catalog-filter-thumb"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                <strong>{b.title}</strong>
                                <small>{b.authors ?? "Nadar Ediciones"}</small>
                              </span>
                            </button>
                          ))}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={`catalog-filter-toggle${categories.length ? " has-active" : ""}`}
                  aria-expanded={chipsOpen}
                  aria-controls="catalog-filter-chips"
                  onClick={() => setChipsOpen((v) => !v)}
                >
                  Temas{categories.length ? ` · ${categories.length}` : ""}
                  <span aria-hidden="true">{chipsOpen ? "▾" : "▴"}</span>
                </button>

                <div
                  id="catalog-filter-chips"
                  className={`catalog-filter-chips${chipsOpen ? " is-open" : ""}`}
                  role="group"
                  aria-label={`Categorías (máximo ${MAX_CATEGORIES})`}
                >
                  {available.map((c) => {
                    const active = categories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={active}
                        className={active ? "is-active" : ""}
                        onClick={() => toggleCategory(c)}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
