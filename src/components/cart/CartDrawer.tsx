"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { SHIPPING_LABELS, useCartStore, type ShippingZone } from "@/stores/cart-store";

const fmt = (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`;
const EASE = [0.22, 1, 0.36, 1] as const;

// Carrito lateral: se abre al agregar un libro o desde el botón del carrito.
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const { items, subtotal, shippingCost, total, shippingZone, setShippingZone, removeItem, changeQty, close } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape cierra; el foco entra al panel al abrir y se bloquea el scroll de la página
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  const unavailable = items.filter((i) => i.price === null || (i.available !== undefined && i.available < i.quantity));

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="cart-drawer-root">
          <motion.div
            className="cart-drawer-backdrop"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <header className="cart-drawer-head">
              <h2>Carrito</h2>
              <button type="button" className="cart-drawer-close" onClick={close} aria-label="Cerrar carrito">
                ×
              </button>
            </header>

            {items.length === 0 ? (
              <div className="cart-drawer-empty">
                <p>Tu carrito está vacío.</p>
                <Link href="/libros" className="btn btn-outline" onClick={close}>
                  Explorar el catálogo
                </Link>
              </div>
            ) : (
              <>
                <ul className="cart-drawer-list">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.slug}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="cart-drawer-item"
                      >
                        <span className="cart-drawer-cover">
                          <Image src={item.image} alt="" width={60} height={90} />
                        </span>
                        <div className="cart-drawer-item-body">
                          <p className="cart-drawer-item-title">{item.title}</p>
                          <p className="cart-drawer-item-author">{item.subtitle}</p>
                          <div className="cart-drawer-item-row">
                            <div className="cart-qty" role="group" aria-label={`Cantidad de ${item.title}`}>
                              <button type="button" onClick={() => changeQty(item.slug, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Restar uno">
                                −
                              </button>
                              <motion.span key={item.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
                                {item.quantity}
                              </motion.span>
                              <button type="button" onClick={() => changeQty(item.slug, item.quantity + 1)} disabled={item.quantity >= 99} aria-label="Sumar uno">
                                +
                              </button>
                            </div>
                            <span className="cart-drawer-item-price">
                              {item.price !== null ? fmt(item.price * item.quantity) : "Consultar"}
                            </span>
                          </div>
                          {item.available !== undefined && item.available < item.quantity ? (
                            <p className="cart-drawer-warning">
                              {item.available > 0 ? `Solo quedan ${item.available}` : "Sin stock por ahora"}
                            </p>
                          ) : null}
                          <button type="button" className="cart-drawer-remove" onClick={() => removeItem(item.slug)}>
                            Quitar
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="cart-drawer-foot">
                  <label className="cart-drawer-zone">
                    Entrega
                    <select value={shippingZone} onChange={(e) => setShippingZone(e.target.value as ShippingZone)}>
                      {(Object.keys(SHIPPING_LABELS) as ShippingZone[]).map((z) => (
                        <option key={z} value={z}>
                          {SHIPPING_LABELS[z]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <dl className="cart-drawer-totals">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{fmt(subtotal)}</dd>
                    </div>
                    <div>
                      <dt>Envío</dt>
                      <dd>{shippingCost === 0 ? "Gratis" : fmt(shippingCost)}</dd>
                    </div>
                    <div className="cart-drawer-total">
                      <dt>Total</dt>
                      <motion.dd key={total} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                        {fmt(total)}
                      </motion.dd>
                    </div>
                  </dl>
                  {unavailable.length ? (
                    <p className="cart-drawer-warning">Revisa los libros marcados antes de pagar.</p>
                  ) : null}
                  <Link
                    href="/checkout"
                    className={`btn btn-primary cart-drawer-cta${unavailable.length ? " is-disabled" : ""}`}
                    aria-disabled={unavailable.length > 0}
                    onClick={(e) => (unavailable.length ? e.preventDefault() : close())}
                  >
                    Continuar compra
                  </Link>
                  <p className="cart-drawer-note">El total final se confirma en el pago.</p>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
