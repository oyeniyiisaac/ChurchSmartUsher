import { beforeEach, describe, expect, it } from "vitest";
import { resolvers } from "../src/graphql/resolvers";
import {
  CHECKIN_CODE_TTL_MS,
  MAX_CODE_REQUESTS_PER_WINDOW,
  MAX_VERIFY_ATTEMPTS,
  requestCheckinCode,
  resetCheckinCodesForTests,
  verifyCheckinCode,
} from "../src/services/checkin-code";

describe("Slice 8 & 9 — SMS / WhatsApp Check-In Codes, Rate Limits & End-to-End Check-in", () => {
  const memberUser = {
    id: "65f000000000000000000099",
    fullName: "Sister Deborah Adeleke",
    phone: "+2348030001122",
    role: "MEMBER" as const,
    department: "Sanctuary Choir",
    activities: ["Sunday First Service"],
    memberCode: "MEM-2026-0099",
    currentStreak: 3,
    longestStreak: 5,
  };

  beforeEach(() => {
    resetCheckinCodesForTests();
  });

  it("generates a 6-digit SMS/WhatsApp code, verifies it to mark attendance, and prevents reuse or duplicate check-in", async () => {
    const now = new Date("2026-11-17T08:30:00.000Z");
    const serviceId = "65f000000000000000000100";

    const dispatched = await requestCheckinCode(memberUser, {
      serviceId,
      channel: "WHATSAPP",
      now,
    });

    expect(dispatched.channel).toBe("WHATSAPP");
    expect(dispatched.code).toMatch(/^\d{6}$/);
    expect(dispatched.maskedDestination).toContain("1122");
    expect(new Date(dispatched.expiresAt).getTime() - now.getTime()).toBe(CHECKIN_CODE_TTL_MS);

    // Verify valid code -> marks member PRESENT
    const verified = await verifyCheckinCode(memberUser, {
      serviceId,
      code: dispatched.code,
      now: new Date(now.getTime() + 30_000),
    });

    expect(["MARKED_PRESENT", "ALREADY_MARKED"]).toContain(verified.status);
    expect(verified.attendance?.memberName).toBe("Sister Deborah Adeleke");

    // Reusing the same code after consumption is rejected
    const secondTry = await verifyCheckinCode(memberUser, {
      serviceId,
      code: dispatched.code,
      now: new Date(now.getTime() + 45_000),
    });
    expect(secondTry.status).toBe("INVALID_TOKEN");
  });

  it("rejects expired check-in codes after 10 minutes", async () => {
    const now = new Date("2026-11-17T08:30:00.000Z");
    const serviceId = "65f000000000000000000100";

    const dispatched = await requestCheckinCode(memberUser, {
      serviceId,
      channel: "SMS",
      now,
    });

    const expiredVerify = await verifyCheckinCode(memberUser, {
      serviceId,
      code: dispatched.code,
      now: new Date(now.getTime() + CHECKIN_CODE_TTL_MS + 1_000),
    });

    expect(expiredVerify.status).toBe("EXPIRED_TOKEN");
    expect(expiredVerify.message).toMatch(/expired/i);
  });

  it("enforces per-member request rate limits (max 3 per 15m) and brute-force attempt lockouts (max 5 wrong tries)", async () => {
    const now = new Date("2026-11-17T08:30:00.000Z");
    const serviceId = "65f000000000000000000100";

    for (let i = 0; i < MAX_CODE_REQUESTS_PER_WINDOW; i += 1) {
      await requestCheckinCode(memberUser, {
        serviceId,
        channel: "SMS",
        now: new Date(now.getTime() + i * 1_000),
      });
    }

    // 4th request within 15 minutes must throw rate-limit error
    await expect(
      requestCheckinCode(memberUser, {
        serviceId,
        channel: "SMS",
        now: new Date(now.getTime() + 10_000),
      }),
    ).rejects.toThrow(/rate limit|too many/i);

    // Advance 16 minutes -> request succeeds again
    const freshTime = new Date(now.getTime() + 16 * 60 * 1000);
    const freshCode = await requestCheckinCode(memberUser, {
      serviceId,
      channel: "WHATSAPP",
      now: freshTime,
    });

    // Exhaust MAX_VERIFY_ATTEMPTS with wrong codes
    for (let attempt = 1; attempt <= MAX_VERIFY_ATTEMPTS; attempt += 1) {
      const wrongRes = await verifyCheckinCode(memberUser, {
        serviceId,
        code: "000000",
        now: freshTime,
      });
      expect(wrongRes.status).toBe("INVALID_TOKEN");
    }

    // Even the correct code is now locked out after 5 wrong attempts
    const lockedOutRes = await verifyCheckinCode(memberUser, {
      serviceId,
      code: freshCode.code,
      now: freshTime,
    });
    expect(lockedOutRes.status).toBe("INVALID_TOKEN");
    expect(lockedOutRes.message).toMatch(/locked|attempts/i);
  });

  it("wires requestCheckinCode and verifyCheckinCode through GraphQL resolvers with authentication guards", async () => {
    const serviceId = "65f000000000000000000100";

    await expect(
      resolvers.Mutation.requestCheckinCode(
        {},
        { serviceId, channel: "WHATSAPP" },
        { member: null },
      ),
    ).rejects.toThrow(/Authentication required/i);

    const dispatchRes = await resolvers.Mutation.requestCheckinCode(
      {},
      { serviceId, channel: "WHATSAPP" },
      { member: memberUser },
    );
    expect(dispatchRes.code).toMatch(/^\d{6}$/);

    const verifyRes = await resolvers.Mutation.verifyCheckinCode(
      {},
      { serviceId, code: dispatchRes.code },
      { member: memberUser },
    );
    expect(["MARKED_PRESENT", "ALREADY_MARKED"]).toContain(verifyRes.status);
  });
});
