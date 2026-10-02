"use client";

import { MotionConfig } from "motion/react";
import { ReactNode } from "react";

// reducedMotion="user": si el sistema pide menos movimiento, Motion desactiva desplazamientos y escalas
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
