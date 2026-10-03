import { SocialLinks } from "@/components/SocialLinks";

// Datos de contacto de la editorial (sitio original, /contacto)
export function ContactInfo({ source }: { source: "contacto" | "home" }) {
  return (
    <aside className="contact-info" aria-label="Datos de contacto">
      <section>
        <h3>Correo</h3>
        <p>
          <a href="mailto:contacto@nadarediciones.cl">contacto@nadarediciones.cl</a>
        </p>
      </section>
      <section>
        <h3>Correspondencia</h3>
        <address>
          Padre Mariano 391, Of. 704
          <br />
          Providencia, Santiago de Chile
        </address>
      </section>
      <section>
        <h3>Redes</h3>
        <SocialLinks source={source} ariaLabel="Redes sociales Nadar Ediciones" />
      </section>
    </aside>
  );
}
