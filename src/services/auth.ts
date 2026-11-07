import { GraphQLError } from "graphql";

import { hashPassword, verifyPassword } from "@/auth/password";
import {
  canMemberAccessPath,
  getMemberLandingPath,
  getRoleLandingPath,
  hasAdminAccess,
  hasPhotoUploadAccess,
  hasUsherAccess,
  isMediaUnitMember,
  isMediaUnitName,
  isUsherUnitMember,
  isUsherUnitName,
} from "@/auth/permissions";
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

export {
  canMemberAccessPath,
  getMemberLandingPath,
  getRoleLandingPath,
  hasAdminAccess,
  hasPhotoUploadAccess,
  hasUsherAccess,
  isMediaUnitMember,
  isMediaUnitName,
  isUsherUnitMember,
  isUsherUnitName,
};

export type AuthPayload = {
  member: AuthenticatedMember;
  redirectTo: string;
};

export function resolvePostAuthRedirect(
  roleOrMember: UserRole | Pick<AuthenticatedMember, "role" | "department" | "activities">,
  returnTo?: string | null,
): string {
  const memberObj: Pick<AuthenticatedMember, "role" | "department" | "activities"> =
    typeof roleOrMember === "string"
      ? { role: roleOrMember, department: "", activities: [] }
      : roleOrMember;

  const safeReturnTo = getSafeReturnTo(returnTo);
  if (safeReturnTo && canMemberAccessPath(memberObj, safeReturnTo)) {
    return safeReturnTo;
  }
  return getMemberLandingPath(memberObj);
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

export function requireAdminAccess(member: AuthenticatedMember | null): AuthenticatedMember {
  if (!member) {
    throw new GraphQLError("Authentication required. Please log in to continue.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (!hasAdminAccess(member)) {
    throw new GraphQLError("Forbidden: Administrator access is required for this action.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return member;
}

export function requireUsherOrAdminAccess(member: AuthenticatedMember | null): AuthenticatedMember {
  if (!member) {
    throw new GraphQLError("Authentication required. Please log in to continue.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (!hasUsherAccess(member)) {
    throw new GraphQLError("Forbidden: Only Ushering Unit or Admin can access this resource.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return member;
}

export function requirePhotoUploadAccess(member: AuthenticatedMember | null): AuthenticatedMember {
  if (!member) {
    throw new GraphQLError("Authentication required. Please log in to continue.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (!hasPhotoUploadAccess(member)) {
    throw new GraphQLError(
      "Forbidden: Only the Media Unit or Admin is authorized to upload and manage service photos.",
      {
        extensions: { code: "FORBIDDEN" },
      },
    );
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

  const departmentName = parsed.department || "Unassigned";
  let matchedDept = await Department.findOne({ name: departmentName });
  if (
    !matchedDept &&
    departmentName !== "Unassigned" &&
    departmentName !== "General Member" &&
    departmentName !== "General Congregation"
  ) {
    matchedDept = await Department.create({
      name: departmentName,
      description: `${departmentName} — RCCG JESUS HOUSE, OGBOMOSHO`,
      icon: isMediaUnitName(departmentName)
        ? "photo_camera"
        : isUsherUnitName(departmentName)
          ? "badge"
          : "groups",
      leadName: "",
      active: true,
    });
  }
  const memberCode = await generateNextMemberCode();
  const passwordHash = await hashPassword(parsed.password);
  const totalMembersCount = await Member.countDocuments();

  const assignedRole: UserRole =
    totalMembersCount === 0 ? "ADMIN" : isUsherUnitName(departmentName) ? "USHER" : "MEMBER";

  const created = await Member.create({
    fullName: parsed.fullName,
    phone: parsed.phone,
    email: parsed.email,
    gender: parsed.gender ?? "Male",
    passwordHash,
    role: assignedRole,
    status: "ACTIVE",
    department: departmentName,
    activities: [],
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
    redirectTo: resolvePostAuthRedirect(member, parsed.returnTo),
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
    redirectTo: resolvePostAuthRedirect(member, parsed.returnTo),
  };
}

export async function logoutMember(): Promise<boolean> {
  return revokeCurrentSession();
}
