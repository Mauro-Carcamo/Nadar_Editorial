// Secciones del home a las que lleva el menú. Desde otras páginas, /#id vuelve al home y baja a la sección.
export const HOME_SECTIONS = [
  { id: "proyecto", label: "Proyecto" },
  { id: "colecciones", label: "Colecciones" },
  { id: "catalogo", label: "Catálogo" },
  { id: "puntos-de-venta", label: "Puntos de venta" },
  { id: "contacto", label: "Contacto" },
] as const;

export const sectionHref = (id: string) => `/#${id}`;
