"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Registra una vista por cambio de ruta (y book_view en fichas de libro). El panel no se mide.
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackEvent({ eventType: "page_view", pagePath: pathname });
    if (/^\/libros\/[^/]+$/.test(pathname)) trackEvent({ eventType: "book_view", pagePath: pathname });
    if (pathname === "/checkout") trackEvent({ eventType: "checkout_start", pagePath: pathname });
  }, [pathname]);
  return null;
}
