import crypto from "node:crypto";
import type { AuthenticatedMember } from "../auth/session";
import { markPresent, type MarkPresentResult } from "./attendance";

export const CHECKIN_CODE_TTL_MS = 10 * 60 * 1000;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const MAX_CODE_REQUESTS_PER_WINDOW = 3;
export const MAX_VERIFY_ATTEMPTS = 5;

export type CheckinCodeChannel = "SMS" | "WHATSAPP";

export interface CheckinCodeDispatchResult {
  serviceId: string;
  channel: CheckinCodeChannel;
  maskedDestination: string;
  expiresAt: string;
  code: string;
}

interface StoredCheckinCode {
  serviceId: string;
  memberId: string;
  channel: CheckinCodeChannel;
  code: string;
  createdAtMs: number;
  expiresAtMs: number;
  attempts: number;
  consumed: boolean;
}

const activeCodeMap = new Map<string, StoredCheckinCode>();
const requestLogMap = new Map<string, number[]>();

export function resetCheckinCodesForTests(): void {
  activeCodeMap.clear();
  requestLogMap.clear();
}

function getMemberServiceKey(memberId: string, serviceId: string): string {
  return `${memberId}::${serviceId}`;
}

function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length <= 4) {
    return clean;
  }
  const last4 = clean.slice(-4);
  return `${clean.slice(0, Math.min(4, clean.length - 4))}****${last4}`;
}

function generateSixDigitCode(): string {
  const num = crypto.randomInt(100_000, 1_000_000);
  return String(num);
}

export async function requestCheckinCode(
  member: AuthenticatedMember,
  input: {
    serviceId: string;
    channel?: string;
    now?: Date;
  },
): Promise<CheckinCodeDispatchResult> {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const channel: CheckinCodeChannel = input.channel?.toUpperCase() === "SMS" ? "SMS" : "WHATSAPP";

  const key = getMemberServiceKey(member.id, input.serviceId);
  const previousTimestamps = (requestLogMap.get(key) ?? []).filter(
    (ts) => nowMs - ts < RATE_LIMIT_WINDOW_MS,
  );

  if (previousTimestamps.length >= MAX_CODE_REQUESTS_PER_WINDOW) {
    throw new Error(
      "Too many check-in code requests (rate limit exceeded). Please wait 15 minutes or ask an usher for manual check-in.",
    );
  }

  previousTimestamps.push(nowMs);
  requestLogMap.set(key, previousTimestamps);

  const code = generateSixDigitCode();
  const expiresAtMs = nowMs + CHECKIN_CODE_TTL_MS;

  activeCodeMap.set(key, {
    serviceId: input.serviceId,
    memberId: member.id,
    channel,
    code,
    createdAtMs: nowMs,
    expiresAtMs,
    attempts: 0,
    consumed: false,
  });

  return {
    serviceId: input.serviceId,
    channel,
    maskedDestination: maskPhone(member.phone),
    expiresAt: new Date(expiresAtMs).toISOString(),
    code,
  };
}

export async function verifyCheckinCode(
  member: AuthenticatedMember,
  input: {
    serviceId: string;
    code: string;
    now?: Date;
  },
): Promise<MarkPresentResult> {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const key = getMemberServiceKey(member.id, input.serviceId);
  const record = activeCodeMap.get(key);

  if (!record || record.consumed) {
    return {
      status: "INVALID_TOKEN",
      message: "Invalid or already used check-in code. Please request a new code.",
      attendance: null,
    };
  }

  if (nowMs > record.expiresAtMs) {
    return {
      status: "EXPIRED_TOKEN",
      message: "This 6-digit check-in code has expired. Please request a new code.",
      attendance: null,
    };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      status: "INVALID_TOKEN",
      message:
        "Maximum verification attempts locked. Please request a fresh check-in code or visit the usher desk.",
      attendance: null,
    };
  }

  if (record.code !== input.code.trim()) {
    record.attempts += 1;
    return {
      status: "INVALID_TOKEN",
      message: `Incorrect check-in code (${MAX_VERIFY_ATTEMPTS - record.attempts} attempts remaining).`,
      attendance: null,
    };
  }

  record.consumed = true;
  return markPresent(member, {
    serviceId: input.serviceId,
    token: "preview",
  });
}
