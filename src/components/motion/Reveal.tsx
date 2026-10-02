"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

// Animación de entrada: aparece y sube suavemente la primera vez que entra en pantalla
export function Reveal({ children, className, delay = 0, y = 28 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
