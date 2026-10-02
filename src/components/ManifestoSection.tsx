"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

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

  // Ilustración del ave: más atrás todavía, así que se mueve aún más lento
  const birdEnterY = useTransform(enter, [0, 1], [-20, 0]);
  const birdLeaveY = useTransform(leave, [0, 1], [0, -12]);
  const birdY = useTransform(() => birdEnterY.get() + birdLeaveY.get());
  const birdScale = useTransform(leave, [0, 1], [1, 0.97]);

  return (
    <>
      <section ref={ref} className="home-manifesto" aria-labelledby="home-manifesto-title">
        {/* Ilustración de un ave sobre el mar (página Laboratorio del sitio original): a la izquierda de Nadar, detrás */}
        <motion.div
          className="home-manifesto-bird"
          style={{ y: birdY, scale: birdScale, opacity: photoOpacity }}
          aria-hidden="true"
        >
          <Image src="/images/page/ave-mar.jpg" alt="" fill sizes="(min-width: 900px) 70vw, 100vw" />
        </motion.div>
        {/* Gaspard-Félix Tournachon, «Nadar», en la canasta de un globo (c. 1863). Dominio público, Gallica/BnF */}
        <motion.div
          className="home-manifesto-photo"
          style={{ y: photoY, scale: photoScale, opacity: photoOpacity }}
          aria-hidden="true"
        >
          <Image src="/images/page/nadar-globo.jpg" alt="" fill sizes="(min-width: 900px) 70vw, 100vw" />
        </motion.div>
        <motion.div className="container home-manifesto-inner" style={{ y, scale, opacity }}>
          <h2 id="home-manifesto-title" className="sr-only">
            El nombre Nadar
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

          <Link href="/proyecto" className="text-link home-manifesto-link">
            Conocer el proyecto editorial <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </section>
      <div ref={endRef} className="home-manifesto-end" aria-hidden="true" />
    </>
  );
}
