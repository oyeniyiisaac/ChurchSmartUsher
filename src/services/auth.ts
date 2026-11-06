import { GraphQLError } from "graphql";

import { hashPassword, verifyPassword } from "@/auth/password";
import {
  type AuthenticatedMember,
  createSession,
  revokeCurrentSession,
  setSessionCookie,
  toAuthenticatedMember,
} from "@/auth/session";
import { Department, Member, type UserRole } from "@/db/models";
import { connectToDatabase } from "@/db/mongoose";
import { generateNextMemberCode } from "./profile";
import {
  getSafeReturnTo,
  type LoginInput,
  loginInputSchema,
  type RegisterInput,
  registerInputSchema,
} from "./validation";

export type AuthPayload = {
  member: AuthenticatedMember;
  redirectTo: string;
};

export function getRoleLandingPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "USHER":
      return "/usher";
    case "MEMBER":
    default:
      return "/dashboard";
  }
}

export function resolvePostAuthRedirect(role: UserRole, returnTo?: string | null): string {
  const safeReturnTo = getSafeReturnTo(returnTo);
  if (safeReturnTo) {
    return safeReturnTo;
  }
  return getRoleLandingPath(role);
}

export function requireRole(
  member: AuthenticatedMember | null,
  allowedRoles: readonly UserRole[],
): AuthenticatedMember {
  if (!member) {
    throw new GraphQLError("Authentication required. Please log in to continue.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (!allowedRoles.includes(member.role)) {
    throw new GraphQLError("Forbidden: You do not have permission for this action.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return member;
}

export async function registerMember(rawInput: RegisterInput): Promise<AuthPayload> {
  const parsed = registerInputSchema.parse(rawInput);
  await connectToDatabase();

  const existing = await Member.findOne({ phone: parsed.phone });
  if (existing) {
    throw new GraphQLError("An account with this phone number already exists.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const departmentName = parsed.department || "Sanctuary Choir";
  const matchedDept = await Department.findOne({ name: departmentName });
  const memberCode = await generateNextMemberCode();
  const passwordHash = await hashPassword(parsed.password);

  const created = await Member.create({
    fullName: parsed.fullName,
    phone: parsed.phone,
    email: parsed.email,
    gender: parsed.gender ?? "Male",
    passwordHash,
    role: "MEMBER",
    status: "ACTIVE",
    department: departmentName,
    activities: ["Sunday School Class 4"],
    departmentIds: matchedDept ? [matchedDept._id] : [],
    activityIds: [],
    memberCode,
    currentStreak: 0,
    longestStreak: 0,
    consentAcceptedAt: new Date(),
  });

  const { token, expiresAt } = await createSession(created._id.toString());
  await setSessionCookie(token, expiresAt);

  const member = toAuthenticatedMember(created);
  return {
    member,
    redirectTo: resolvePostAuthRedirect(member.role, parsed.returnTo),
  };
}

export async function loginMember(rawInput: LoginInput): Promise<AuthPayload> {
  const parsed = loginInputSchema.parse(rawInput);
  await connectToDatabase();

  const found = await Member.findOne({ phone: parsed.phone });
  if (!found || !(await verifyPassword(parsed.password, found.passwordHash))) {
    throw new GraphQLError("Invalid phone number or password.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  const { token, expiresAt } = await createSession(found._id.toString());
  await setSessionCookie(token, expiresAt);

  const member = toAuthenticatedMember(found);
  return {
    member,
    redirectTo: resolvePostAuthRedirect(member.role, parsed.returnTo),
  };
}

export async function logoutMember(): Promise<boolean> {
  return revokeCurrentSession();
}
