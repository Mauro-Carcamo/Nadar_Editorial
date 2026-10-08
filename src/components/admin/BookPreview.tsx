"use client";

import type { Book } from "@/data/book-utils";
import { getShortDescription, joinNames, splitTitle } from "@/data/book-utils";

const money = (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`;

type Props = {
  title: string;
  bajada: string;
  description: string;
  people: { name: string; role: string }[];
  price: string;
  coverUrl: string;
};

/**
 * Vista previa en vivo del libro en las secciones del sitio, con los mismos recortes de texto
 * que usa la web: título del hero, texto corto de Colecciones y tarjeta del catálogo.
 */
export function BookPreview({ title, bajada, description, people, price, coverUrl }: Props) {
  const { main, rest } = splitTitle(title || "Título del libro");
  const authors =
    joinNames(people.filter((p) => ["author", "editor", "coordinator"].includes(p.role) && p.name.trim()).map((p) => p.name.trim())) ||
    "Autor/a";
  const short = getShortDescription({ bajada, description } as Book);
  const priceNumber = Number(price);
  const cover = coverUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={coverUrl} alt="" />
  ) : (
    <span className="book-preview-nocover">Sin portada</span>
  );

  return (
    <fieldset className="admin-panel book-preview">
      <legend>Así se ve en el sitio</legend>

      <div className="book-preview-grid">
        <figure className="book-preview-block">
          <figcaption>Destacados (hero)</figcaption>
          <div className="book-preview-hero">
            <span className="book-preview-cover">{cover}</span>
            <strong>{main}</strong>
          </div>
        </figure>

        <figure className="book-preview-block">
          <figcaption>Catálogo</figcaption>
          <div className="book-preview-card">
            <span className="book-preview-cover">{cover}</span>
            <strong>{title || "Título del libro"}</strong>
            <small>{authors}</small>
            <em>{priceNumber > 0 ? money(priceNumber) : "Consultar"}</em>
          </div>
        </figure>

        <figure className="book-preview-block is-wide">
          <figcaption>Colecciones</figcaption>
          <div className="book-preview-collection">
            <span className="book-preview-cover">{cover}</span>
            <div>
              <strong>{main}</strong>
              {rest ? <span className="book-preview-sub">{rest}</span> : null}
              <small>{authors}</small>
              <p>{short || <span className="book-preview-missing">Sin bajada ni descripción: aquí no aparecerá texto.</span>}</p>
            </div>
          </div>
        </figure>
      </div>
    </fieldset>
  );
}
