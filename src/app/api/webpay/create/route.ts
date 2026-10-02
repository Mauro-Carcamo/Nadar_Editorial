import { NextRequest, NextResponse } from "next/server";
import { Options, WebpayPlus, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from "transbank-sdk";

const RETURN_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?step=result`
  : "https://webpay3gint.transbank.cl/opengate/landing";

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const API_KEY = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;
const USE_SANDBOX = process.env.WEBPAY_USE_SANDBOX === "true" || !process.env.VERCEL_ENV;

function getEnvironment() {
  return USE_SANDBOX ? Environment.Integration : Environment.Production;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyOrder, sessionId, amount, callbackUrl } = body;

    if (!buyOrder || !sessionId || !amount) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: buyOrder, sessionId, amount" },
        { status: 400 }
      );
    }

    console.log("WebPay config:", { 
      commerceCode: COMMERCE_CODE, 
      apiKey: API_KEY ? API_KEY.substring(0, 10) + "..." : "missing",
      environment: USE_SANDBOX ? "Integration" : "Production",
      returnUrl: RETURN_URL
    });

    const environment = getEnvironment();
    const options = new Options(COMMERCE_CODE, API_KEY, environment);
    const transaction = new WebpayPlus.Transaction(options);
    const returnUrl = callbackUrl || RETURN_URL;

    console.log("Creating transaction:", { buyOrder, sessionId, amount, returnUrl });

    const response = await transaction.create(buyOrder, sessionId, amount, "CLP");

    return NextResponse.json({ token: response.token, url: response.url });
  } catch (error: any) {
    console.error("WebPay create error:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Error al crear transacción WebPay", 
        details: error.message || String(error),
        debug: {
          commerceCode: COMMERCE_CODE,
          hasApiKey: !!API_KEY,
          environment: USE_SANDBOX ? "Integration" : "Production"
        }
      },
      { status: 500 }
    );
  }
}