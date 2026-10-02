"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { CONTACT_SUBJECTS, ContactSchema, type ContactInput } from "@/schemas/contact";

// Formulario de contacto: Zod en el cliente y otra vez en /api/contact. Los mensajes llegan al panel.
export function ContactForm() {
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: "", email: "", subject: "GENERAL", message: "", website: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        for (const [field, message] of Object.entries(json?.error?.fieldErrors ?? {})) {
          setError(field as FieldPath<ContactInput>, { message: String(message) });
        }
        setStatus({ tone: "error", text: json?.error?.message ?? "No se pudo enviar el mensaje." });
        return;
      }
      reset();
      setStatus({ tone: "ok", text: "Mensaje enviado. Te responderemos a la brevedad." });
    } catch {
      setStatus({ tone: "error", text: "No hay conexión. Intenta nuevamente." });
    }
  });

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="contact-form-row">
        <label>
          Nombre
          <input type="text" autoComplete="name" placeholder="Tu nombre" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
        </label>
        <label>
          Correo
          <input type="email" autoComplete="email" placeholder="tu@correo.cl" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
        </label>
      </div>
      <label>
        Motivo
        <select {...register("subject")}>
          {Object.entries(CONTACT_SUBJECTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mensaje
        <textarea rows={6} placeholder="Escribe tu mensaje" aria-invalid={!!errors.message} {...register("message")} />
        {errors.message ? <span className="field-error">{errors.message.message}</span> : null}
      </label>
      {/* Campo trampa: invisible para personas, los bots suelen llenarlo */}
      <input type="text" tabIndex={-1} autoComplete="off" className="contact-form-trap" aria-hidden="true" {...register("website")} />
      {status ? (
        <p className={status.tone === "ok" ? "contact-form-ok" : "contact-form-error"} role="status">
          {status.text}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
