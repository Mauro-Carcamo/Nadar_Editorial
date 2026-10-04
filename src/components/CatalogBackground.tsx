"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

// Fondo del catálogo con parallax: al bajar, el patrón de peces sube (más rápido que el contenido).
// Con "reducir movimiento" se anula en CSS (el HTML del servidor y del cliente coincide).
// `className` permite reusar el fondo en otras páginas con otros colores (p. ej. Proyecto editorial).
export function CatalogBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 20, damping: 16, mass: 1.2, restDelta: 0.0005 });
  const y = useTransform(smooth, [0, 1], [160, -160]);

  return (
    <div ref={ref} className={className ? `home-catalog-bg ${className}` : "home-catalog-bg"} aria-hidden="true">
      <motion.div className="home-catalog-bg-layer" style={{ y }} />
    </div>
  );
}
