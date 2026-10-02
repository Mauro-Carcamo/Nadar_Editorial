import Link from "next/link";
import { AdminBooksManager } from "@/components/AdminBooksManager";

const stats = [
  { label: "Visitas hoy", value: "1.284" },
  { label: "Eventos", value: "6.942" },
  { label: "Libros locales", value: "12+" },
  { label: "CTR catalogo", value: "12.4%" },
];

export default function AdminPage() {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <h1>Nadar Admin</h1>
        <nav>
          <a href="#">Dashboard</a>
          <a href="#crud-libros">Libros</a>
          <a href="#">Paginas</a>
          <a href="#">Media</a>
          <a href="#">Importaciones</a>
          <a href="#">Analitica</a>
        </nav>
        <Link href="/" className="text-link">
          Volver al sitio
        </Link>
      </aside>

      <section className="admin-main" id="crud-libros">
        <header className="admin-head">
          <p className="eyebrow">Dashboard</p>
          <h2>Resumen de uso</h2>
        </header>

        <div className="admin-kpi-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="admin-kpi-card">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>

        <AdminBooksManager />
      </section>
    </main>
  );
}
