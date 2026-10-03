import { ContactBackground } from "@/components/ContactBackground";
import { Reveal } from "@/components/motion/Reveal";
import { SocialLinks } from "@/components/SocialLinks";

export function HomeContactSection() {
  return (
    <section id="contacto" className="home-contact" aria-labelledby="home-contact-title">
      {/* Fondo: ilustración del pez volador y los pescadores (página Amistad del sitio original), con parallax lento */}
      <ContactBackground />
      <div className="container home-contact-inner">
        <Reveal>
          <header className="home-contact-head">
            <p className="home-hero-eyebrow">Contacto</p>
            <h2 id="home-contact-title" className="home-collections-heading">
              Contáctanos
            </h2>
            <p className="home-pos-intro">Consultas de catálogo, pedidos, prensa, librerías o propuestas editoriales.</p>
          </header>
        </Reveal>
        <div className="home-contact-details">
          <p>
            <a href="mailto:contacto@nadarediciones.cl">contacto@nadarediciones.cl</a>
          </p>
          <address>Padre Mariano 391, Of. 704 · Providencia, Santiago de Chile</address>
        </div>
        <SocialLinks source="home" variant="icons" ariaLabel="Redes sociales de Nadar Ediciones" />
      </div>
    </section>
  );
}
