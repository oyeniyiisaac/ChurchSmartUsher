import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/config/env";

export const QR_STEP_SECONDS = 60;

export type TokenVerificationReason = "VALID" | "EXPIRED_TOKEN" | "INVALID_TOKEN";

export type TokenVerificationResult = {
  valid: boolean;
  reason: TokenVerificationReason;
  slot?: number;
};

export function generateServiceQrSecret(): string {
  return randomBytes(32).toString("hex");
}

export function getTimeSlot(
  nowMs: number = Date.now(),
  stepSeconds: number = QR_STEP_SECONDS,
): number {
  return Math.floor(nowMs / (stepSeconds * 1000));
}

export function getSecondsRemainingInSlot(
  nowMs: number = Date.now(),
  stepSeconds: number = QR_STEP_SECONDS,
): number {
  const stepMs = stepSeconds * 1000;
  const elapsedMs = nowMs % stepMs;
  return Math.max(1, Math.ceil((stepMs - elapsedMs) / 1000));
}

function computeSlotSignature(serviceId: string, qrSecret: string, slot: number): string {
  const env = getEnv();
  const compositeKey = `${env.QR_TOKEN_SECRET}:${qrSecret}`;
  const payload = `${serviceId}:${slot}`;
  return createHmac("sha256", compositeKey).update(payload).digest("hex");
}

export function signServiceToken(
  serviceId: string,
  qrSecret: string,
  slot: number = getTimeSlot(),
): string {
  const signature = computeSlotSignature(serviceId, qrSecret, slot);
  return `${slot}.${signature}`;
}

export function verifyServiceToken(
  serviceId: string,
  qrSecret: string,
  token: string,
  nowMs: number = Date.now(),
): TokenVerificationResult {
  const parts = token.trim().split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  const [slotStr, providedSig] = parts;
  if (!/^\d+$/.test(slotStr) || !/^[0-9a-f]{64}$/i.test(providedSig)) {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  const slot = Number.parseInt(slotStr, 10);
  const expectedSig = computeSlotSignature(serviceId, qrSecret, slot);

  const providedBuf = Buffer.from(providedSig.toLowerCase(), "hex");
  const expectedBuf = Buffer.from(expectedSig.toLowerCase(), "hex");

  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, reason: "INVALID_TOKEN" };
  }

  const currentSlot = getTimeSlot(nowMs, QR_STEP_SECONDS);

  // Accept current slot and immediate previous slot (60-second grace window)
  if (slot === currentSlot || slot === currentSlot - 1) {
    return {
      valid: true,
      reason: "VALID",
      slot,
    };
  }

  if (slot < currentSlot - 1) {
    return {
      valid: false,
      reason: "EXPIRED_TOKEN",
    };
  }

  return {
    valid: false,
    reason: "INVALID_TOKEN",
  };
}

export function buildCheckinUrl(serviceId: string, token: string): string {
  return `/checkin/${serviceId}?t=${encodeURIComponent(token)}`;
}
