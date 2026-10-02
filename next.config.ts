import type { NextConfig } from "next";

// Cabeceras de seguridad básicas para todo el sitio (sin CSP estricta: Webpay usa un POST a otro dominio
// y MapLibre carga teselas externas; se puede endurecer al pasar a producción).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
