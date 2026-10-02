import { money } from "@/components/admin/format";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const { rows } = await query<{
    title: string;
    isbn: string | null;
    price: number | null;
    collection: string | null;
    stock: number;
    reserved: number;
    available: number;
  }>(
    `SELECT b.title, b.isbn, b.price, c.name AS collection, i.stock, i.reserved, i.available
     FROM books b JOIN inventory i ON i.book_id = b.id LEFT JOIN collections c ON c.id = b.collection_id
     ORDER BY i.available, b.title`,
  );

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Operación</p>
        <h2>Inventario</h2>
        <p className="admin-sub">
          Disponible = stock − reservado. Las reservas se crean al iniciar un pago y se liberan si el pago no se completa.
          El stock inicial (20 por libro con precio) es de prueba.
        </p>
      </header>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Colección</th>
              <th>ISBN</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Reservado</th>
              <th>Disponible</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.title + r.isbn}>
                <td>{r.title}</td>
                <td>{r.collection ?? "—"}</td>
                <td className="admin-mono">{r.isbn ?? "—"}</td>
                <td>{r.price !== null ? money(r.price) : "Sin precio"}</td>
                <td>{r.stock}</td>
                <td>{r.reserved}</td>
                <td>
                  <strong className={r.available <= 3 ? "admin-low" : ""}>{r.available}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
