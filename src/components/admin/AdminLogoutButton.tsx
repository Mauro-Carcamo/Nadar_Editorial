"use client";

export function AdminLogoutButton() {
  return (
    <button
      type="button"
      className="btn btn-outline admin-logout"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/admin/login");
      }}
    >
      Cerrar sesión
    </button>
  );
}
