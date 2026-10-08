"use client";

import { useLayoutEffect, useRef } from "react";
import type { BookDiscount } from "@/data/book-utils";

/**
 * Círculo rojo de descuento sobre la portada ("50% Descuento Cyber").
 * Va dentro del contenedor de la portada: se mide la imagen y se ubica en su esquina superior
 * derecha (los contenedores suelen ser más anchos que la portada). El tamaño sigue al de la
 * portada; en portadas muy chicas solo muestra el porcentaje.
 */
export function DiscountBadge({ discount }: { discount: BookDiscount | null | undefined }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const badge = ref.current;
    const box = badge?.parentElement;
    const img = box?.querySelector("img");
    if (!badge || !box || !img) return;

    const place = () => {
      // offset* ignora transformaciones (zoom/parallax): la posición sigue a la portada
      let left = img.offsetLeft;
      let top = img.offsetTop;
      let parent = img.offsetParent as HTMLElement | null;
      while (parent && parent !== box && box.contains(parent)) {
        left += parent.offsetLeft;
        top += parent.offsetTop;
        parent = parent.offsetParent as HTMLElement | null;
      }
      const size = Math.round(Math.min(Math.max(img.offsetWidth * 0.36, 32), 112));
      badge.style.setProperty("--badge-size", `${size}px`);
      // Dentro de la portada (algunos contenedores recortan lo que sobresale)
      badge.style.left = `${left + img.offsetWidth - size - Math.round(size * 0.06)}px`;
      badge.style.top = `${top + Math.round(size * 0.06)}px`;
      badge.dataset.compact = size < 46 ? "true" : "false";
      badge.dataset.ready = "true";
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(img);
    ro.observe(box);
    img.addEventListener("load", place);
    return () => {
      ro.disconnect();
      img.removeEventListener("load", place);
    };
  }, []);

  if (!discount) return null;
  return (
    <span ref={ref} className="discount-badge" aria-label={`${discount.percent}% de descuento ${discount.label}`}>
      <strong>{discount.percent}%</strong>
      <small>
        Descuento
        <br />
        {discount.label}
      </small>
    </span>
  );
}
