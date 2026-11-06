import { ApolloServer } from "@apollo/server";
import { describe, expect, it } from "vitest";

import type { AuthenticatedMember } from "@/auth/session";
import type { GraphQLContext } from "@/graphql/context";
import { resolvers } from "@/graphql/resolvers";
import { typeDefs } from "@/graphql/schema";
import {
  calculateStreakFromHistory,
  generateAttendanceCsv,
  type StreakServiceItem,
  toLagosDateString,
} from "@/services/streak";

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
  currentStreak: 7,
  longestStreak: 14,
  consentGivenAt: "2026-01-01T00:00:00.000Z",
};

const mockAdmin: AuthenticatedMember = {
  ...mockMember,
  id: "65f000000000000000000001",
  fullName: "Pastor Emmanuel Adewale",
  phone: "+2348000000001",
  role: "ADMIN",
};

describe("Streak Calculation, Timezone Boundaries & Reports (Slice 5)", () => {
  it("matches hand-counted 5-service example (attend S1, S2, miss S3, attend S4, S5)", () => {
    const fiveSundayServices: StreakServiceItem[] = [
      { id: "S1", serviceType: "SUNDAY", serviceDate: "2026-10-04", status: "CLOSED" },
      { id: "S2", serviceType: "SUNDAY", serviceDate: "2026-10-11", status: "CLOSED" },
      { id: "S3", serviceType: "SUNDAY", serviceDate: "2026-10-18", status: "CLOSED" },
      { id: "S4", serviceType: "SUNDAY", serviceDate: "2026-10-25", status: "CLOSED" },
      { id: "S5", serviceType: "SUNDAY", serviceDate: "2026-11-01", status: "CLOSED" },
    ];

    const result = calculateStreakFromHistory(
      fiveSundayServices,
      new Set(["S1", "S2", "S4", "S5"]),
      "SUNDAY",
    );

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.totalAttended).toBe(4);
  });

  it("resets currentStreak to 0 when the latest CLOSED service is missed while preserving longestStreak", () => {
    const fiveSundayServices: StreakServiceItem[] = [
      { id: "S1", serviceType: "SUNDAY", serviceDate: "2026-10-04", status: "CLOSED" },
      { id: "S2", serviceType: "SUNDAY", serviceDate: "2026-10-11", status: "CLOSED" },
      { id: "S3", serviceType: "SUNDAY", serviceDate: "2026-10-18", status: "CLOSED" },
      { id: "S4", serviceType: "SUNDAY", serviceDate: "2026-10-25", status: "CLOSED" },
      { id: "S5", serviceType: "SUNDAY", serviceDate: "2026-11-01", status: "CLOSED" },
    ];

    // Attended S1..S4 (4 in a row), missed S5 when S5 was closed
    const result = calculateStreakFromHistory(
      fiveSundayServices,
      new Set(["S1", "S2", "S3", "S4"]),
      "SUNDAY",
    );

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(4);
    expect(result.totalAttended).toBe(4);
    // Faithful Starter (4 services in a row) remains unlocked via longestStreak >= 4
    expect(result.badges.find((b) => b.threshold === 4)?.unlocked).toBe(true);
    expect(result.badges.find((b) => b.threshold === 12)?.unlocked).toBe(false);
    expect(result.badges.find((b) => b.threshold === 52)?.unlocked).toBe(false);
  });

  it("isolates streaks by serviceType and ignores SCHEDULED or un-attended OPEN services", () => {
    const mixedServices: StreakServiceItem[] = [
      { id: "S1", serviceType: "SUNDAY", serviceDate: "2026-10-04", status: "CLOSED" },
      { id: "M1", serviceType: "MIDWEEK", serviceDate: "2026-10-07", status: "CLOSED" },
      { id: "S2", serviceType: "SUNDAY", serviceDate: "2026-10-11", status: "CLOSED" },
      { id: "S3", serviceType: "SUNDAY", serviceDate: "2026-10-18", status: "SCHEDULED" },
      { id: "S4", serviceType: "SUNDAY", serviceDate: "2026-10-25", status: "OPEN" },
    ];

    // Member attended S1 and S2, missed MIDWEEK M1, S3 was never opened, S4 is still OPEN
    const result = calculateStreakFromHistory(mixedServices, new Set(["S1", "S2"]), "SUNDAY");

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);

    // Once member checks into OPEN service S4, currentStreak increments immediately to 3
    const afterOpenCheckin = calculateStreakFromHistory(
      mixedServices,
      new Set(["S1", "S2", "S4"]),
      "SUNDAY",
    );
    expect(afterOpenCheckin.currentStreak).toBe(3);
    expect(afterOpenCheckin.longestStreak).toBe(3);
  });

  it("converts UTC timestamps into Africa/Lagos (UTC+1) calendar dates accurately", () => {
    // 23:30 UTC on Nov 1 is 00:30 WAT on Nov 2 in Africa/Lagos
    const utcLateNight = new Date("2026-11-01T23:30:00.000Z");
    expect(toLagosDateString(utcLateNight)).toBe("2026-11-02");

    // 07:30 UTC on Nov 1 is 08:30 WAT on Nov 1 in Africa/Lagos
    const utcMorning = new Date("2026-11-01T07:30:00.000Z");
    expect(toLagosDateString(utcMorning)).toBe("2026-11-01");
  });

  it("generates valid CSV export string with header and escaped values", () => {
    const csv = generateAttendanceCsv([
      {
        serviceName: "Sunday First Service",
        serviceDate: "2026-11-17",
        memberName: "Isaac Olumide Adeleke",
        memberCode: "CC-2024-0482",
        phone: "+2348000000003",
        department: "Sanctuary Choir",
        method: "QR",
        checkedInAt: "2026-11-17T07:42:00.000Z",
      },
    ]);

    const lines = csv.trim().split("\n");
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("Service Name,Service Date,Member Name");
    expect(lines[1]).toContain("Isaac Olumide Adeleke");
    expect(lines[1]).toContain("CC-2024-0482");
  });

  it("enforces role guards on myStreak, attendanceReports, and exportAttendanceCsv", async () => {
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers,
    });

    const memberStreakRes = await server.executeOperation(
      {
        query: `
          query MyStreak {
            myStreak {
              currentStreak
              longestStreak
              badges {
                code
                threshold
                unlocked
              }
            }
          }
        `,
      },
      { contextValue: { member: mockMember } },
    );

    if (memberStreakRes.body.kind === "single") {
      expect(memberStreakRes.body.singleResult.errors).toBeUndefined();
      expect(memberStreakRes.body.singleResult.data?.myStreak).toBeDefined();
    }

    // MEMBER cannot query attendanceReports or exportAttendanceCsv
    const forbiddenReports = await server.executeOperation(
      {
        query: `
          query Reports {
            attendanceReports {
              totalRecordedQ4
            }
          }
        `,
      },
      { contextValue: { member: mockMember } },
    );

    if (forbiddenReports.body.kind === "single") {
      expect(forbiddenReports.body.singleResult.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
    }

    // ADMIN can query attendanceReports and exportAttendanceCsv
    const adminReports = await server.executeOperation(
      {
        query: `
          query AdminReports {
            attendanceReports {
              totalRecordedQ4
              avgSundayTurnout
              digitalScanPercent
              visitorRetentionPercent
              archiveRows {
                id
                name
                attendanceCount
              }
            }
            exportAttendanceCsv
          }
        `,
      },
      { contextValue: { member: mockAdmin } },
    );

    if (adminReports.body.kind === "single") {
      expect(adminReports.body.singleResult.errors).toBeUndefined();
      expect(adminReports.body.singleResult.data?.attendanceReports).toMatchObject({
        totalRecordedQ4: 3842,
        avgSundayTurnout: 318,
      });
      expect(typeof adminReports.body.singleResult.data?.exportAttendanceCsv).toBe("string");
    }
  });
});
