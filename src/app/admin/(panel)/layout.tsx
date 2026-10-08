import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { requireAdminPage } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Administración | Nadar Ediciones",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/carritos", label: "Carritos" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/libros", label: "Libros" },
  { href: "/admin/descuentos", label: "Descuentos" },
  { href: "/admin/mensajes", label: "Mensajes" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // Segunda barrera (además de proxy.ts): cada render del panel valida la sesión en el servidor
  const session = await requireAdminPage();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h1>Nadar Admin</h1>
        <nav aria-label="Administración">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-user">
          <p>
            {session.name ?? session.email}
            <small>{session.role}</small>
          </p>
          <AdminLogoutButton />
          <Link href="/" className="text-link">
            Ver sitio
          </Link>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
