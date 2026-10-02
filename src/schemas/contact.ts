import { z } from "zod";

export const CONTACT_SUBJECTS = {
  GENERAL: "Consulta general",
  PEDIDO: "Un pedido o compra",
  PRENSA: "Prensa y actividades",
  LIBRERIAS: "Librerías y distribución",
  MANUSCRITOS: "Propuestas editoriales",
} as const;

export const ContactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(120),
  email: z.string().trim().toLowerCase().email("Correo inválido").max(200),
  subject: z.enum(Object.keys(CONTACT_SUBJECTS) as [keyof typeof CONTACT_SUBJECTS, ...(keyof typeof CONTACT_SUBJECTS)[]]),
  message: z.string().trim().min(10, "El mensaje es muy corto").max(5000, "Máximo 5.000 caracteres"),
  // Campo trampa para bots: debe llegar vacío
  website: z.string().max(0).optional(),
});

export type ContactInput = z.input<typeof ContactSchema>;
