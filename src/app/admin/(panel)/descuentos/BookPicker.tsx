"use client";

import { useMemo, useState } from "react";

type Option = { id: string; title: string; authors: string | null; price: number | null };

const money = (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`;
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Selección de libros para una campaña: buscador, marcar varios a la vez y un solo porcentaje.
 * Va dentro de un <form> de servidor: cada libro marcado se envía como "bookId".
 */
export function BookPicker({ options }: { options: Option[] }) {
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState(30);

  const visible = useMemo(() => {
    const t = norm(term.trim());
    return t ? options.filter((o) => norm(`${o.title} ${o.authors ?? ""}`).includes(t)) : options;
  }, [options, term]);
  const sellable = visible.filter((o) => o.price !== null);
  const allVisibleSelected = sellable.length > 0 && sellable.every((o) => selected.has(o.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const o of sellable) {
        if (allVisibleSelected) next.delete(o.id);
        else next.add(o.id);
      }
      return next;
    });

  const valid = percent >= 1 && percent <= 90;

  return (
    <div className="book-picker">
      <div className="book-picker-bar">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por título o autor…"
          aria-label="Buscar libros"
        />
        <button type="button" className="btn btn-outline" onClick={toggleVisible} disabled={!sellable.length}>
          {allVisibleSelected ? "Quitar selección" : "Marcar todos"}
        </button>
      </div>

      <ul className="book-picker-list">
        {visible.map((o) => {
          const disabled = o.price === null;
          return (
            <li key={o.id} className={disabled ? "is-disabled" : selected.has(o.id) ? "is-selected" : ""}>
              <label>
                <input
                  type="checkbox"
                  name="bookId"
                  value={o.id}
                  checked={selected.has(o.id)}
                  disabled={disabled}
                  onChange={() => toggle(o.id)}
                />
                <span className="book-picker-title">
                  {o.title}
                  {o.authors ? <small>{o.authors}</small> : null}
                </span>
                <span className="book-picker-price">
                  {o.price === null ? (
                    <small>Sin precio</small>
                  ) : selected.has(o.id) && valid ? (
                    <>
                      <s>{money(o.price)}</s> <strong>{money(Math.round((o.price * (100 - percent)) / 100))}</strong>
                    </>
                  ) : (
                    money(o.price)
                  )}
                </span>
              </label>
            </li>
          );
        })}
        {!visible.length ? <li className="book-picker-empty">No hay libros con esa búsqueda.</li> : null}
      </ul>

      <div className="book-picker-foot">
        <label className="admin-percent">
          Descuento
          <input
            type="number"
            name="percent"
            min={1}
            max={90}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            required
          />
          %
        </label>
        <button className="btn btn-primary" disabled={!selected.size || !valid}>
          {selected.size ? `Aplicar a ${selected.size} ${selected.size === 1 ? "libro" : "libros"}` : "Elige libros"}
        </button>
      </div>
    </div>
  );
}
