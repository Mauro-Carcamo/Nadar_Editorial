"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { deleteBookAction, saveBookAction } from "@/app/admin/(panel)/libros/actions";
import {
  BOOK_STATUSES,
  BookFormSchema,
  PERSON_ROLES,
  PERSON_ROLE_LABEL,
  type BookFormData,
  type BookFormInput,
} from "@/schemas/book";

// Editor de libro: React Hook Form + Zod en el cliente; la acción del servidor vuelve a validar.

const STATUS_LABEL: Record<(typeof BOOK_STATUSES)[number], string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);

type Props = {
  id: string | null;
  defaultValues: BookFormInput;
  collections: { id: string; name: string; series: string[] }[];
  authorOptions: string[];
  categoryOptions: string[];
  hasOrders?: boolean;
};

export function BookForm({ id, defaultValues, collections, authorOptions, categoryOptions, hasOrders }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    watch,
    formState: { errors, isDirty },
  } = useForm<BookFormInput, unknown, BookFormData>({ resolver: zodResolver(BookFormSchema), defaultValues });
  const people = useFieldArray({ control, name: "people" });

  // Aviso del navegador si se intenta salir con cambios sin guardar
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const collectionId = watch("collectionId");
  const coverUrl = watch("coverUrl");
  const series = collections.find((c) => c.id === collectionId)?.series ?? [];

  // Se envían los valores crudos del formulario: el servidor aplica el mismo esquema
  const onSubmit = handleSubmit(() => {
    setNotice(null);
    startTransition(async () => {
      const result = await saveBookAction(id, getValues());
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as FieldPath<BookFormInput>, { message });
        }
        setNotice({ tone: "error", text: result.message });
        return;
      }
      if (!id) {
        router.push(`/admin/libros/${result.id}`);
        return;
      }
      setValue("slug", result.slug);
      setValue("stockNote", "");
      setNotice({ tone: "ok", text: "Cambios guardados" });
      router.refresh();
    });
  });

  const onDelete = () => {
    if (!id) return;
    const message = hasOrders
      ? "Este libro tiene pedidos: se archivará (deja de verse en la tienda) en lugar de eliminarse. ¿Continuar?"
      : "¿Eliminar este libro de forma permanente?";
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const result = await deleteBookAction(id);
      if (!result.ok) {
        setNotice({ tone: "error", text: result.message });
        return;
      }
      router.push("/admin/libros");
      router.refresh();
    });
  };

  const onCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const bitmap = await createImageBitmap(file);
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "No se pudo subir la imagen");
      setValue("coverUrl", json.url, { shouldDirty: true });
      setValue("coverWidth", String(bitmap.width), { shouldDirty: true });
      setValue("coverHeight", String(bitmap.height), { shouldDirty: true });
      bitmap.close();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "No se pudo subir la imagen" });
    } finally {
      setUploading(false);
    }
  };

  const err = (name: string) => {
    const message = name.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], errors) as
      | { message?: string }
      | undefined;
    return message?.message ? <span className="book-form-error">{message.message}</span> : null;
  };

  return (
    <form className="book-form" onSubmit={onSubmit} noValidate>
      <div className="book-form-main">
        <fieldset className="admin-panel">
          <legend>Datos principales</legend>
          <label className="book-form-wide">
            Título
            <input
              {...register("title", {
                onBlur: (e) => {
                  if (!getValues("slug")) setValue("slug", slugify(e.target.value));
                },
              })}
            />
            {err("title")}
          </label>
          <label>
            Dirección (slug)
            <input {...register("slug")} placeholder="se genera desde el título" />
            {err("slug")}
          </label>
          <label>
            ISBN
            <input {...register("isbn")} placeholder="978-956-..." />
            {err("isbn")}
          </label>
          <label className="book-form-wide">
            Bajada
            <textarea rows={2} {...register("bajada")} />
            {err("bajada")}
          </label>
          <label className="book-form-wide">
            Descripción
            <textarea rows={8} {...register("description")} />
            {err("description")}
          </label>
        </fieldset>

        <fieldset className="admin-panel">
          <legend>Autores y colaboradores</legend>
          <datalist id="book-form-authors">
            {authorOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <ul className="book-form-people book-form-wide">
            {people.fields.map((field, index) => (
              <li key={field.id}>
                <input list="book-form-authors" aria-label="Nombre" {...register(`people.${index}.name`)} />
                <select aria-label="Rol" {...register(`people.${index}.role`)}>
                  {PERSON_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {PERSON_ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-outline" onClick={() => index > 0 && people.move(index, index - 1)} aria-label="Subir">
                  ↑
                </button>
                <button type="button" className="btn btn-outline" onClick={() => people.remove(index)} aria-label="Quitar">
                  ×
                </button>
                {err(`people.${index}.name`)}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-outline" onClick={() => people.append({ name: "", role: "author" })}>
            Agregar persona
          </button>
          <label className="book-form-wide">
            Sobre el autor
            <textarea rows={5} {...register("authorBio")} />
          </label>
        </fieldset>

        <fieldset className="admin-panel">
          <legend>Ficha técnica</legend>
          <label>
            Año
            <input inputMode="numeric" {...register("year")} />
            {err("year")}
          </label>
          <label>
            Páginas
            <input inputMode="numeric" {...register("pages")} />
            {err("pages")}
          </label>
          <label>
            Tamaño
            <input {...register("size")} placeholder="14 x 21 cm" />
          </label>
          <label>
            Materia
            <input {...register("subject")} placeholder="861CH - Poesía chilena" />
          </label>
          <label className="book-form-wide">
            Temas (separados por coma)
            <Controller
              control={control}
              name="categories"
              render={({ field }) => (
                <input
                  list="book-form-categories"
                  defaultValue={field.value.join(", ")}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  onBlur={field.onBlur}
                />
              )}
            />
            <datalist id="book-form-categories">
              {categoryOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {err("categories")}
          </label>
        </fieldset>
      </div>

      <aside className="book-form-side">
        <fieldset className="admin-panel">
          <legend>Publicación</legend>
          <label>
            Estado
            <select {...register("status")}>
              {BOOK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Colección
            <select {...register("collectionId")}>
              <option value="">Sin colección</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Serie
            <input list="book-form-series" {...register("series")} />
            <datalist id="book-form-series">
              {series.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label>
            Ranking de ventas
            <input inputMode="numeric" {...register("salesRank")} placeholder="1 = más vendido" />
            {err("salesRank")}
          </label>
          <label className="book-form-check">
            <input type="checkbox" {...register("featured")} /> Destacado
          </label>
        </fieldset>

        <fieldset className="admin-panel">
          <legend>Venta e inventario</legend>
          <label>
            Precio (CLP)
            <input inputMode="numeric" {...register("price")} placeholder="vacío = no se vende" />
            {err("price")}
          </label>
          <label>
            Stock total
            <input inputMode="numeric" {...register("stock")} />
            {err("stock")}
          </label>
          <label>
            Motivo del ajuste
            <input {...register("stockNote")} placeholder="Reimpresión, merma, conteo..." />
          </label>
        </fieldset>

        <fieldset className="admin-panel">
          <legend>Portada</legend>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="book-form-cover" src={coverUrl} alt="Portada actual" />
          ) : (
            <p className="admin-empty">Sin portada</p>
          )}
          <label>
            Subir imagen (JPG, PNG o WebP, máx. 5 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => onCover(e.target.files?.[0])}
            />
          </label>
          {uploading ? <p className="admin-sub">Subiendo...</p> : null}
        </fieldset>

        <div className="book-form-actions">
          {notice ? (
            <p className={notice.tone === "ok" ? "book-form-ok" : "book-form-error"} role="status">
              {notice.text}
            </p>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={pending || uploading}>
            {pending ? "Guardando..." : id ? "Guardar cambios" : "Crear libro"}
          </button>
          {id ? (
            <button className="btn btn-outline book-form-delete" type="button" onClick={onDelete} disabled={pending}>
              {hasOrders ? "Archivar" : "Eliminar"}
            </button>
          ) : null}
          {isDirty && !pending ? <p className="admin-sub">Hay cambios sin guardar</p> : null}
        </div>
      </aside>
    </form>
  );
}
