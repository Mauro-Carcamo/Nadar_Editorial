"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const step = searchParams.get("step");
  const { items, subtotal, shippingCost, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [webpayUrl, setWebpayUrl] = useState<string | null>(null);
  const [transactionResult, setTransactionResult] = useState<any>(null);

  const buyOrder = `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const sessionId = `SES-${Date.now()}`;

  const handlePayment = async () => {
    if (items.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    const totalAmount = total > 0 ? total : subtotal;
    
    if (total <= 0) {
      setError("El monto total es 0. Agrega productos con precio válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/webpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyOrder,
          sessionId,
          amount: totalAmount,
        }),
      });

      const data = await res.json();

      if (data.token && data.url) {
        setToken(data.token);
        setWebpayUrl(data.url);
        window.location.href = data.url;
      } else {
        setError(data.error || "Error al iniciar pago");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "result") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenWs = urlParams.get("token_ws");
      const buyOrderWs = urlParams.get("buy_order");

      if (tokenWs && buyOrderWs) {
        fetch("/api/webpay/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenWs, buyOrder: buyOrderWs }),
        })
          .then((res) => res.json())
          .then((data) => {
            setTransactionResult(data);
            if (data.status === "AUTHORIZED") {
              clear();
            }
          })
          .catch(() => {
            setTransactionResult({ error: "Error al confirmar pago" });
          });
      }
    }
  }, [step, clear]);

  if (step === "result") {
    if (!transactionResult) {
      return (
        <main className="section section-light">
          <div className="container auth-card">
            <p className="eyebrow">Procesando pago</p>
            <h1>Confirmando transacción...</h1>
          </div>
        </main>
      );
    }

    if (transactionResult.error) {
      return (
        <main className="section section-light">
          <div className="container auth-card">
            <p className="eyebrow">Error</p>
            <h1>Pago fallido</h1>
            <p>{transactionResult.error}</p>
            <Link href="/checkout" className="btn btn-primary">
              Intentar de nuevo
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="section section-light">
        <div className="container auth-card">
          <p className="eyebrow">¡Pago exitoso!</p>
          <h1>Transacción autorizada</h1>
          <div style={{ marginTop: 16 }}>
            <p><strong>Orden:</strong> {transactionResult.buyOrder}</p>
            <p><strong>Monto:</strong> ${transactionResult.amount?.toLocaleString("es-CL")} CLP</p>
            <p><strong>Autorización:</strong> {transactionResult.authorizationCode}</p>
            <p><strong>Tarjeta:</strong> **** {transactionResult.last4CardDigits}</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="/" className="btn btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="section section-light">
      <div className="container auth-card">
        <p className="eyebrow">Checkout</p>
        <h1>Finalizar compra</h1>

        {items.length === 0 ? (
          <div>
            <p>El carrito está vacío</p>
            <Link href="/libros" className="btn btn-primary">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div style={{ margin: "16px 0", padding: 16, border: "1px solid var(--line)", borderRadius: 12 }}>
              <h3 style={{ marginBottom: 12 }}>Resumen del pedido</h3>
              {items.map((item) => (
                <div key={item.slug} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>{item.title} x{item.quantity}</span>
                  <span>${((item.price ?? 0) * item.quantity).toLocaleString("es-CL")}</span>
                </div>
              ))}
              <hr style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString("es-CL")} CLP</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Envío:</span>
                <span>{shippingCost === 0 ? "Gratis" : `$${shippingCost.toLocaleString("es-CL")} CLP`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: 8 }}>
                <span>Total:</span>
                <span>${total.toLocaleString("es-CL")} CLP</span>
              </div>
            </div>

            {error && (
              <p style={{ color: "red", marginBottom: 16 }}>{error}</p>
            )}

            <div className="hero-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "Procesando..." : "Pagar con WebPay"}
              </button>
              <Link href="/login" className="btn btn-outline">
                Iniciar sesión
              </Link>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: 16 }}>
              Pago seguro con WebPay Plus (sandbox de prueba)
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="section section-light">
        <div className="container auth-card">
          <p className="eyebrow">Cargando...</p>
        </div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}