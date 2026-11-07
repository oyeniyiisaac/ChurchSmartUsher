import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { getEnv } from "@/config/env";
import {
  Member,
  type MemberDocument,
  type MemberGender,
  Session,
  type UserRole,
} from "@/db/models";
import { connectToDatabase } from "@/db/mongoose";
import { hashSessionToken } from "./password";

export type AuthenticatedMember = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  gender?: MemberGender | null;
  avatarUrl?: string | null;
  role: UserRole;
  status?: string;
  department: string;
  activities: string[];
  departmentIds?: string[];
  activityIds?: string[];
  memberCode: string;
  emergencyContact?: string | null;
  notes?: string | null;
  currentStreak: number;
  longestStreak: number;
  consentGivenAt?: string;
};

export function toAuthenticatedMember(doc: MemberDocument): AuthenticatedMember {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    phone: doc.phone,
    email: doc.email ?? null,
    gender: (doc.gender as MemberGender | undefined) ?? "Male",
    avatarUrl: doc.avatarUrl ?? "",
    role: doc.role,
    status: doc.status ?? "ACTIVE",
    department: doc.department,
    activities: doc.activities ?? [],
    departmentIds: (doc.departmentIds ?? []).map((id) => id.toString()),
    activityIds: (doc.activityIds ?? []).map((id) => id.toString()),
    memberCode: doc.memberCode,
    emergencyContact: doc.emergencyContact ?? null,
    notes: doc.notes ?? null,
    currentStreak: doc.currentStreak,
    longestStreak: doc.longestStreak,
    consentGivenAt: doc.consentAcceptedAt
      ? new Date(doc.consentAcceptedAt).toISOString()
      : new Date().toISOString(),
  };
}

export async function createSession(memberId: string): Promise<{ token: string; expiresAt: Date }> {
  await connectToDatabase();
  const env = getEnv();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await Session.create({
    tokenHash: hashSessionToken(token),
    memberId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const env = getEnv();
  const cookieStore = await cookies();
  cookieStore.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const env = getEnv();
  const cookieStore = await cookies();
  cookieStore.delete(env.SESSION_COOKIE_NAME);
}

export async function revokeCurrentSession(): Promise<boolean> {
  const env = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await connectToDatabase();
      await Session.deleteOne({ tokenHash: hashSessionToken(token) });
    } catch {
      // Ignore DB disconnection during cookie cleanup
    }
  }

  cookieStore.delete(env.SESSION_COOKIE_NAME);
  return true;
}

export async function getCurrentMember(): Promise<AuthenticatedMember | null> {
  const env = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    await connectToDatabase();
    const session = await Session.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    const member = await Member.findById(session.memberId);
    if (!member) {
      return null;
    }

    return toAuthenticatedMember(member);
  } catch {
    return null;
  }
}
