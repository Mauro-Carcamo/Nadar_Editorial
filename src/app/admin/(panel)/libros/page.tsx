import { AdminBooksManager } from "@/components/AdminBooksManager";

export default function AdminBooksPage() {
  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Catálogo</p>
        <h2>Libros</h2>
        <p className="admin-sub">
          Editor existente (sobre el catálogo en memoria). En la Fase 8 pasa a PostgreSQL con validación Zod, autores,
          categorías, imágenes e inventario.
        </p>
      </header>
      <AdminBooksManager />
    </>
  );
}
