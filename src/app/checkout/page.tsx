import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Finalizar compra | Nadar Ediciones",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="checkout-page">
        <div className="container">
          <p className="home-hero-eyebrow">Checkout</p>
          <h1 className="home-collections-heading">Finalizar compra</h1>
          <CheckoutForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
