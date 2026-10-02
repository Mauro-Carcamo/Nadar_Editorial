"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
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
 * Con "reducir movimiento" el efecto se anula en CSS (así el HTML del servidor y del cliente coincide).
 */
export function ManifestoSection() {
  const ref = useRef<HTMLElement>(null);
  // Marcador sin altura justo después de la sección: a diferencia de la sección (sticky),
  // sí se desplaza con la página, así que sirve para medir cuánto la cubre Colecciones.
  const endRef = useRef<HTMLDivElement>(null);

  // Entrada: desde que la sección asoma abajo hasta que llega arriba
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start start"] });
  // Salida: mientras la siguiente sección sube y la cubre
  const { scrollYProgress: leave } = useScroll({ target: endRef, offset: ["start 0.5", "start 0.05"] });

  const enterY = useTransform(enter, [0, 1], [-80, 0]);
  const leaveY = useTransform(leave, [0, 1], [0, -60]);
  const y = useTransform(() => enterY.get() + leaveY.get());
  const scale = useTransform(leave, [0, 1], [1, 0.9]);
  const opacity = useTransform(leave, [0, 0.85], [1, 0.15]);

  // Foto de fondo: mismos movimientos que el texto, pero más lentos (parallax) para que se sienta atrás
  const photoEnterY = useTransform(enter, [0, 1], [-40, 0]);
  const photoLeaveY = useTransform(leave, [0, 1], [0, -24]);
  const photoY = useTransform(() => photoEnterY.get() + photoLeaveY.get());
  const photoScale = useTransform(leave, [0, 1], [1, 0.94]);
  const photoOpacity = useTransform(leave, [0, 0.85], [1, 0.1]);

  return (
    <>
      <section ref={ref} className="home-manifesto" aria-labelledby="home-manifesto-title">
        {/* Gaspard-Félix Tournachon, «Nadar», en la canasta de un globo (c. 1863). Dominio público, Gallica/BnF */}
        <motion.div
          className="home-manifesto-photo"
          style={{ y: photoY, scale: photoScale, opacity: photoOpacity }}
          aria-hidden="true"
        >
          <Image src="/images/page/nadar-globo.jpg" alt="" fill sizes="(min-width: 900px) 46vw, 90vw" />
        </motion.div>
        <motion.div className="container home-manifesto-inner" style={{ y, scale, opacity }}>
          <p className="home-hero-eyebrow">Nadar Ediciones</p>
          <h2 id="home-manifesto-title" className="home-manifesto-statement">
            Libros de arte y crítica para leer el presente <em>desde múltiples orillas.</em>
          </h2>

          <blockquote className="home-manifesto-origin">
            <p>
              “Nadar” era el pseudónimo de Gaspard-Félix Tournachon, fotógrafo y aeronauta francés que vivió durante el
              siglo XIX. “Nadar” también refiere al verbo que se utiliza para describir la traslación acuática mediante
              movimientos corporales. Cabría preguntarse: ¿Es posible una natación celeste, «nadar en los aires»? Pensar
              a Gaspard-Félix Tournachon como nadador a través de los gases que habitan el cielo, o simplemente quien
              nada, sea un pez, una persona o un elefante, en el mar o en los lagos, como si el estado líquido del agua
              fuera lo mismo que su estado gaseoso. Recordemos que viento se define como un gas en movimiento ¿En qué
              difieren vientos y corrientes acuáticas?
            </p>
          </blockquote>

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
