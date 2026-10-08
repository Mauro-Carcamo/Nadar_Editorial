import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Librería del mapa copiada en postinstall (código de terceros, minificado)
    "public/vendor/**",
    // Script manual de prueba contra el ambiente de integración de Webpay (CommonJS)
    "test-webpay.js",
  ]),
]);

export default eslintConfig;
