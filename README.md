# Nadar Ediciones · Sitio web

Sitio de la editorial Nadar Ediciones: catálogo, colecciones, carrito con WebPay y panel admin. Next.js 16 + React 19.

Documentación completa en [`../Docs`](../Docs/README.md). Estado actual: [`../Docs/28_Estado_Proyecto_MVP.md`](../Docs/28_Estado_Proyecto_MVP.md). Rediseño de la página de inicio: [`../Docs/30_Rediseno_Home_2026.md`](../Docs/30_Rediseno_Home_2026.md).

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
npm run lint
npx tsc --noEmit   # verificación de tipos
```

Base de datos local (PostgreSQL) y administrador: ver [`../Docs/31_Plataforma_Auditoria_y_Plan.md`](../Docs/31_Plataforma_Auditoria_y_Plan.md).

```bash
npm run db:setup         # una vez: crea usuario y base (requiere PG_SUPERUSER_URL temporal)
npm run db:migrate       # aplica db/migrations
npm run db:seed          # carga el catálogo (idempotente)
npm run db:create-admin -- correo "clave" "Nombre"
```

Panel: http://localhost:3000/admin

Variables de entorno: copiar `.env.local.example` a `.env.local` (ver [`../Docs/26_Configuracion_Entorno_Variables.md`](../Docs/26_Configuracion_Entorno_Variables.md)). Sin `.env.local` el sitio funciona con los datos JSON locales, pero Supabase y WebPay no.

Si los estilos de `src/app/globals.css` no se actualizan en el navegador (pasa a veces en Windows con Turbopack), reiniciar el servidor o borrar la carpeta `.next`.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `src/app/page.tsx` | Página de inicio: hero, manifiesto, colecciones y catálogo |
| `src/app/globals.css` | Tokens de diseño (`:root`) y estilos |
| `src/components/` | Componentes; `motion/` (animaciones) y `cart/` (carrito) |
| `src/data/site.ts` | Tipo `Book`, colecciones y helpers: `getBestsellers`, `getCover`, `hasRealDescription` |
| `src/data/books.enriched.json` | Catálogo de libros |
| `src/data/covers.json` | Dimensiones de las portadas planas |
| `public/images/books/` | Fotos originales de las portadas |
| `public/images/covers-hd/` | Portadas planas recortadas (las usa `getCover`) |

## Librerías principales

- **Swiper 14**: carruseles del hero, colecciones (Parallax + Grab cursor) y catálogo (Grid).
- **Motion 13** (`motion/react`): animaciones. Todo el inicio va dentro de `MotionProvider`, que respeta "reducir movimiento".
- **transbank-sdk**: pagos WebPay (sandbox).

## Reglas del proyecto

- En componentes que renderizan con SSR, no leer `localStorage`, `sessionStorage`, `Date.now()` o `Math.random()` directamente en JSX ni en snapshots no cacheados.
- Si se usa `useSyncExternalStore`, `getSnapshot` debe devolver una referencia estable cuando los datos no cambian; si no, React puede entrar en loops o lanzar errores de hidratación.
- Para estado persistido en cliente, preferir un store pequeño con snapshot de servidor estable y caché local explícita (ver `CartProvider`).
- No condicionar estilos en el render según `useReducedMotion` (el servidor no conoce la preferencia y se rompe la hidratación); desactivar efectos con CSS `prefers-reduced-motion`.
- El catálogo usa Swiper Grid con alto calculado en CSS: el número de columnas debe coincidir entre `slidesPerView` (`CatalogGrid.tsx`) y `--catalog-cols` (`globals.css`).
- Al reemplazar una imagen, usar un nombre o ruta nueva: el optimizador de Next.js guarda en caché por URL.
- Guía extendida: [`../Docs/20_Patrones_SSR_Cliente_Web.md`](../Docs/20_Patrones_SSR_Cliente_Web.md).

## Despliegue

Vercel. Ver [`../Docs/27_Despliegue_Vercel_Completo.md`](../Docs/27_Despliegue_Vercel_Completo.md).
