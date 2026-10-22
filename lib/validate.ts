// Server-side validation for public forms. Keep it dependency-free.

export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactInput = { name: string; phone: string; email?: string; message: string; page?: string };
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateContact(body: unknown):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: FieldErrors } {
  const b = (body ?? {}) as Record<string, unknown>;
  const data: ContactInput = {
    name: str(b.name, 100),
    phone: str(b.phone, 20).replace(/[\s-]/g, ""),
    email: str(b.email, 120) || undefined,
    message: str(b.message, 2000),
    page: str(b.page, 200) || undefined,
  };

  const errors: FieldErrors = {};
  if (data.name.length < 2) errors.name = "Please enter your name.";
  if (!BD_PHONE.test(data.phone)) errors.phone = "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).";
  if (data.email && !EMAIL.test(data.email)) errors.email = "Enter a valid email or leave it empty.";
  if (data.message.length < 5) errors.message = "Please write a short message.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
