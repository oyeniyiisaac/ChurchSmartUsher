import { beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import {
  OTP_RATE_LIMIT_WINDOW_MS,
  OTP_TTL_MS,
  buildWhatsAppVerificationLink,
  getFallbackOtpMember,
  maskPhoneNumber,
  requestAuthOtp,
  resetOtpsForTests,
  resetPasswordWithOtp,
  verifyLoginOtp,
} from "../src/services/auth-otp";
import { Member } from "../src/db/models";
import { hashPassword, verifyPassword } from "../src/auth/password";

describe("Instant Login and Forgot Password with Free WhatsApp / SMS OTP", () => {
  const samplePhone = "+2348106096112";

  beforeEach(async () => {
    resetOtpsForTests();
  });

  it("masks phone numbers properly for security display", () => {
    expect(maskPhoneNumber("+2348106096112")).toBe("+234****6112");
    expect(maskPhoneNumber("08012345678")).toBe("0801****5678");
    expect(maskPhoneNumber("123")).toBe("123");
  });

  it("generates free WhatsApp direct link with prefilled verification code", () => {
    const link = buildWhatsAppVerificationLink("+2348106096112", "789123", "LOGIN");
    expect(link).toContain("https://wa.me/2348106096112");
    expect(link).toContain("789123");
    expect(link).toContain("Instant%20Login%20Code");

    const resetLink = buildWhatsAppVerificationLink("+2348106096112", "456789", "PASSWORD_RESET");
    expect(resetLink).toContain("Password%20Reset%20Code");
  });

  it("requests an instant login code via WhatsApp and verifies it to create a session", async () => {
    const now = new Date("2026-11-17T09:00:00.000Z");

    const dispatch = await requestAuthOtp({
      phone: samplePhone,
      channel: "WHATSAPP",
      purpose: "LOGIN",
      now,
    });

    expect(dispatch.channel).toBe("WHATSAPP");
    expect(dispatch.purpose).toBe("LOGIN");
    expect(dispatch.code).toMatch(/^\d{6}$/);
    expect(dispatch.maskedPhone).toContain("6112");
    expect(dispatch.whatsappDeepLink).toBeDefined();

    // Verification succeeds
    const result = await verifyLoginOtp({
      phone: samplePhone,
      code: dispatch.code,
      now: new Date(now.getTime() + 15_000),
    });

    expect(result.member).toBeDefined();
    expect(result.member.phone).toBe(samplePhone);
    expect(result.redirectTo).toBeDefined();

    // Trying to reuse the same code fails immediately
    await expect(
      verifyLoginOtp({
        phone: samplePhone,
        code: dispatch.code,
        now: new Date(now.getTime() + 20_000),
      }),
    ).rejects.toThrow(/already used/);
  });

  it("rejects expired OTP code after 10 minutes", async () => {
    const now = new Date("2026-11-17T09:00:00.000Z");

    const dispatch = await requestAuthOtp({
      phone: samplePhone,
      channel: "SMS",
      purpose: "LOGIN",
      now,
    });

    const pastExpiry = new Date(now.getTime() + OTP_TTL_MS + 5_000);
    await expect(
      verifyLoginOtp({
        phone: samplePhone,
        code: dispatch.code,
        now: pastExpiry,
      }),
    ).rejects.toThrow(/expired/);
  });

  it("enforces rate limits on OTP requests (max 3 per 15 minutes)", async () => {
    const now = new Date("2026-11-17T10:00:00.000Z");

    await requestAuthOtp({ phone: samplePhone, now });
    await requestAuthOtp({ phone: samplePhone, now: new Date(now.getTime() + 1000) });
    await requestAuthOtp({ phone: samplePhone, now: new Date(now.getTime() + 2000) });

    await expect(
      requestAuthOtp({ phone: samplePhone, now: new Date(now.getTime() + 3000) }),
    ).rejects.toThrow(/Too many code requests/);
  });

  it("requests password reset code and securely updates account password", async () => {
    const now = new Date("2026-11-17T11:00:00.000Z");

    const dispatch = await requestAuthOtp({
      phone: samplePhone,
      channel: "WHATSAPP",
      purpose: "PASSWORD_RESET",
      now,
    });

    expect(dispatch.purpose).toBe("PASSWORD_RESET");
    expect(dispatch.code).toMatch(/^\d{6}$/);

    // Reset password
    const resetRes = await resetPasswordWithOtp({
      phone: samplePhone,
      code: dispatch.code,
      newPassword: "churchNewPass2026!",
      now: new Date(now.getTime() + 20_000),
    });

    expect(resetRes.success).toBe(true);
    expect(resetRes.message).toContain("Password reset successful");

    // Verify new password in DB or fallback store
    if (mongoose.connection.readyState === 1) {
      const member = await Member.findOne({ phone: samplePhone });
      expect(member).toBeDefined();
      const isNewPassValid = await verifyPassword("churchNewPass2026!", member!.passwordHash);
      expect(isNewPassValid).toBe(true);
    } else {
      const fallbackMember = getFallbackOtpMember(samplePhone);
      expect(fallbackMember).toBeDefined();
      const isNewPassValid = await verifyPassword(
        "churchNewPass2026!",
        fallbackMember!.passwordHash,
      );
      expect(isNewPassValid).toBe(true);
    }
  });
});
