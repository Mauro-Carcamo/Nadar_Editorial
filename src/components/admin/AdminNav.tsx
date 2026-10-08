"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

/** Menú del panel con la sección actual marcada. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración" className="admin-nav">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
