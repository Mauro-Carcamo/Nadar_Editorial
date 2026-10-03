"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// 1) Marca <html data-scrolled> al bajar (cabecera compacta, ver globals.css).
// 2) En el home, resalta en el menú la sección visible (aria-current="location").
// 3) Cierra el menú móvil al elegir una sección.
export function HeaderScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const update = () => root.toggleAttribute("data-scrolled", window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>(".site-header a[data-section]")];
    const closeMenu = () => document.querySelector<HTMLDetailsElement>(".mobile-nav")?.removeAttribute("open");
    links.forEach((a) => a.addEventListener("click", closeMenu));

    const setActive = (id: string | null) =>
      links.forEach((a) => (a.dataset.section === id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));

    let observer: IntersectionObserver | null = null;
    if (pathname === "/") {
      const sections = [...new Set(links.map((a) => a.dataset.section!))]
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el));
      const visible = new Map<string, number>();
      // Una sección cuenta como activa cuando cruza la franja central de la pantalla
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
          // Si hay varias (el bloque de Proyecto contiene a Colecciones), gana la que viene después
          const current = [...sections].reverse().find((s) => (visible.get(s.id) ?? 0) > 0);
          setActive(current?.id ?? null);
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.01] },
      );
      sections.forEach((s) => observer!.observe(s));
    } else {
      setActive(null);
    }

    return () => {
      links.forEach((a) => a.removeEventListener("click", closeMenu));
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
