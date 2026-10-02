import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Acceso administración | Nadar Ediciones",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Solo rutas internas del panel (evita redirecciones abiertas)
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <p className="home-hero-eyebrow">Nadar Ediciones</p>
        <h1>Administración</h1>
        <p className="admin-login-help">Ingresa con tu cuenta de administrador.</p>
        <AdminLoginForm next={safeNext} />
      </div>
    </main>
  );
}
