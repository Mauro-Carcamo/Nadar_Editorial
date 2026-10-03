"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { NadarWordmark } from "@/components/NadarWordmark";

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

  // Fotos: un solo recorrido continuo, sin pausas, desde que la sección asoma abajo hasta que
  // Colecciones termina de cubrirla. Se mide en píxeles de la página (la sección es sticky).
  const { scrollY } = useScroll();
  const range = useRef({ start: 0, end: 1 });
  useEffect(() => {
    const measure = () => {
      if (!ref.current || !endRef.current) return;
      const endTop = endRef.current.getBoundingClientRect().top + window.scrollY; // fin natural de la sección
      const start = endTop - ref.current.offsetHeight - window.innerHeight; // la sección asoma por abajo
      const end = endTop - 80; // Colecciones llega bajo la cabecera: la sección quedó cubierta
      range.current = { start, end: Math.max(end, start + 1) };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const rawProgress = useTransform(scrollY, (v) => {
    const { start, end } = range.current;
    return Math.min(1, Math.max(0, (v - start) / (end - start)));
  });
  // Resorte lento y sin rebote: las fotos no siguen cada tirón de la rueda, se deslizan con inercia
  // y mantienen un movimiento parejo aunque el scroll sea irregular.
  const progress = useSpring(rawProgress, { stiffness: 3.5, damping: 9, mass: 3, restDelta: 0.0005 });

  // Velocidades distintas: con el mismo scroll el globo recorre mucho más (rápido) y el pájaro poco (lento).
  // Globo (adelante, mitad derecha): parte abajo a la izquierda, sube hacia la esquina superior
  // derecha y se agranda.
  const photoX = useTransform(progress, [0, 1], [-16, 40]);
  const photoY = useTransform(progress, [0, 1], [24, -60]);
  const photoScale = useTransform(progress, [0, 1], [1.02, 1.14]);

  // Pájaro (atrás, mitad izquierda): parte un poco más arriba y, al hacer scroll, se achica y baja despacio.
  const birdX = useTransform(progress, [0, 1], [24, 12]);
  const birdY = useTransform(progress, [0, 1], [-30, 24]);
  const birdScale = useTransform(progress, [0, 1], [1, 0.88]);

  // Se desvanecen recién cuando Colecciones ya las está cubriendo
  const photoOpacity = useTransform(leave, [0.4, 1], [1, 0.25]);

  return (
    <>
      <section ref={ref} className="home-manifesto" aria-labelledby="home-manifesto-title">
        {/* Ilustración de un ave sobre el mar (página Laboratorio del sitio original): mitad izquierda, atrás */}
        <motion.div
          className="home-manifesto-bird"
          style={{ x: birdX, y: birdY, scale: birdScale, opacity: photoOpacity }}
          aria-hidden="true"
        >
          <Image src="/images/page/ave-mar.jpg" alt="" fill sizes="(min-width: 900px) 50vw, 60vw" />
        </motion.div>
        {/* Gaspard-Félix Tournachon, «Nadar», en la canasta de un globo (c. 1863). Dominio público, Gallica/BnF */}
        <motion.div
          className="home-manifesto-photo"
          style={{ x: photoX, y: photoY, scale: photoScale, opacity: photoOpacity }}
          aria-hidden="true"
        >
          <Image src="/images/page/nadar-globo.jpg" alt="" fill sizes="(min-width: 900px) 50vw, 60vw" />
        </motion.div>
        <motion.div className="container home-manifesto-inner" style={{ y, scale, opacity }}>
          <h2 id="home-manifesto-title" className="sr-only">
            El nombre Nadar
          </h2>

          {/* Marca "nadar" vectorizada, en el color del texto que había antes */}
          <NadarWordmark className="home-manifesto-wordmark" title="Nadar" />

          <Link href="/proyecto" className="text-link home-manifesto-link">
            Conocer el proyecto editorial <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </section>
      <div ref={endRef} className="home-manifesto-end" aria-hidden="true" />
    </>
  );
}
