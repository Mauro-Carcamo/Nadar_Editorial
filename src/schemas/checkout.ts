import { z } from "zod";

// Compartido entre el formulario (cliente) y /api/checkout (servidor).
// El cliente solo envía QUÉ compra y CUÁNTO; precios y totales los calcula el servidor.

export const SHIPPING_ZONE_CODES = ["pickup", "rm", "central", "extreme"] as const;

export const CartLineSchema = z.object({
  slug: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
});

export const AddressSchema = z.object({
  street: z.string().trim().min(3, "Indica la calle").max(160),
  number: z.string().trim().max(20).optional().default(""),
  apartment: z.string().trim().max(40).optional().default(""),
  commune: z.string().trim().min(2, "Indica la comuna").max(80),
  region: z.string().trim().min(2, "Indica la región").max(80),
});

export const CheckoutSchema = z
  .object({
    items: z.array(CartLineSchema).min(1, "El carrito está vacío").max(50),
    shippingZone: z.enum(SHIPPING_ZONE_CODES),
    email: z.string().trim().toLowerCase().email("Correo inválido"),
    fullName: z.string().trim().min(3, "Indica tu nombre").max(120),
    phone: z.string().trim().max(30).optional().default(""),
    address: AddressSchema.optional(),
    provider: z.enum(["webpay", "mercadopago"]).default("webpay"),
    cartToken: z.string().max(100).optional(),
  })
  .refine((v) => v.shippingZone === "pickup" || Boolean(v.address), {
    message: "La dirección es obligatoria para despacho",
    path: ["address"],
  });

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type CartLineInput = z.infer<typeof CartLineSchema>;
