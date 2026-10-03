import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { ContactInfo } from "@/components/ContactInfo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

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

            <ContactInfo source="contacto" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
