import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Administración | Nadar Ediciones",
  robots: { index: false, follow: false },
};


export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // Segunda barrera (además de proxy.ts): cada render del panel valida la sesión en el servidor
  const session = await requireAdminPage();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h1>Nadar Admin</h1>
        <AdminNav />
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
