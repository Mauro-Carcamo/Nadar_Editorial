"use client";

import { useState } from "react";

export function AdminLoginForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (res.ok) {
        window.location.assign(next);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo iniciar sesión.");
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={onSubmit} noValidate>
      <label>
        Correo
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Clave
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? (
        <p className="admin-login-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
