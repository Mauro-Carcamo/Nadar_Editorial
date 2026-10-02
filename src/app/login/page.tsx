import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="section section-light">
      <div className="container auth-card">
        <p className="eyebrow">Acceso</p>
        <h1>Iniciar sesion</h1>
        <p>Flujo inicial local. Se conectara a Supabase Auth en la siguiente fase.</p>
        <form className="contact-form" action="#" method="post">
          <label>
            Correo
            <input type="email" placeholder="tu@correo.cl" />
          </label>
          <label>
            Contrasena
            <input type="password" placeholder="********" />
          </label>
          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>
        <Link href="/checkout?mode=guest" className="text-link">
          Continuar como invitado
        </Link>
      </div>
    </main>
  );
}

