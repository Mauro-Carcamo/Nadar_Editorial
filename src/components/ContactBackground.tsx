"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

// Fondo de Contacto: la ilustración se achica y sube lento mientras se recorre la sección.
// Contacto es la última sección: el recorrido termina al llegar al final de la página.
// Con "reducir movimiento" se anula en CSS, así el HTML del servidor y del cliente coincide.
export function ContactBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 12, damping: 14, mass: 1.6, restDelta: 0.0005 });
  const y = useTransform(smooth, [0, 1], [40, -60]);
  const scale = useTransform(smooth, [0, 1], [1.8, 1]);

  return (
    <div ref={ref} className="home-contact-bg" aria-hidden="true">
      <motion.div className="home-contact-bg-image" style={{ y, scale }}>
        <Image src="/images/page/amistad-pez-volador.jpg" alt="" fill sizes="100vw" />
      </motion.div>
    </div>
  );
}
