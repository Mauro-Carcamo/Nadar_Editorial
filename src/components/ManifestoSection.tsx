import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

// Textos del proyecto editorial (Docs/16_Contenido_Editorial_Base.md)
const pillars = [
  {
    title: "Qué publicamos",
    text: "Ensayo, pensamiento crítico, historia intelectual, poéticas del territorio y cruces entre investigación y escritura.",
  },
  {
    title: "Cómo editamos",
    text: "Trabajamos cada libro como una pieza de largo alcance: edición cuidada, circulación sostenida y diálogo con comunidades lectoras.",
  },
  {
    title: "Para quién",
    text: "Para lectoras y lectores interesados en imaginar nuevas formas de vida común desde la lectura.",
  },
];

export function ManifestoSection() {
  return (
    <section className="home-manifesto" aria-labelledby="home-manifesto-title">
      <div className="container">
        <Reveal>
          <p className="home-hero-eyebrow">Nadar Ediciones</p>
          <h2 id="home-manifesto-title" className="home-manifesto-statement">
            Libros de arte y crítica para leer el presente <em>desde múltiples orillas.</em>
          </h2>
        </Reveal>

        <div className="home-manifesto-pillars">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={0.15 * index}>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <Link href="/proyecto" className="text-link home-manifesto-link">
            Conocer el proyecto editorial <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
