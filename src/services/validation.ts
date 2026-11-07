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

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Invalid email address.")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => undefined));

export const registerInputSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
    phone: z.string().trim().min(10, "Phone number is required.").transform(normalizePhoneNumber),
    email: optionalEmailSchema,
    gender: z.enum(["Male", "Female"]).optional().default("Male"),
    password: z.string().min(8, "Password must be at least 8 characters."),
    department: z.string().trim().min(1).default("Sanctuary Choir"),
    consent: z.boolean().optional(),
    consentGiven: z.boolean().optional(),
    returnTo: z.string().optional().nullable(),
  })
  .refine((data) => data.consent === true || data.consentGiven === true, {
    message: "You must accept the privacy consent notice to register.",
    path: ["consent"],
  });

export const loginInputSchema = z.object({
  phone: z.string().trim().min(10, "Phone number is required.").transform(normalizePhoneNumber),
  password: z.string().min(1, "Password is required."),
  returnTo: z.string().optional().nullable(),
});

export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  phone: z
    .string()
    .trim()
    .min(10)
    .transform(normalizePhoneNumber)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => undefined)),
  email: optionalEmailSchema,
  gender: z.enum(["Male", "Female"]).optional().nullable(),
  avatarBase64: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  emergencyContact: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const departmentInputSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters."),
  description: z.string().trim().max(240).optional().default(""),
  icon: z.string().trim().min(1).optional().default("groups"),
  leadName: z.string().trim().max(120).optional().default(""),
});

export const activityInputSchema = z.object({
  name: z.string().trim().min(2, "Activity name must be at least 2 characters."),
  description: z.string().trim().max(240).optional().default(""),
  schedule: z.string().trim().max(120).optional().default(""),
  icon: z.string().trim().min(1).optional().default("menu_book"),
});

export const assignAffiliationsInputSchema = z.object({
  memberId: z.string().trim().min(1, "Member ID is required."),
  departmentIds: z.array(z.string().trim().min(1)).default([]),
  activityIds: z.array(z.string().trim().min(1)).default([]),
});

export const createServiceInputSchema = z.object({
  name: z.string().trim().min(2, "Service name must be at least 2 characters."),
  serviceType: z.enum(["SUNDAY", "MIDWEEK", "SPECIAL"]).default("SUNDAY"),
  serviceDate: z.string().trim().min(8, "Service date is required (YYYY-MM-DD)."),
  startTime: z.string().trim().min(1).default("8:30 AM"),
  location: z.string().trim().min(1).default("RCCG JESUS HOUSE, OGBOMOSHO Auditorium"),
  usherStation: z.string().trim().min(1).default("Door A (Main Entrance)"),
});

export const markPresentInputSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required."),
  token: z.string().trim().min(1, "QR token is required."),
});

export const markManualPresentInputSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required."),
  memberId: z.string().trim().min(1, "Member ID is required."),
  station: z.string().trim().min(1).default("Usher Terminal 02"),
});

export const registerGuestInputSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required."),
  fullName: z.string().trim().min(2, "Guest full name must be at least 2 characters."),
  phone: z.string().trim().min(10, "Phone number is required.").transform(normalizePhoneNumber),
  invitedBy: z.string().trim().max(120).optional().default(""),
  station: z.string().trim().min(1).default("Usher Terminal 02"),
});

export type RegisterInput = z.input<typeof registerInputSchema>;
export type LoginInput = z.input<typeof loginInputSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileInputSchema>;
export type DepartmentInput = z.input<typeof departmentInputSchema>;
export type ActivityInput = z.input<typeof activityInputSchema>;
export type AssignAffiliationsInput = z.input<typeof assignAffiliationsInputSchema>;
export type CreateServiceInput = z.input<typeof createServiceInputSchema>;
export type MarkPresentInput = z.input<typeof markPresentInputSchema>;
export type MarkManualPresentInput = z.input<typeof markManualPresentInputSchema>;
export type RegisterGuestInput = z.input<typeof registerGuestInputSchema>;
