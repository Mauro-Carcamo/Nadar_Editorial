export type TrackPayload = {
  eventType: string;
  pagePath: string;
  buttonId?: string;
  meta?: Record<string, string | number | boolean | null>;
};

let cachedSessionId: string | null = null;

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  if (typeof window === "undefined") return "server-session";

  const key = "nadar_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    cachedSessionId = existing;
    return existing;
  }

  const generated = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  window.localStorage.setItem(key, generated);
  cachedSessionId = generated;
  return generated;
}

export function trackEvent(payload: TrackPayload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    sessionId: getSessionId(),
    eventType: payload.eventType,
    pagePath: payload.pagePath,
    buttonId: payload.buttonId,
    meta: payload.meta ?? {},
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/events", blob);
    return;
  }

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // No bloquear UX por analitica
  });
}
