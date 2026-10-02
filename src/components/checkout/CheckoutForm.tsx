"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CheckoutSchema } from "@/schemas/checkout";
import { SHIPPING_LABELS, type ShippingZone } from "@/stores/cart-store";

const fmt = (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`;

const PROBLEM_TEXT: Record<string, string> = {
  NOT_FOUND: "ya no está en el catálogo",
  NOT_FOR_SALE: "no está a la venta",
  NO_PRICE: "no tiene precio confirmado",
  NO_STOCK: "no tiene stock suficiente",
};

/** Envía un formulario POST al proveedor (Webpay exige token_ws por POST). */
function submitToProvider(url: string, method: "GET" | "POST", fields: Record<string, string> = {}) {
  const form = document.createElement("form");
  form.method = method;
  form.action = url;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutForm() {
  const { items, subtotal, shippingCost, total, shippingZone, setShippingZone, guestToken } = useCart();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const needsAddress = shippingZone !== "pickup";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const payload = {
      items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      shippingZone,
      email: String(f.get("email") ?? ""),
      fullName: String(f.get("fullName") ?? ""),
      phone: String(f.get("phone") ?? ""),
      address: needsAddress
        ? {
            street: String(f.get("street") ?? ""),
            number: String(f.get("number") ?? ""),
            apartment: String(f.get("apartment") ?? ""),
            commune: String(f.get("commune") ?? ""),
            region: String(f.get("region") ?? ""),
          }
        : undefined,
      provider: "webpay" as const,
      cartToken: guestToken ?? undefined,
    };

    // Misma validación que el servidor (Zod), para mostrar errores al instante
    const parsed = CheckoutSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      setMessage("Revisa los campos marcados.");
      return;
    }

    setErrors({});
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        const problems: { slug: string; reason: string }[] = data.error?.problems ?? [];
        setMessage(
          problems.length
            ? problems
                .map((p) => `«${items.find((i) => i.slug === p.slug)?.title ?? p.slug}» ${PROBLEM_TEXT[p.reason] ?? "no está disponible"}`)
                .join(". ")
            : (data.error?.message ?? "No se pudo crear el pedido."),
        );
        setLoading(false);
        return;
      }
      submitToProvider(data.redirect.url, data.redirect.method, data.redirect.fields);
    } catch {
      setMessage("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <p>Tu carrito está vacío.</p>
        <Link href="/libros" className="btn btn-primary">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={`checkout-field${errors[name] ? " has-error" : ""}`}>
      <span>{label}</span>
      <input name={name.split(".").pop()} aria-invalid={Boolean(errors[name])} {...props} />
      {errors[name] ? <small role="alert">{errors[name]}</small> : null}
    </label>
  );

  return (
    <form className="checkout-grid" onSubmit={onSubmit} noValidate>
      <section className="checkout-section" aria-labelledby="checkout-contact">
        <h2 id="checkout-contact">Tus datos</h2>
        {field("fullName", "Nombre y apellido", { autoComplete: "name", required: true })}
        {field("email", "Correo", { type: "email", autoComplete: "email", required: true })}
        {field("phone", "Teléfono (opcional)", { type: "tel", autoComplete: "tel" })}

        <h2>Entrega</h2>
        <label className="checkout-field">
          <span>Tipo de entrega</span>
          <select value={shippingZone} onChange={(e) => setShippingZone(e.target.value as ShippingZone)}>
            {(Object.keys(SHIPPING_LABELS) as ShippingZone[]).map((z) => (
              <option key={z} value={z}>
                {SHIPPING_LABELS[z]}
              </option>
            ))}
          </select>
        </label>
        {needsAddress ? (
          <div className="checkout-address">
            {field("address.street", "Calle", { autoComplete: "address-line1", required: true })}
            {field("address.number", "Número", { inputMode: "numeric" })}
            {field("address.apartment", "Depto. / oficina (opcional)", { autoComplete: "address-line2" })}
            {field("address.commune", "Comuna", { autoComplete: "address-level2", required: true })}
            {field("address.region", "Región", { autoComplete: "address-level1", required: true })}
          </div>
        ) : (
          <p className="checkout-hint">Te avisaremos por correo cuando tu pedido esté listo para retirar.</p>
        )}
      </section>

      <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
        <h2 id="checkout-summary-title">Resumen</h2>
        <ul>
          {items.map((item) => (
            <li key={item.slug}>
              <Image src={item.image} alt="" width={44} height={64} />
              <span className="checkout-summary-title">
                {item.title}
                <small>
                  {item.quantity} × {item.price !== null ? fmt(item.price) : "consultar"}
                </small>
              </span>
              <strong>{item.price !== null ? fmt(item.price * item.quantity) : "—"}</strong>
            </li>
          ))}
        </ul>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{fmt(subtotal)}</dd>
          </div>
          <div>
            <dt>Envío</dt>
            <dd>{shippingCost === 0 ? "Gratis" : fmt(shippingCost)}</dd>
          </div>
          <div className="checkout-summary-total">
            <dt>Total</dt>
            <dd>{fmt(total)}</dd>
          </div>
        </dl>
        {message ? (
          <p className="checkout-message" role="alert">
            {message}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary checkout-pay" disabled={loading}>
          {loading ? "Creando pedido…" : "Pagar con Webpay"}
        </button>
        <p className="checkout-hint">
          El total se vuelve a calcular en nuestro servidor con los precios vigentes antes de pagar.
        </p>
      </aside>
    </form>
  );
}
