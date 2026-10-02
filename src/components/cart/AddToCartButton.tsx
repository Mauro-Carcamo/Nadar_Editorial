"use client";

import { motion } from "motion/react";
import { ReactNode, useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  price: number | null;
  currency: string;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
};

const FEEDBACK_MS = 1800;

export function AddToCartButton({
  slug,
  title,
  subtitle,
  image,
  price,
  currency,
  className = "btn btn-outline",
  ariaLabel,
  children,
}: Props) {
  const { addItem } = useCart();
  // Confirmación visible tras agregar: el botón cambia a "Agregado" por un momento
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`${className}${added ? " is-added" : ""}`}
      aria-label={ariaLabel ?? "Agregar al carrito"}
      onClick={() => {
        addItem({ slug, title, subtitle, image, price, currency });
        setAdded(true);
      }}
    >
      {added ? (
        <>
          Agregado <span aria-hidden="true">✓</span>
        </>
      ) : (
        (children ?? "Agregar al carrito")
      )}
      <span className="sr-only" aria-live="polite">
        {added ? `${title} agregado al carrito` : ""}
      </span>
    </motion.button>
  );
}
