import { mercadopagoProvider } from "@/services/payments/mercadopago";
import type { PaymentProvider, PaymentProviderName } from "@/services/payments/types";
import { webpayProvider } from "@/services/payments/webpay";

const providers: Record<PaymentProviderName, PaymentProvider> = {
  webpay: webpayProvider,
  mercadopago: mercadopagoProvider,
};

export function getPaymentProvider(name: PaymentProviderName) {
  return providers[name];
}

export function availableProviders(): PaymentProviderName[] {
  return (Object.keys(providers) as PaymentProviderName[]).filter((n) => providers[n].isConfigured());
}
