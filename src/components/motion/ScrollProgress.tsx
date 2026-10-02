"use client";

import { motion, useScroll, useSpring } from "motion/react";

// Barra superior que indica cuánto se ha recorrido la página (useScroll + resorte suave)
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}
