import { NextRequest, NextResponse } from "next/server";
import { Options, WebpayPlus, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from "transbank-sdk";

const COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const API_KEY = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, buyOrder } = body;

    if (!token || !buyOrder) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: token, buyOrder" },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const options = new Options(
      COMMERCE_CODE,
      API_KEY,
      isProduction ? Environment.Production : Environment.Integration
    );
    const transaction = new WebpayPlus.Transaction(options);

    const response = await transaction.commit(token);

    return NextResponse.json({
      buyOrder: response.buyOrder,
      sessionId: response.sessionId,
      amount: response.amount,
      status: response.status,
      authorizationCode: response.authorizationCode,
      cardType: response.cardType,
      last4CardDigits: response.last4CardDigits,
      transactionDate: response.transactionDate,
    });
  } catch (error: any) {
    console.error("WebPay commit error:", error);
    return NextResponse.json(
      { error: "Error al confirmar transacción WebPay", details: error.message || String(error) },
      { status: 500 }
    );
  }
}