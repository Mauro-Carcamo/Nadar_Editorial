import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from "transbank-sdk";
import type { CreatePaymentInput, PaymentProvider, PaymentRedirect, VerifiedPayment } from "@/services/payments/types";

// Webpay Plus (Transbank). En local usa el ambiente de integración con credenciales públicas de prueba.
// Producción requiere WEBPAY_ENVIRONMENT=production + código de comercio y API key reales.

function getTransaction() {
  const production = process.env.WEBPAY_ENVIRONMENT === "production";
  const commerceCode = production ? process.env.WEBPAY_COMMERCE_CODE : process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
  const apiKey = production ? process.env.WEBPAY_API_KEY : process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;
  if (!commerceCode || !apiKey) throw new Error("Webpay de producción sin credenciales");
  return new WebpayPlus.Transaction(
    new Options(commerceCode, apiKey, production ? Environment.Production : Environment.Integration),
  );
}

export const webpayProvider: PaymentProvider & {
  commitTransaction(token: string): Promise<VerifiedPayment>;
  getTransactionStatus(token: string): Promise<unknown>;
} = {
  name: "webpay",

  isConfigured() {
    return process.env.WEBPAY_ENVIRONMENT !== "production" || Boolean(process.env.WEBPAY_COMMERCE_CODE && process.env.WEBPAY_API_KEY);
  },

  async createPayment(input: CreatePaymentInput): Promise<PaymentRedirect> {
    const response = await getTransaction().create(input.buyOrder, input.sessionId, input.amount, input.returnUrl);
    return { providerPaymentId: response.token, url: response.url, method: "POST", fields: { token_ws: response.token } };
  },

  /** Confirma la transacción con Transbank (solo puede hacerse una vez por token). */
  async commitTransaction(token: string): Promise<VerifiedPayment> {
    const r = await getTransaction().commit(token);
    const approved = r.status === "AUTHORIZED" && r.response_code === 0;
    return {
      approved,
      status: approved ? "APPROVED" : "REJECTED",
      amount: Number(r.amount),
      buyOrder: String(r.buy_order),
      authorizationCode: r.authorization_code ?? undefined,
      paymentMethod: r.payment_type_code ?? undefined,
      cardLast4: r.card_detail?.card_number ?? undefined,
      raw: r,
    };
  },

  async getTransactionStatus(token: string) {
    return getTransaction().status(token);
  },
};
