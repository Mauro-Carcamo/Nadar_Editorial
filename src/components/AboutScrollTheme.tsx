"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

// Página Proyecto editorial: al bajar, el fondo pasa del tono arena al color más oscuro de la
// paleta (--palette-ink) y los textos se vuelven blancos. Los peces del fondo son dos capas
// (máscaras SVG): una siempre un poco más oscura y otra un poco más clara que el fondo,
// así el patrón se lee igual sobre arena que sobre el tono oscuro.
const SAND = "#faf5e8";
const INK = "#2d3c3f";

export function AboutScrollTheme({ children }: { children: ReactNode }) {
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 20, restDelta: 0.0005 });

  // El fondo cruza rápido los tonos medios (0.36 → 0.44), justo cuando el texto cambia de color:
  // así el texto oscuro siempre está sobre un fondo claro y el blanco sobre uno oscuro.
  const range = [0.05, 0.36, 0.44, 0.7];
  const bg = useTransform(p, range, [SAND, "#d4cfbe", "#626d6c", INK]);
  const fishDark = useTransform(p, range, ["#ece0bf", "#c7bea2", "#576261", "#253235"]);
  const fishLight = useTransform(p, range, ["#fffcf3", "#dfdbcd", "#6e7978", "#3b4b4e"]);
  const textRange = [0.38, 0.42];
  const ink = useTransform(p, textRange, [INK, "#ffffff"]);
  const inkSoft = useTransform(p, textRange, ["#5e6c6e", "#c9d3d4"]);
  const line = useTransform(p, textRange, ["rgba(120, 96, 40, 0.16)", "rgba(255, 255, 255, 0.16)"]);

  // Parallax del patrón: sube al bajar (igual que en el catálogo)
  const y = useTransform(p, [0, 1], [0, -320]);

  return (
    <motion.main
      className="about-page"
      style={
        {
          "--about-bg": bg,
          "--about-fish-dark": fishDark,
          "--about-fish-light": fishLight,
          "--about-ink": ink,
          "--about-ink-soft": inkSoft,
          "--about-line": line,
        } as unknown as CSSProperties
      }
    >
      <div className="about-page-fish" aria-hidden="true">
        <motion.div className="about-page-fish-layer" style={{ y }}>
          <span className="about-page-fish-dark" />
          <span className="about-page-fish-light" />
        </motion.div>
      </div>
      {children}
    </motion.main>
  );
}
