"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

// Textos del proyecto editorial (Docs/16_Contenido_Editorial_Base.md)
const pillars = [
  {
    title: "Qué publicamos",
    text: "Ensayo, pensamiento crítico, historia intelectual y poéticas del territorio.",
  },
  {
    title: "Cómo editamos",
    text: "Cada libro como una pieza de largo alcance: edición cuidada y circulación sostenida.",
  },
  {
    title: "Para quién",
    text: "Para quienes imaginan nuevas formas de vida común desde la lectura.",
  },
];

/**
 * Sección "de paso": queda fija detrás de la página (sticky) mientras Colecciones sube y la cubre.
 * Al entrar emerge desde abajo del hero; al quedar atrás las letras se achican, suben y se desvanecen.
 */
export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  // Marcador sin altura justo después de la sección: a diferencia de la sección (sticky),
  // sí se desplaza con la página, así que sirve para medir cuánto la cubre Colecciones.
  const endRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Entrada: desde que la sección asoma abajo hasta que llega arriba
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start start"] });
  // Salida: mientras la siguiente sección sube y la cubre
  const { scrollYProgress: leave } = useScroll({ target: endRef, offset: ["start 0.5", "start 0.05"] });

  const enterY = useTransform(enter, [0, 1], [-80, 0]);
  const leaveY = useTransform(leave, [0, 1], [0, -60]);
  const y = useTransform(() => enterY.get() + leaveY.get());
  const scale = useTransform(leave, [0, 1], [1, 0.9]);
  const opacity = useTransform(leave, [0, 0.85], [1, 0.15]);

  return (
    <>
      <section ref={ref} className="home-manifesto" aria-labelledby="home-manifesto-title">
        <motion.div className="container home-manifesto-inner" style={reduce ? undefined : { y, scale, opacity }}>
          <p className="home-hero-eyebrow">Nadar Ediciones</p>
          <h2 id="home-manifesto-title" className="home-manifesto-statement">
            Libros de arte y crítica para leer el presente <em>desde múltiples orillas.</em>
          </h2>

          <div className="home-manifesto-pillars">
            {pillars.map((pillar) => (
              <div key={pillar.title}>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </div>
            ))}
          </div>

          <Link href="/proyecto" className="text-link home-manifesto-link">
            Conocer el proyecto editorial <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </section>
      <div ref={endRef} className="home-manifesto-end" aria-hidden="true" />
    </>
  );
}
