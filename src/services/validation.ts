import { z } from "zod";

export function normalizePhoneNumber(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[\s\-()]/g, "").trim();

  if (/^0[789][01]\d{8}$/.test(cleaned)) {
    return `+234${cleaned.slice(1)}`;
  }

  if (/^234[789][01]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^\+234[789][01]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error(
    "Invalid Nigerian phone number. Expected format like 08012345678 or +2348012345678.",
  );
}

export function getSafeReturnTo(returnTo?: string | null): string | null {
  if (!returnTo) {
    return null;
  }
  const trimmed = returnTo.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("://")) {
    return trimmed;
  }
  return null;
}

export const registerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  phone: z.string().trim().min(10, "Phone number is required.").transform(normalizePhoneNumber),
  email: z
    .string()
    .trim()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: z.string().min(8, "Password must be at least 8 characters."),
  department: z.string().trim().min(1).default("General Assembly"),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy consent notice to register.",
  }),
  returnTo: z.string().optional(),
});

export const loginInputSchema = z.object({
  phone: z.string().trim().min(10, "Phone number is required.").transform(normalizePhoneNumber),
  password: z.string().min(1, "Password is required."),
  returnTo: z.string().optional(),
});

export type RegisterInput = z.input<typeof registerInputSchema>;
export type LoginInput = z.input<typeof loginInputSchema>;
