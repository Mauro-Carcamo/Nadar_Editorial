import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SocialLinks } from "@/components/SocialLinks";

export const metadata: Metadata = {
  title: "Contacto | Nadar Ediciones",
  description: "Escríbenos por consultas de catálogo, pedidos, prensa, librerías o propuestas editoriales.",
};

export default function ContactoPage() {
  return (
    <>
      <SiteHeader />
      <main className="contact-page">
        <div className="container">
          <header className="page-intro">
            <p className="home-hero-eyebrow">Contacto</p>
            <h1 className="home-collections-heading">Conversemos</h1>
            <p>Consultas de catálogo, pedidos, prensa, librerías o propuestas editoriales.</p>
          </header>

          <div className="contact-layout">
            <ContactForm />

            <aside className="contact-info" aria-label="Datos de contacto">
              <section>
                <h2>Correo</h2>
                <p>
                  <a href="mailto:contacto@nadarediciones.cl">contacto@nadarediciones.cl</a>
                </p>
              </section>
              <section>
                <h2>Correspondencia</h2>
                <address>
                  Padre Mariano 391, Of. 704
                  <br />
                  Providencia, Santiago de Chile
                </address>
              </section>
              <section>
                <h2>Redes</h2>
                <SocialLinks source="contacto" ariaLabel="Redes sociales Nadar Ediciones" />
              </section>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
