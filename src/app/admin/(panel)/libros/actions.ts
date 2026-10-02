"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/admin";
import { BookFormSchema, type BookFormInput } from "@/schemas/book";
import { BookConflictError, deleteBook, saveBook } from "@/services/catalog/admin-books";

// Acciones del editor de libros. Cada una vuelve a verificar la sesión y el rol en el servidor.

const CATALOG_ROLES = ["super_admin", "admin", "editor"];

export type BookActionResult =
  | { ok: true; id: string; slug: string; archived?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireCatalogEditor() {
  const session = await getAdminSession();
  if (!session || !CATALOG_ROLES.includes(session.role)) return null;
  return session;
}

function revalidateCatalog(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/libros/${slug}`);
}

export async function saveBookAction(id: string | null, input: BookFormInput): Promise<BookActionResult> {
  const session = await requireCatalogEditor();
  if (!session) return { ok: false, message: "No tienes permisos para editar el catálogo" };

  const parsed = BookFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: "Revisa los campos marcados", fieldErrors };
  }

  try {
    const result = await saveBook(id, parsed.data, session.sub);
    revalidateCatalog(result.slug);
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof BookConflictError) {
      return { ok: false, message: error.message, fieldErrors: { [error.field]: error.message } };
    }
    console.error("[admin/libros] saveBook", error);
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo guardar el libro" };
  }
}

export async function deleteBookAction(id: string): Promise<BookActionResult> {
  const session = await requireCatalogEditor();
  if (!session) return { ok: false, message: "No tienes permisos para editar el catálogo" };
  try {
    const result = await deleteBook(id, session.sub);
    revalidateCatalog(result.slug);
    return { ok: true, id, ...result };
  } catch (error) {
    console.error("[admin/libros] deleteBook", error);
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo eliminar el libro" };
  }
}
