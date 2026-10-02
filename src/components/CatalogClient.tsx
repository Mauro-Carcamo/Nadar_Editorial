"use client";

import { useMemo, useState } from "react";
import { BookGrid } from "@/components/BookGrid";
import { Book } from "@/data/site";

type Props = {
  books: Book[];
};

export function CatalogClient({ books }: Props) {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("Todas");

  const collections = useMemo(() => {
    const unique = Array.from(new Set(books.map((b) => b.collection))).sort();
    return ["Todas", ...unique];
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      const byCollection = activeCollection === "Todas" || book.collection === activeCollection;
      const haystack = [book.title, book.subtitle, book.bajada, book.isbn ?? "", book.subject ?? ""]
        .join(" ")
        .toLowerCase();
      const byQuery = !q || haystack.includes(q);
      return byCollection && byQuery;
    });
  }, [books, query, activeCollection]);

  return (
    <>
      <div className="container filter-panel" role="region" aria-label="Filtros de catalogo">
        <label className="search-label" htmlFor="catalog-search">
          Buscar por titulo, autor, ISBN o materia
        </label>
        <input
          id="catalog-search"
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej: Reclus, geografia, 978..."
        />

        <div className="filter-row">
          {collections.map((collection) => (
            <button
              key={collection}
              type="button"
              className={`pill ${collection === activeCollection ? "pill-active" : ""}`}
              onClick={() => setActiveCollection(collection)}
            >
              {collection}
            </button>
          ))}
        </div>
      </div>

      <div className="container catalog-results-head">
        <p>
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          {activeCollection !== "Todas" ? ` en ${activeCollection}` : ""}
        </p>
      </div>

      <div className="container">
        {filtered.length > 0 ? (
          <BookGrid books={filtered} />
        ) : (
          <div className="empty-state">
            <h2>Sin resultados</h2>
            <p>Prueba otra combinacion de filtros o una busqueda mas amplia.</p>
            <button type="button" className="btn btn-outline" onClick={() => { setQuery(""); setActiveCollection("Todas"); }}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </>
  );
}
