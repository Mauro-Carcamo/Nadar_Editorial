import type { CreatePaymentInput, PaymentProvider, PaymentRedirect } from "@/services/payments/types";

// Mercado Pago: estructura lista, implementación pendiente de credenciales de prueba
// (MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET). Mientras no estén, el checkout no lo ofrece
// y el webhook responde 501. Responsabilidades previstas: createPayment (preferencia de Checkout Pro),
// getPayment, verifyPayment (consulta a la API con el id del evento) y processWebhook (firma x-signature).

export const mercadopagoProvider: PaymentProvider = {
  name: "mercadopago",

  isConfigured() {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET);
  },

  async createPayment(input: CreatePaymentInput): Promise<PaymentRedirect> {
    void input;
    throw new Error("Mercado Pago aún no está configurado");
  },
};
