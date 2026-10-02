import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SocialLinks } from "@/components/SocialLinks";

export default function ContactoPage() {
  return (
    <>
      <SiteHeader />
      <main className="section section-light">
        <div className="container page-intro">
          <p className="eyebrow">Contacto</p>
          <h1>Conversemos</h1>
          <p>Para consultas de catalogo, prensa, actividades o colaboraciones editoriales.</p>
        </div>

        <div className="container contact-form-wrap">
          <form className="contact-form" action="#" method="post">
            <label>
              Nombre
              <input type="text" name="name" placeholder="Tu nombre" />
            </label>
            <label>
              Correo
              <input type="email" name="email" placeholder="tu@correo.cl" />
            </label>
            <label>
              Mensaje
              <textarea name="message" rows={5} placeholder="Escribe tu mensaje" />
            </label>
            <button type="submit" className="btn btn-primary">
              Enviar mensaje
            </button>
          </form>
        </div>

        <div className="container social-section">
          <h2>Redes sociales</h2>
          <p>Sigue a Nadar Ediciones en sus canales oficiales.</p>
          <SocialLinks source="contacto" ariaLabel="Redes sociales Nadar Ediciones" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

