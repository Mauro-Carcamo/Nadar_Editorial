import { NextRequest, NextResponse } from "next/server";

type EventBody = {
  sessionId?: string;
  eventType?: string;
  pagePath?: string;
  buttonId?: string;
  meta?: unknown;
};

export async function POST(request: NextRequest) {
  let body: EventBody;

  try {
    body = (await request.json()) as EventBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  if (!body.sessionId || !body.eventType || !body.pagePath) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "sessionId, eventType and pagePath are required" } },
      { status: 400 },
    );
  }

  // Local-first: por ahora solo log en servidor para verificar eventos antes de DB.
  // En la siguiente fase se persiste en Supabase.
  console.log("[analytics:event]", {
    sessionId: body.sessionId,
    eventType: body.eventType,
    pagePath: body.pagePath,
    buttonId: body.buttonId ?? null,
    meta: body.meta ?? {},
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
