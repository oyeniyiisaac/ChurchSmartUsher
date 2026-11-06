import { ApolloServer } from "@apollo/server";
import { describe, expect, it } from "vitest";

import type { GraphQLContext } from "@/graphql/context";
import { resolvers } from "@/graphql/resolvers";
import { typeDefs } from "@/graphql/schema";
import { formatMemberCode } from "@/services/profile";
import {
  activityInputSchema,
  assignAffiliationsInputSchema,
  departmentInputSchema,
  updateProfileInputSchema,
} from "@/services/validation";

describe("Profiles, Departments, and Activities (Slice 2)", () => {
  describe("formatMemberCode", () => {
    it("formats year and sequence number into zero-padded CC-YYYY-NNNN code", () => {
      expect(formatMemberCode(2026, 1)).toBe("CC-2026-0001");
      expect(formatMemberCode(2026, 482)).toBe("CC-2026-0482");
      expect(formatMemberCode(2024, 1248)).toBe("CC-2024-1248");
    });
  });

  describe("Zod Validation Schemas (Slice 2)", () => {
    it("validates updateProfileInputSchema and normalizes Nigerian phone numbers", () => {
      const parsed = updateProfileInputSchema.parse({
        fullName: "Isaac Olumide Adeleke",
        phone: "0803 456 7890",
        email: "isaac.adeleke@gmail.com",
        gender: "Male",
        emergencyContact: "+2348021112222",
        notes: "Tenor Lead in Sanctuary Choir",
      });

      expect(parsed.fullName).toBe("Isaac Olumide Adeleke");
      expect(parsed.phone).toBe("+2348034567890");
      expect(parsed.email).toBe("isaac.adeleke@gmail.com");
      expect(parsed.gender).toBe("Male");
    });

    it("rejects short fullName or invalid email in updateProfileInputSchema", () => {
      expect(() =>
        updateProfileInputSchema.parse({
          fullName: "A",
        }),
      ).toThrow();

      expect(() =>
        updateProfileInputSchema.parse({
          fullName: "Isaac Adeleke",
          email: "not-an-email",
        }),
      ).toThrow();
    });

    it("validates departmentInputSchema and activityInputSchema", () => {
      const dept = departmentInputSchema.parse({
        name: "Sanctuary Choir",
        description: "Music and worship ministry",
        icon: "music_note",
      });
      expect(dept.name).toBe("Sanctuary Choir");
      expect(dept.icon).toBe("music_note");

      const activity = activityInputSchema.parse({
        name: "Sunday School Class 4",
        description: "Young Adults Fellowship",
        schedule: "Sundays 7:15 AM",
        icon: "school",
      });
      expect(activity.name).toBe("Sunday School Class 4");
      expect(activity.schedule).toBe("Sundays 7:15 AM");
    });

    it("validates assignAffiliationsInputSchema", () => {
      const parsed = assignAffiliationsInputSchema.parse({
        memberId: "65f000000000000000000001",
        departmentIds: ["65f000000000000000000010"],
        activityIds: ["65f000000000000000000020", "65f000000000000000000021"],
      });
      expect(parsed.departmentIds).toHaveLength(1);
      expect(parsed.activityIds).toHaveLength(2);
    });
  });

  describe("GraphQL Authorization & Profile Operations", () => {
    const sampleMember = {
      id: "65f000000000000000000001",
      fullName: "Isaac Olumide Adeleke",
      phone: "+2348034567890",
      email: "isaac.adeleke@gmail.com",
      gender: "Male" as const,
      role: "MEMBER" as const,
      status: "ACTIVE",
      department: "Sanctuary Choir",
      activities: ["Sunday School Class 4", "Midweek Bible Study"],
      departmentIds: [],
      activityIds: [],
      memberCode: "CC-2026-0482",
      currentStreak: 7,
      longestStreak: 14,
      consentGivenAt: "2026-01-01T00:00:00.000Z",
    };

    it("rejects UNAUTHENTICATED requests to myProfile and updateMyProfile", async () => {
      const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

      const profileRes = await server.executeOperation(
        { query: `query { myProfile { id fullName memberCode } }` },
        { contextValue: { member: null } },
      );

      expect(profileRes.body.kind).toBe("single");
      if (profileRes.body.kind === "single") {
        expect(profileRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
      }

      const updateRes = await server.executeOperation(
        {
          query: `mutation($input: UpdateProfileInput!) { updateMyProfile(input: $input) { id } }`,
          variables: { input: { fullName: "Updated Name" } },
        },
        { contextValue: { member: null } },
      );

      expect(updateRes.body.kind).toBe("single");
      if (updateRes.body.kind === "single") {
        expect(updateRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
      }
    });

    it("rejects MEMBER role from createDepartment, createActivity, assignMemberAffiliations, and members directory", async () => {
      const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

      const createDeptRes = await server.executeOperation(
        {
          query: `mutation($input: DepartmentInput!) { createDepartment(input: $input) { id name } }`,
          variables: { input: { name: "New Unit" } },
        },
        { contextValue: { member: sampleMember } },
      );
      if (createDeptRes.body.kind === "single") {
        expect(createDeptRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const createActRes = await server.executeOperation(
        {
          query: `mutation($input: ActivityInput!) { createActivity(input: $input) { id name } }`,
          variables: { input: { name: "New Cohort" } },
        },
        { contextValue: { member: sampleMember } },
      );
      if (createActRes.body.kind === "single") {
        expect(createActRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const assignRes = await server.executeOperation(
        {
          query: `mutation($input: AssignAffiliationsInput!) { assignMemberAffiliations(input: $input) { id } }`,
          variables: {
            input: {
              memberId: sampleMember.id,
              departmentIds: [],
              activityIds: [],
            },
          },
        },
        { contextValue: { member: sampleMember } },
      );
      if (assignRes.body.kind === "single") {
        expect(assignRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }

      const directoryRes = await server.executeOperation(
        {
          query: `query { members { id fullName } }`,
        },
        { contextValue: { member: sampleMember } },
      );
      if (directoryRes.body.kind === "single") {
        expect(directoryRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
      }
    });
  });
});
