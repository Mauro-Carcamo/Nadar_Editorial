import { ContactForm } from "@/components/ContactForm";
import { ContactInfo } from "@/components/ContactInfo";
import { Reveal } from "@/components/motion/Reveal";

export function HomeContactSection() {
  return (
    <section id="contacto" className="home-contact" aria-labelledby="home-contact-title">
      <div className="container">
        <Reveal>
          <header className="home-catalog-head">
            <div>
              <p className="home-hero-eyebrow">Contacto</p>
              <h2 id="home-contact-title" className="home-collections-heading">
                Conversemos
              </h2>
              <p className="home-pos-intro">Consultas de catálogo, pedidos, prensa, librerías o propuestas editoriales.</p>
            </div>
          </header>
        </Reveal>
        <div className="contact-layout">
          <ContactForm />
          <ContactInfo source="home" />
        </div>
      </div>
    </section>
  );
}
