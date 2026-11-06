import { ApolloServer } from "@apollo/server";
import { describe, expect, it } from "vitest";

import type { GraphQLContext } from "@/graphql/context";
import { resolvers } from "@/graphql/resolvers";
import { typeDefs } from "@/graphql/schema";
import { buildCheckinUrl, getTimeSlot, signServiceToken, verifyServiceToken } from "@/services/qr";
import { createServiceInputSchema } from "@/services/validation";

describe("Services & Rotating Service QR Engine (Slice 3)", () => {
  const sampleServiceId = "65f000000000000000000100";
  const sampleQrSecret = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
  const fixedNowMs = 1_731_831_600_000; // Fixed timestamp for deterministic slot testing

  describe("Stateless HMAC-SHA256 QR Token Signing & Verification", () => {
    it("computes deterministic 60-second time slots and builds check-in paths", () => {
      const slot = getTimeSlot(fixedNowMs, 60);
      expect(slot).toBe(Math.floor(fixedNowMs / 60_000));

      const token = signServiceToken(sampleServiceId, sampleQrSecret, slot);
      expect(token).toContain(`${slot}.`);
      expect(buildCheckinUrl(sampleServiceId, token)).toBe(
        `/checkin/${sampleServiceId}?t=${encodeURIComponent(token)}`,
      );
    });

    it("accepts a token signed for the current 60s time slot", () => {
      const currentSlot = getTimeSlot(fixedNowMs, 60);
      const token = signServiceToken(sampleServiceId, sampleQrSecret, currentSlot);

      const verification = verifyServiceToken(sampleServiceId, sampleQrSecret, token, fixedNowMs);
      expect(verification.valid).toBe(true);
      expect(verification.reason).toBe("VALID");
      expect(verification.slot).toBe(currentSlot);
    });

    it("accepts a token signed for the immediate previous 60s time slot (grace window)", () => {
      const prevSlot = getTimeSlot(fixedNowMs, 60) - 1;
      const token = signServiceToken(sampleServiceId, sampleQrSecret, prevSlot);

      const verification = verifyServiceToken(sampleServiceId, sampleQrSecret, token, fixedNowMs);
      expect(verification.valid).toBe(true);
      expect(verification.reason).toBe("VALID");
      expect(verification.slot).toBe(prevSlot);
    });

    it("rejects expired tokens from 2 or more slots ago with EXPIRED_TOKEN", () => {
      const expiredSlot = getTimeSlot(fixedNowMs, 60) - 2;
      const token = signServiceToken(sampleServiceId, sampleQrSecret, expiredSlot);

      const verification = verifyServiceToken(sampleServiceId, sampleQrSecret, token, fixedNowMs);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe("EXPIRED_TOKEN");
    });

    it("rejects tampered tokens or tokens signed for another serviceId with INVALID_TOKEN", () => {
      const currentSlot = getTimeSlot(fixedNowMs, 60);
      const token = signServiceToken(sampleServiceId, sampleQrSecret, currentSlot);

      const tampered = `${token.slice(0, -4)}ffff`;
      expect(verifyServiceToken(sampleServiceId, sampleQrSecret, tampered, fixedNowMs)).toEqual({
        valid: false,
        reason: "INVALID_TOKEN",
      });

      expect(
        verifyServiceToken("65f000000000000000000999", sampleQrSecret, token, fixedNowMs),
      ).toEqual({
        valid: false,
        reason: "INVALID_TOKEN",
      });
    });
  });

  describe("Service Input Validation & GraphQL Security Guards", () => {
    it("validates createServiceInputSchema with defaults", () => {
      const parsed = createServiceInputSchema.parse({
        name: "Sunday First Service",
        serviceType: "SUNDAY",
        serviceDate: "2026-11-08",
      });

      expect(parsed.name).toBe("Sunday First Service");
      expect(parsed.serviceType).toBe("SUNDAY");
      expect(parsed.location).toBe("Grace Sanctuary Auditorium");
      expect(parsed.usherStation).toBe("Door A (Main Entrance)");
    });

    it("rejects MEMBER role from createService, openService, closeService, and serviceQr", async () => {
      const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
      const sampleMember = {
        id: "65f000000000000000000001",
        fullName: "Isaac Olumide Adeleke",
        phone: "+2348034567890",
        role: "MEMBER" as const,
        department: "Sanctuary Choir",
        activities: ["Sunday School Class 4"],
        memberCode: "CC-2024-0482",
        currentStreak: 7,
        longestStreak: 14,
      };

      const createRes = await server.executeOperation(
        {
          query: `mutation($input: CreateServiceInput!) { createService(input: $input) { id name } }`,
          variables: {
            input: {
              name: "Sunday First Service",
              serviceType: "SUNDAY",
              serviceDate: "2026-11-08",
            },
          },
        },
        { contextValue: { member: sampleMember } },
      );
      if (createRes.body.kind === "single") {
        expect(createRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const openRes = await server.executeOperation(
        {
          query: `mutation { openService(serviceId: "${sampleServiceId}") { id status } }`,
        },
        { contextValue: { member: sampleMember } },
      );
      if (openRes.body.kind === "single") {
        expect(openRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const closeRes = await server.executeOperation(
        {
          query: `mutation { closeService(serviceId: "${sampleServiceId}") { id status } }`,
        },
        { contextValue: { member: sampleMember } },
      );
      if (closeRes.body.kind === "single") {
        expect(closeRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const qrRes = await server.executeOperation(
        {
          query: `query { serviceQr(serviceId: "${sampleServiceId}") { token checkinPath } }`,
        },
        { contextValue: { member: sampleMember } },
      );
      if (qrRes.body.kind === "single") {
        expect(qrRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }
    });

    it("never exposes qrSecret on the GraphQL Service type", async () => {
      const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
      const res = await server.executeOperation({
        query: `query { activeService { id name qrSecret } }`,
      });

      expect(res.body.kind).toBe("single");
      if (res.body.kind === "single") {
        expect(res.body.singleResult.errors?.[0]?.message).toContain(
          'Cannot query field "qrSecret" on type "Service"',
        );
      }
    });
  });
});
