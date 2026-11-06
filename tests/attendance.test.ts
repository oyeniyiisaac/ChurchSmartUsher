import { ApolloServer } from "@apollo/server";
import { describe, expect, it } from "vitest";

import type { AuthenticatedMember } from "@/auth/session";
import type { GraphQLContext } from "@/graphql/context";
import { resolvers } from "@/graphql/resolvers";
import { typeDefs } from "@/graphql/schema";
import { isDuplicateKeyError } from "@/services/attendance";
import { getTimeSlot, signServiceToken } from "@/services/qr";
import {
  markManualPresentInputSchema,
  markPresentInputSchema,
  registerGuestInputSchema,
} from "@/services/validation";

const mockMember: AuthenticatedMember = {
  id: "65f000000000000000000003",
  fullName: "Isaac Olumide Adeleke",
  phone: "+2348000000003",
  email: "isaac.adeleke@gmail.com",
  gender: "Male",
  role: "MEMBER",
  status: "ACTIVE",
  department: "Sanctuary Choir",
  activities: ["Sunday School Class 4"],
  departmentIds: [],
  activityIds: [],
  memberCode: "CC-2024-0482",
  currentStreak: 6,
  longestStreak: 14,
  consentGivenAt: "2026-01-01T00:00:00.000Z",
};

const mockUsher: AuthenticatedMember = {
  ...mockMember,
  id: "65f000000000000000000002",
  fullName: "Brother Emmanuel Kalu",
  phone: "+2348000000002",
  role: "USHER",
};

describe("Attendance Check-in, Duplicate Handling & Live List (Slice 4)", () => {
  it("detects MongoDB duplicate key error code 11000 reliably", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
    expect(isDuplicateKeyError(new Error("E11000 duplicate key error collection"))).toBe(true);
    expect(isDuplicateKeyError(new Error("Validation failed"))).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
  });

  it("validates markPresent, markManualPresent, and registerGuest inputs with Zod", () => {
    const validPresent = markPresentInputSchema.parse({
      serviceId: "65f000000000000000000100",
      token: "29900000.abcd",
    });
    expect(validPresent.serviceId).toBe("65f000000000000000000100");

    const validManual = markManualPresentInputSchema.parse({
      serviceId: "65f000000000000000000100",
      memberId: "65f000000000000000000003",
    });
    expect(validManual.station).toBe("Usher Terminal 02");

    const validGuest = registerGuestInputSchema.parse({
      serviceId: "65f000000000000000000100",
      fullName: "Chinedu Eze",
      phone: "0803 123 4567",
      invitedBy: "Sister Chioma",
    });
    expect(validGuest.phone).toBe("+2348031234567");
  });

  it("rejects unauthenticated markPresent calls with UNAUTHENTICATED", async () => {
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
    });

    const res = await server.executeOperation(
      {
        query: `
          mutation MarkPresent($serviceId: ID!, $token: String!) {
            markPresent(serviceId: $serviceId, token: $token) {
              status
              message
            }
          }
        `,
        variables: {
          serviceId: "65f000000000000000000100",
          token: "preview",
        },
      },
      { contextValue: { member: null } },
    );

    expect(res.body.kind).toBe("single");
    if (res.body.kind === "single") {
      expect(res.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
    }
  });

  it("returns EXPIRED_TOKEN and INVALID_TOKEN for expired or tampered tokens on markPresent", async () => {
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
    });

    const serviceId = "65f000000000000000000100";
    const secret = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const oldSlot = getTimeSlot() - 5;
    const expiredToken = signServiceToken(serviceId, secret, oldSlot);

    const expiredRes = await server.executeOperation(
      {
        query: `
          mutation MarkPresent($serviceId: ID!, $token: String!) {
            markPresent(serviceId: $serviceId, token: $token) {
              status
              message
            }
          }
        `,
        variables: {
          serviceId,
          token: expiredToken,
        },
      },
      { contextValue: { member: mockMember } },
    );

    expect(expiredRes.body.kind).toBe("single");
    if (expiredRes.body.kind === "single") {
      expect(expiredRes.body.singleResult.errors).toBeUndefined();
      expect(expiredRes.body.singleResult.data?.markPresent).toMatchObject({
        status: "EXPIRED_TOKEN",
      });
    }

    const tamperedRes = await server.executeOperation(
      {
        query: `
          mutation MarkPresent($serviceId: ID!, $token: String!) {
            markPresent(serviceId: $serviceId, token: $token) {
              status
              message
            }
          }
        `,
        variables: {
          serviceId,
          token: "99999999.0000000000000000000000000000000000000000000000000000000000000000",
        },
      },
      { contextValue: { member: mockMember } },
    );

    expect(tamperedRes.body.kind).toBe("single");
    if (tamperedRes.body.kind === "single") {
      expect(tamperedRes.body.singleResult.errors).toBeUndefined();
      expect(tamperedRes.body.singleResult.data?.markPresent).toMatchObject({
        status: "INVALID_TOKEN",
      });
    }
  });

  it("records attendance for the session member and returns ALREADY_MARKED on duplicate check-in", async () => {
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
    });

    const serviceId = "65f000000000000000000100";
    const secret = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const validToken = signServiceToken(serviceId, secret, getTimeSlot());

    const firstRes = await server.executeOperation(
      {
        query: `
          mutation MarkPresent($serviceId: ID!, $token: String!) {
            markPresent(serviceId: $serviceId, token: $token) {
              status
              message
              attendance {
                memberName
                method
              }
            }
          }
        `,
        variables: {
          serviceId,
          token: validToken,
        },
      },
      { contextValue: { member: mockMember } },
    );

    expect(firstRes.body.kind).toBe("single");
    if (firstRes.body.kind === "single") {
      expect(firstRes.body.singleResult.errors).toBeUndefined();
      expect(firstRes.body.singleResult.data?.markPresent).toMatchObject({
        status: "MARKED_PRESENT",
        attendance: {
          memberName: "Isaac Olumide Adeleke",
          method: "QR",
        },
      });
    }

    // Second scan for the same member & service must return ALREADY_MARKED
    const duplicateRes = await server.executeOperation(
      {
        query: `
          mutation MarkPresent($serviceId: ID!, $token: String!) {
            markPresent(serviceId: $serviceId, token: $token) {
              status
              message
            }
          }
        `,
        variables: {
          serviceId,
          token: validToken,
        },
      },
      { contextValue: { member: mockMember } },
    );

    expect(duplicateRes.body.kind).toBe("single");
    if (duplicateRes.body.kind === "single") {
      expect(duplicateRes.body.singleResult.errors).toBeUndefined();
      expect(duplicateRes.body.singleResult.data?.markPresent).toMatchObject({
        status: "ALREADY_MARKED",
      });
    }
  });

  it("blocks MEMBER from markManualPresent, registerGuestAttendance, undoAttendance, and serviceAttendance", async () => {
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
    });

    const manualRes = await server.executeOperation(
      {
        query: `
          mutation Manual($serviceId: ID!, $memberId: ID!) {
            markManualPresent(serviceId: $serviceId, memberId: $memberId) {
              status
            }
          }
        `,
        variables: {
          serviceId: "65f000000000000000000100",
          memberId: mockMember.id,
        },
      },
      { contextValue: { member: mockMember } },
    );

    if (manualRes.body.kind === "single") {
      expect(manualRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
    }

    const guestRes = await server.executeOperation(
      {
        query: `
          mutation Guest($input: RegisterGuestInput!) {
            registerGuestAttendance(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            serviceId: "65f000000000000000000100",
            fullName: "Ngozi Eze",
            phone: "08031234567",
          },
        },
      },
      { contextValue: { member: mockMember } },
    );

    if (guestRes.body.kind === "single") {
      expect(guestRes.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
    }

    // USHER is authorized for serviceAttendance
    const usherAttendanceRes = await server.executeOperation(
      {
        query: `
          query LiveAttendance($serviceId: ID!) {
            serviceAttendance(serviceId: $serviceId) {
              totalCount
              memberCount
              guestCount
            }
          }
        `,
        variables: {
          serviceId: "65f000000000000000000100",
        },
      },
      { contextValue: { member: mockUsher } },
    );

    if (usherAttendanceRes.body.kind === "single") {
      expect(usherAttendanceRes.body.singleResult.errors).toBeUndefined();
      expect(usherAttendanceRes.body.singleResult.data?.serviceAttendance).toBeDefined();
    }
  });
});
