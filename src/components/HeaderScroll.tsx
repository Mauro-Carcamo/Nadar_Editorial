"use client";

import { useEffect } from "react";

// Marca <html data-scrolled> al bajar por la página: la cabecera se vuelve más compacta (ver globals.css)
export function HeaderScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => root.toggleAttribute("data-scrolled", window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return null;
}
