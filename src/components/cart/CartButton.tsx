"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, SHIPPING_LABELS, type ShippingZone } from "@/components/cart/CartProvider";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4h-2l-1 2v2h2l2.4 7.2c.2.5.7.8 1.2.8h7.9c.5 0 .9-.3 1.1-.8L21 8H8.1l-.5-2H7zm3 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  );
}

function WebPayIcon() {
  return (
    <svg viewBox="0 0 80 24" aria-hidden="true" className="webpay-icon">
      <rect fill="#6B196B" width="80" height="24" rx="3" />
      <text x="40" y="16" fill="#fff" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" textAnchor="middle">WebPay</text>
      <circle cx="16" cy="12" r="3" fill="#A6469D" />
      <circle cx="64" cy="12" r="3" fill="#A6469D" />
    </svg>
  );
}

export function CartButton() {
  const [open, setOpen] = useState(false);
  const { items, count, subtotal, shippingZone, shippingCost, total, setShippingZone, removeItem, changeQty, clear } = useCart();

  return (
    <>
      <button type="button" className="cart-trigger" onClick={() => setOpen(true)} aria-label="Abrir carrito">
        <span className="cart-icon-wrap">
          <CartIcon />
        </span>
        <span className="cart-trigger-label">Carrito</span>
        <span className="cart-count" suppressHydrationWarning>
          {count}
        </span>
      </button>

      {open ? (
        <div className="cart-overlay" role="dialog" aria-modal="true" aria-label="Carrito de compras">
          <div className="cart-popup">
            <header className="cart-head">
              <h3>Carrito</h3>
              <button type="button" className="pill" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </header>

            {items.length === 0 ? (
              <div className="cart-empty">
                <p>No tienes productos agregados.</p>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {items.map((item) => (
                    <article key={item.slug} className="cart-item">
                      <Image src={item.image} alt="" width={72} height={96} className="cart-item-image" />
                      <div className="cart-item-body">
                        <p className="cart-item-title">{item.title}</p>
                        <p className="cart-item-subtitle">{item.subtitle}</p>
                        <p className="cart-item-price">
                          {item.price
                            ? `${new Intl.NumberFormat("es-CL").format(item.price)} ${item.currency}`
                            : "Precio a confirmar"}
                        </p>
                        <div className="cart-item-actions">
                          <label>
                            Cant.
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={item.quantity}
                              onChange={(e) => changeQty(item.slug, Number(e.target.value || 1))}
                            />
                          </label>
                          <button type="button" className="pill pill-danger" onClick={() => removeItem(item.slug)}>
                            Quitar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-shipping">
                  <label htmlFor="shipping-zone">Tipo de entrega:</label>
                  <select
                    id="shipping-zone"
                    value={shippingZone}
                    onChange={(e) => setShippingZone(e.target.value as ShippingZone)}
                  >
                    <option value="pickup">{SHIPPING_LABELS.pickup}</option>
                    <option value="rm">{SHIPPING_LABELS.rm}</option>
                    <option value="central">{SHIPPING_LABELS.central}</option>
                    <option value="extreme">{SHIPPING_LABELS.extreme}</option>
                  </select>
                </div>

                <footer className="cart-foot">
                  <div className="cart-totals">
                    <p><strong>Subtotal:</strong> {new Intl.NumberFormat("es-CL").format(subtotal)} CLP</p>
                    <p><strong>Envío:</strong> {shippingCost === 0 ? "Gratis" : `${new Intl.NumberFormat("es-CL").format(shippingCost)} CLP`}</p>
                    <p className="cart-total"><strong>Total:</strong> {new Intl.NumberFormat("es-CL").format(total)} CLP</p>
                  </div>
                  <div className="cart-checkout-actions">
                    <Link href="/checkout?mode=guest" className="btn btn-primary btn-webpay" onClick={() => setOpen(false)}>
                      <WebPayIcon />
                      <span>Pagar con WebPay</span>
                    </Link>
                    <button type="button" className="pill" onClick={clear}>
                      Vaciar carrito
                    </button>
                  </div>
                </footer>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
