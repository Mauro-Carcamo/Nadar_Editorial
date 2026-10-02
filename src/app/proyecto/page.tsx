import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function ProyectoPage() {
  return (
    <>
      <SiteHeader />
      <main className="section section-light">
        <div className="container page-intro">
          <p className="eyebrow">Proyecto Editorial</p>
          <h1>Editar para abrir preguntas</h1>
          <p>
            Nadar Ediciones publica libros que activan lectura critica, memoria y conversacion
            publica entre disciplinas.
          </p>
        </div>

        <div className="container feature-grid">
          <article>
            <h3>Que publicamos</h3>
            <p>
              Ensayo, pensamiento critico, historia intelectual y cruces entre investigacion,
              escritura y arte.
            </p>
          </article>
          <article>
            <h3>Como editamos</h3>
            <p>
              Cada libro se trabaja como una pieza de largo alcance: criterio editorial, diseño
              cuidado y circulacion sostenida.
            </p>
          </article>
          <article>
            <h3>Para quien</h3>
            <p>
              Para lectoras y lectores que buscan herramientas para imaginar nuevas formas de vida
              comun desde la lectura.
            </p>
          </article>
        </div>

        <div className="container cta-row">
          <Link className="btn btn-primary" href="/libros">
            Ir al catalogo
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
