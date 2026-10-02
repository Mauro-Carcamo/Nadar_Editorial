// Abstracción de proveedores de pago: el checkout y la confirmación no dependen de un proveedor concreto.

export type PaymentProviderName = "webpay" | "mercadopago";

export type CreatePaymentInput = {
  buyOrder: string; // identificador único que enviamos al proveedor (≤ 26 caracteres en Webpay)
  sessionId: string;
  amount: number; // CLP calculado por el servidor
  returnUrl: string;
  description: string;
};

/** Cómo redirigir al cliente al proveedor. Webpay exige un POST de formulario con token_ws. */
export type PaymentRedirect = {
  providerPaymentId: string;
  url: string;
  method: "GET" | "POST";
  fields?: Record<string, string>;
};

/** Resultado verificado con el proveedor (servidor a servidor), nunca con lo que diga el navegador. */
export type VerifiedPayment = {
  approved: boolean;
  status: "APPROVED" | "REJECTED";
  amount: number;
  buyOrder: string;
  authorizationCode?: string;
  paymentMethod?: string;
  cardLast4?: string;
  raw: unknown;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<PaymentRedirect>;
}
