"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

// Fondo de Contacto: la ilustración se desplaza lento mientras se recorre la sección (parallax suave).
// Con "reducir movimiento" se anula en CSS, así el HTML del servidor y del cliente coincide.
export function ContactBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 12, damping: 14, mass: 1.6, restDelta: 0.0005 });
  const y = useTransform(smooth, [0, 1], [-70, 70]);
  const scale = useTransform(smooth, [0, 1], [1.08, 1]);

  return (
    <div ref={ref} className="home-contact-bg" aria-hidden="true">
      <motion.div className="home-contact-bg-image" style={{ y, scale }}>
        <Image src="/images/page/amistad-pez-volador.jpg" alt="" fill sizes="100vw" />
      </motion.div>
    </div>
  );
}
