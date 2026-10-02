"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AdminBook = {
  slug: string;
  title: string;
  subtitle: string;
  collection: string;
  image?: string;
  isbn?: string | null;
  price?: number | null;
  currency?: string | null;
  updatedAt?: string;
};

type FormState = {
  title: string;
  subtitle: string;
  collection: string;
  isbn: string;
  price: string;
};

const initialForm: FormState = {
  title: "",
  subtitle: "",
  collection: "",
  isbn: "",
  price: "",
};

export function AdminBooksManager() {
  const [items, setItems] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"local" | "supabase">("local");

  async function fetchBooks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/books", { cache: "no-store" });
      const data = (await res.json()) as { items: AdminBook[]; mode?: "local" | "supabase" };
      setItems(data.items ?? []);
      setMode(data.mode ?? "local");
    } catch {
      setError("No se pudo cargar el listado de libros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBooks();
  }, []);

  const modeLabel = useMemo(() => (editingSlug ? "Editar libro" : "Nuevo libro"), [editingSlug]);

  function resetForm() {
    setForm(initialForm);
    setEditingSlug(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      collection: form.collection,
      isbn: form.isbn,
      price: form.price ? Number(form.price) : undefined,
      currency: "CLP",
    };

    try {
      if (editingSlug) {
        const res = await fetch(`/api/admin/books/${editingSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("patch failed");
      } else {
        const res = await fetch("/api/admin/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("post failed");
      }

      resetForm();
      await fetchBooks();
    } catch {
      setError("No se pudo guardar el libro.");
    } finally {
      setSaving(false);
    }
  }

  function onEdit(book: AdminBook) {
    setEditingSlug(book.slug);
    setForm({
      title: book.title,
      subtitle: book.subtitle,
      collection: book.collection,
      isbn: book.isbn ?? "",
      price: book.price ? String(book.price) : "",
    });
  }

  async function onDelete(slug: string) {
    const ok = window.confirm("Eliminar este libro del listado?");
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/books/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      if (editingSlug === slug) resetForm();
      await fetchBooks();
    } catch {
      setError("No se pudo eliminar el libro.");
    }
  }

  return (
    <section className="admin-crud">
      <article className="admin-panel">
        <h3>{modeLabel}</h3>
        <p className="admin-mode">Modo actual: {mode === "supabase" ? "Supabase" : "Local"}</p>
        <form className="admin-form" onSubmit={onSubmit}>
          <label>
            Titulo
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Autor / Subtitulo
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            />
          </label>
          <label>
            Coleccion
            <input
              type="text"
              value={form.collection}
              onChange={(e) => setForm((prev) => ({ ...prev, collection: e.target.value }))}
            />
          </label>
          <label>
            ISBN
            <input
              type="text"
              value={form.isbn}
              onChange={(e) => setForm((prev) => ({ ...prev, isbn: e.target.value }))}
            />
          </label>
          <label>
            Precio CLP
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            />
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando..." : editingSlug ? "Actualizar" : "Crear"}
            </button>
            {editingSlug ? (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="admin-panel">
        <h3>Libros</h3>
        {error ? <p className="admin-error">{error}</p> : null}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Titulo</th>
                  <th>Coleccion</th>
                  <th>ISBN</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((book) => (
                  <tr key={book.slug}>
                    <td>
                      <div className="admin-book-thumb-wrap">
                        <Image
                          src={book.image ?? "/images/books/671-historia-de-una-montana-de-elisee-reclus.png"}
                          alt={`Portada de ${book.title}`}
                          width={56}
                          height={74}
                          className="admin-book-thumb"
                        />
                      </div>
                    </td>
                    <td>{book.title}</td>
                    <td>{book.collection}</td>
                    <td>{book.isbn ?? "-"}</td>
                    <td>
                      {book.price
                        ? `${new Intl.NumberFormat("es-CL").format(book.price)} ${book.currency ?? "CLP"}`
                        : "-"}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" className="pill" onClick={() => onEdit(book)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="pill pill-danger"
                          onClick={() => onDelete(book.slug)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}

