"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";

// Fondo de Contacto: la ilustración se achica (zoom out amplio) y sube mientras se baja.
// Contacto es la última sección y tiene poco recorrido propio, así que el efecto empieza antes:
// desde ~700 px antes de que la sección asome, hasta que la página llega al final.
// Con "reducir movimiento" se anula en CSS, así el HTML del servidor y del cliente coincide.
const LEAD_IN = 700;

export function ContactBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef({ start: 0, end: 1 });

  useEffect(() => {
    const measure = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top + window.scrollY;
      const start = top - window.innerHeight - LEAD_IN;
      const end = document.documentElement.scrollHeight - window.innerHeight;
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

  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (v) => {
    const { start, end } = range.current;
    return Math.min(1, Math.max(0, (v - start) / (end - start)));
  });
  const smooth = useSpring(progress, { stiffness: 12, damping: 14, mass: 1.6, restDelta: 0.0005 });
  const y = useTransform(smooth, [0, 1], [40, -60]);
  const scale = useTransform(smooth, [0, 1], [2.1, 1]);

  return (
    <div ref={ref} className="home-contact-bg" aria-hidden="true">
      <motion.div className="home-contact-bg-image" style={{ y, scale }}>
        <Image src="/images/page/amistad-pez-volador.jpg" alt="" fill sizes="100vw" />
      </motion.div>
    </div>
  );
}
