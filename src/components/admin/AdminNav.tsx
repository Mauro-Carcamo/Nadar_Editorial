"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Menú del panel en dos áreas: lo comercial (ventas, pagos, stock, campañas) y la edición de la web
// (libros y todo el contenido que se muestra en el sitio).
const GROUPS = [
  {
    label: "Comercial",
    items: [
      { href: "/admin", label: "Resumen", exact: true },
      { href: "/admin/pedidos", label: "Pedidos" },
      { href: "/admin/pagos", label: "Pagos" },
      { href: "/admin/carritos", label: "Carritos" },
      { href: "/admin/inventario", label: "Inventario" },
      { href: "/admin/descuentos", label: "Descuentos" },
      { href: "/admin/mensajes", label: "Mensajes" },
    ],
  },
  {
    label: "Editar web",
    items: [
      { href: "/admin/web", label: "Centro de edición", exact: true },
      { href: "/admin/libros", label: "Libros" },
      { href: "/admin/web/destacados", label: "Destacados (hero)" },
      { href: "/admin/web/colecciones", label: "Colecciones" },
      { href: "/admin/web/puntos-de-venta", label: "Puntos de venta" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración" className="admin-nav">
      {GROUPS.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <p className="admin-nav-label">{group.label}</p>
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
