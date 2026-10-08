"use client";

import { useMemo, useState } from "react";
import { saveHeroBooks } from "../actions";

type BookOption = { id: string; title: string; authors: string | null; cover: string | null };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const MAX = 10;

/** Elegir y ordenar los libros del carrusel del inicio (Top 10 Destacados). */
export function HeroEditor({ books, initial }: { books: BookOption[]; initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [term, setTerm] = useState("");
  const byId = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const dirty = selected.join() !== initial.join();

  const results = useMemo(() => {
    const t = norm(term.trim());
    return books.filter((b) => !selected.includes(b.id) && (!t || norm(`${b.title} ${b.authors ?? ""}`).includes(t)));
  }, [books, selected, term]);

  const move = (index: number, delta: number) =>
    setSelected((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <form action={saveHeroBooks} className="hero-editor">
      <section className="admin-panel">
        <h3>
          En el carrusel <small>({selected.length} de {MAX})</small>
        </h3>
        {selected.length ? (
          <ol className="hero-editor-list">
            {selected.map((id, index) => {
              const book = byId.get(id);
              if (!book) return null;
              return (
                <li key={id}>
                  <input type="hidden" name="bookId" value={id} />
                  <span className="hero-editor-rank">{String(index + 1).padStart(2, "0")}</span>
                  {book.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover} alt="" className="hero-editor-cover" />
                  ) : (
                    <span className="hero-editor-cover is-empty" />
                  )}
                  <span className="hero-editor-title">
                    {book.title}
                    {book.authors ? <small>{book.authors}</small> : null}
                  </span>
                  <span className="hero-editor-actions">
                    <button type="button" className="btn btn-outline" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir">
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => move(index, 1)}
                      disabled={index === selected.length - 1}
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline pill-danger"
                      onClick={() => setSelected((prev) => prev.filter((x) => x !== id))}
                      aria-label={`Quitar ${book.title}`}
                    >
                      Quitar
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="admin-empty">Sin libros elegidos: el carrusel mostrará los 10 más recientes del catálogo.</p>
        )}
        <div className="hero-editor-save">
          <button className="btn btn-primary" disabled={!dirty}>
            Guardar destacados
          </button>
          {dirty ? <span className="admin-sub">Hay cambios sin guardar</span> : null}
        </div>
      </section>

      <section className="admin-panel">
        <h3>Agregar libros</h3>
        <input
          type="search"
          className="hero-editor-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por título o autor…"
          aria-label="Buscar libros"
        />
        <ul className="hero-editor-results">
          {results.slice(0, 40).map((b) => (
            <li key={b.id}>
              <span className="hero-editor-title">
                {b.title}
                {b.authors ? <small>{b.authors}</small> : null}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                disabled={selected.length >= MAX}
                onClick={() => setSelected((prev) => [...prev, b.id])}
              >
                Agregar
              </button>
            </li>
          ))}
        </ul>
        {selected.length >= MAX ? <p className="admin-sub">Ya hay 10 destacados: quita uno para agregar otro.</p> : null}
      </section>
    </form>
  );
}
