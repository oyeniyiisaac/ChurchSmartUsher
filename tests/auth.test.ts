import { ApolloServer } from "@apollo/server";
import { describe, expect, it } from "vitest";

import { hashPassword, hashSessionToken, verifyPassword } from "@/auth/password";
import type { GraphQLContext } from "@/graphql/context";
import { resolvers } from "@/graphql/resolvers";
import { typeDefs } from "@/graphql/schema";
import {
  canMemberAccessPath,
  getRoleLandingPath,
  requireAdminAccess,
  requirePhotoUploadAccess,
  requireRole,
  requireUsherOrAdminAccess,
  resolvePostAuthRedirect,
} from "@/services/auth";
import { getSafeReturnTo, normalizePhoneNumber } from "@/services/validation";

describe("Authentication, Validation & Role Guards (Slice 1)", () => {
  describe("normalizePhoneNumber", () => {
    it("normalizes local 11-digit Nigerian numbers to +234", () => {
      expect(normalizePhoneNumber("08012345678")).toBe("+2348012345678");
      expect(normalizePhoneNumber("09098765432")).toBe("+2349098765432");
    });

    it("normalizes 234-prefixed numbers and strips spaces/hyphens", () => {
      expect(normalizePhoneNumber("2348012345678")).toBe("+2348012345678");
      expect(normalizePhoneNumber("+234 801-234-5678")).toBe("+2348012345678");
    });

    it("throws on invalid phone numbers", () => {
      expect(() => normalizePhoneNumber("12345")).toThrow();
      expect(() => normalizePhoneNumber("abc")).toThrow();
    });
  });

  describe("hashPassword and verifyPassword", () => {
    it("hashes password with random salt and verifies matching password", async () => {
      const hash = await hashPassword("ChangeMe123!");
      expect(hash).toContain(":");
      expect(await verifyPassword("ChangeMe123!", hash)).toBe(true);
      expect(await verifyPassword("WrongPassword!", hash)).toBe(false);
    });
  });

  describe("hashSessionToken", () => {
    it("produces a deterministic 64-char SHA-256 hex digest", () => {
      const digest1 = hashSessionToken("sample-opaque-token");
      const digest2 = hashSessionToken("sample-opaque-token");
      expect(digest1).toBe(digest2);
      expect(digest1).toHaveLength(64);
      expect(digest1).not.toBe("sample-opaque-token");
    });
  });

  describe("getSafeReturnTo & getRoleLandingPath", () => {
    it("preserves valid relative check-in paths", () => {
      expect(getSafeReturnTo("/checkin/srv_123?t=slot.sig")).toBe("/checkin/srv_123?t=slot.sig");
    });

    it("rejects external or protocol-relative URLs", () => {
      expect(getSafeReturnTo("https://evil.example.com")).toBeNull();
      expect(getSafeReturnTo("//evil.example.com")).toBeNull();
      expect(getSafeReturnTo("javascript:alert(1)")).toBeNull();
    });

    it("maps each role to its designated landing screen", () => {
      expect(getRoleLandingPath("MEMBER")).toBe("/dashboard");
      expect(getRoleLandingPath("USHER")).toBe("/usher");
      expect(getRoleLandingPath("ADMIN")).toBe("/admin");
    });
  });

  describe("requireRole server guard & GraphQL execution", () => {
    const sampleMember = {
      id: "mem_1",
      fullName: "Isaac Oyeniyi",
      phone: "+2348012345678",
      role: "MEMBER" as const,
      department: "Choir",
      activities: ["Sunday School"],
      memberCode: "CC-0001",
      currentStreak: 3,
      longestStreak: 5,
    };

    it("throws UNAUTHENTICATED when no session user is present", () => {
      expect(() => requireRole(null, ["MEMBER", "ADMIN"])).toThrow(/Authentication required/);
    });

    it("throws FORBIDDEN when a MEMBER attempts an ADMIN operation", () => {
      expect(() => requireRole(sampleMember, ["ADMIN"])).toThrow(/Forbidden/);
    });

    it("returns the authenticated member when role is permitted", () => {
      const adminMember = { ...sampleMember, role: "ADMIN" as const };
      expect(requireRole(adminMember, ["ADMIN"])).toEqual(adminMember);
    });

    it("blocks MEMBER from GraphQL adminOnlyCheck and allows ADMIN", async () => {
      const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

      const memberResponse = await server.executeOperation(
        { query: `query { adminOnlyCheck }` },
        { contextValue: { member: sampleMember } },
      );

      expect(memberResponse.body.kind).toBe("single");
      if (memberResponse.body.kind === "single") {
        expect(memberResponse.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const adminResponse = await server.executeOperation(
        { query: `query { adminOnlyCheck }` },
        { contextValue: { member: { ...sampleMember, role: "ADMIN" } } },
      );

      expect(adminResponse.body.kind).toBe("single");
      if (adminResponse.body.kind === "single") {
        expect(adminResponse.body.singleResult.errors).toBeUndefined();
        expect(adminResponse.body.singleResult.data?.adminOnlyCheck).toContain(
          "Authorized admin access confirmed",
        );
      }
    });

    it("restricts normal members and other units from Usher and Admin pages while allowing Media Unit to access /admin/photos", () => {
      const choirMember = {
        ...sampleMember,
        role: "MEMBER" as const,
        department: "Sanctuary Choir",
      };
      const mediaMember = { ...sampleMember, role: "MEMBER" as const, department: "Media Unit" };
      const usherMember = { ...sampleMember, role: "USHER" as const, department: "Ushering Unit" };
      const adminMember = { ...sampleMember, role: "ADMIN" as const, department: "Administration" };

      // 1. Normal Member / Choir Unit: Member pages only
      expect(canMemberAccessPath(choirMember, "/dashboard")).toBe(true);
      expect(canMemberAccessPath(choirMember, "/photos")).toBe(true);
      expect(canMemberAccessPath(choirMember, "/usher")).toBe(false);
      expect(canMemberAccessPath(choirMember, "/usher/live")).toBe(false);
      expect(canMemberAccessPath(choirMember, "/admin")).toBe(false);
      expect(canMemberAccessPath(choirMember, "/admin/photos")).toBe(false);
      expect(canMemberAccessPath(choirMember, "/services")).toBe(false);
      expect(() => requireUsherOrAdminAccess(choirMember)).toThrow(/Forbidden/);
      expect(() => requirePhotoUploadAccess(choirMember)).toThrow(/Forbidden/);
      expect(() => requireAdminAccess(choirMember)).toThrow(/Forbidden/);

      // 2. Media Unit Member: Member pages + /admin/photos ONLY (no Usher or other Admin pages)
      expect(canMemberAccessPath(mediaMember, "/dashboard")).toBe(true);
      expect(canMemberAccessPath(mediaMember, "/admin/photos")).toBe(true);
      expect(canMemberAccessPath(mediaMember, "/usher")).toBe(false);
      expect(canMemberAccessPath(mediaMember, "/admin")).toBe(false);
      expect(canMemberAccessPath(mediaMember, "/members")).toBe(false);
      expect(canMemberAccessPath(mediaMember, "/settings")).toBe(false);
      expect(requirePhotoUploadAccess(mediaMember)).toEqual(mediaMember);
      expect(() => requireUsherOrAdminAccess(mediaMember)).toThrow(/Forbidden/);
      expect(() => requireAdminAccess(mediaMember)).toThrow(/Forbidden/);

      // 3. Usher: Member pages + Usher pages (/usher, /usher/live) ONLY (no Admin or Media Photo Hub)
      expect(canMemberAccessPath(usherMember, "/usher")).toBe(true);
      expect(canMemberAccessPath(usherMember, "/usher/live")).toBe(true);
      expect(canMemberAccessPath(usherMember, "/admin")).toBe(false);
      expect(canMemberAccessPath(usherMember, "/admin/photos")).toBe(false);
      expect(canMemberAccessPath(usherMember, "/reports")).toBe(false);
      expect(requireUsherOrAdminAccess(usherMember)).toEqual(usherMember);
      expect(() => requirePhotoUploadAccess(usherMember)).toThrow(/Forbidden/);
      expect(() => requireAdminAccess(usherMember)).toThrow(/Forbidden/);

      // 4. Admin: Full access across all sections
      expect(canMemberAccessPath(adminMember, "/admin")).toBe(true);
      expect(canMemberAccessPath(adminMember, "/admin/photos")).toBe(true);
      expect(canMemberAccessPath(adminMember, "/usher")).toBe(true);
      expect(requireAdminAccess(adminMember)).toEqual(adminMember);
      expect(requirePhotoUploadAccess(adminMember)).toEqual(adminMember);
      expect(requireUsherOrAdminAccess(adminMember)).toEqual(adminMember);

      // 5. Post-auth redirect prevents unauthorized returnTo escalation
      expect(resolvePostAuthRedirect(choirMember, "/admin")).toBe("/dashboard");
      expect(resolvePostAuthRedirect(mediaMember, "/admin/photos")).toBe("/admin/photos");
      expect(resolvePostAuthRedirect(mediaMember, "/admin")).toBe("/dashboard");
      expect(resolvePostAuthRedirect(usherMember, "/admin")).toBe("/usher");
    });
  });
});
