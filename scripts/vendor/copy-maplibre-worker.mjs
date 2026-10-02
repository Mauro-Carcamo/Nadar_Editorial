// MapLibre 6 carga su worker como módulo aparte; se sirve desde /vendor/maplibre (setWorkerUrl).
// Corre en postinstall para que siempre coincida con la versión instalada.
import { copyFile, mkdir } from "node:fs/promises";

const from = new URL("../../node_modules/maplibre-gl/dist/", import.meta.url);
const to = new URL("../../public/vendor/maplibre/", import.meta.url);
await mkdir(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(new URL(file, from), new URL(file, to));
}
console.log("Worker de MapLibre copiado a public/vendor/maplibre");
