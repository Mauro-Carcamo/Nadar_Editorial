import { z } from "zod";

// Esquema del libro para el panel: se valida en el formulario (React Hook Form) y otra vez en el servidor.

export const BOOK_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const PERSON_ROLES = ["author", "editor", "coordinator", "translator", "prologue", "illustrator"] as const;

export const PERSON_ROLE_LABEL: Record<(typeof PERSON_ROLES)[number], string> = {
  author: "Autor/a",
  editor: "Editor/a",
  coordinator: "Coordinación",
  translator: "Traducción",
  prologue: "Prólogo",
  illustrator: "Ilustración",
};

const optionalText = (max: number) => z.string().trim().max(max);

// Campos numéricos opcionales: el formulario envía "" cuando están vacíos
const optionalInt = (min: number, max: number) =>
  z.union([z.literal(""), z.coerce.number().int().min(min).max(max)]).transform((v) => (v === "" ? null : v));

export const BookFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(300),
  slug: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Solo minúsculas, números y guiones"),
  isbn: z
    .string()
    .trim()
    .regex(/^$|^(97[89])-?\d{1,5}-?\d{1,7}-?\d{1,7}-?\d$/, "ISBN-13 inválido (ej. 978-956-9552-32-8)"),
  status: z.enum(BOOK_STATUSES),
  price: optionalInt(0, 10_000_000),
  collectionId: z.string().uuid().or(z.literal("")),
  series: optionalText(120),
  people: z
    .array(z.object({ name: z.string().trim().min(2, "Nombre muy corto").max(160), role: z.enum(PERSON_ROLES) }))
    .max(20),
  categories: z.array(z.string().trim().min(2).max(80)).max(20),
  bajada: optionalText(400),
  description: optionalText(20_000),
  authorBio: optionalText(10_000),
  year: optionalInt(1500, 2100),
  pages: optionalInt(1, 10_000),
  size: optionalText(60),
  subject: optionalText(160),
  featured: z.boolean(),
  salesRank: optionalInt(1, 9999),
  stock: optionalInt(0, 100_000),
  stockNote: optionalText(200),
  coverUrl: optionalText(500),
  coverWidth: optionalInt(1, 20_000),
  coverHeight: optionalInt(1, 20_000),
});

export type BookFormInput = z.input<typeof BookFormSchema>;
export type BookFormData = z.output<typeof BookFormSchema>;

export const PersonSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(160),
  biography: optionalText(10_000),
});

export const CategorySchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  description: optionalText(1000),
});
