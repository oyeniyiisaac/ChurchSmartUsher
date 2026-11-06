import { beforeEach, describe, expect, it } from "vitest";
import manifest from "../app/manifest";
import { resolvers } from "../src/graphql/resolvers";
import {
  computeDistanceMeters,
  getParishSettings,
  resetParishSettingsForTests,
  updateParishSettings,
  verifySanctuaryGeofence,
} from "../src/services/settings";

describe("Slice 7 — Settings, Sanctuary Geofence, Role Matrix & PWA Manifest", () => {
  beforeEach(() => {
    resetParishSettingsForTests();
  });

  it("computes Haversine distance in meters and validates sanctuary geofence radius", () => {
    const sanctuaryLat = 6.5244;
    const sanctuaryLng = 3.3792;

    // Exact altar coordinates -> 0 meters
    expect(computeDistanceMeters(sanctuaryLat, sanctuaryLng, sanctuaryLat, sanctuaryLng)).toBe(0);

    // ~85 meters north of sanctuary -> inside 150m radius
    const insideResult = verifySanctuaryGeofence({
      latitude: 6.5251,
      longitude: 3.3792,
    });
    expect(insideResult.withinGeofence).toBe(true);
    expect(insideResult.distanceMeters).toBeLessThan(150);

    // ~1.1 km away -> outside 150m radius when geofenceEnabled is true
    const outsideResult = verifySanctuaryGeofence({
      latitude: 6.535,
      longitude: 3.3792,
    });
    expect(outsideResult.withinGeofence).toBe(false);
    expect(outsideResult.distanceMeters).toBeGreaterThan(150);

    // When geofenceEnabled is toggled off, check-in is permitted regardless of distance
    updateParishSettings({ geofenceEnabled: false });
    const bypassedResult = verifySanctuaryGeofence({
      latitude: 6.535,
      longitude: 3.3792,
    });
    expect(bypassedResult.withinGeofence).toBe(true);
  });

  it("updates parish settings and enforces ADMIN role guards on GraphQL resolvers", async () => {
    const memberCtx = {
      member: {
        id: "mem-1",
        fullName: "Sister Adaobi",
        phone: "08030001111",
        role: "MEMBER" as const,
        department: "Sanctuary Choir",
        activities: ["Sunday First Service"],
        memberCode: "MEM-2026-0001",
        currentStreak: 4,
        longestStreak: 7,
      },
    };
    const adminCtx = {
      member: {
        id: "adm-1",
        fullName: "Pastor Emmanuel",
        phone: "08030009999",
        role: "ADMIN" as const,
        department: "Pastorate",
        activities: ["Pastoral Council"],
        memberCode: "ADM-2026-0001",
        currentStreak: 12,
        longestStreak: 12,
      },
    };

    const initial = getParishSettings();
    expect(initial.parishName).toBe("Grace Sanctuary Parish");
    expect(initial.qrRotationSeconds).toBe(45);
    expect(initial.geofenceRadiusMeters).toBe(150);

    await expect(resolvers.Query.parishSettings({}, {}, memberCtx)).rejects.toThrow(
      /Forbidden|insufficient/i,
    );

    await expect(
      resolvers.Mutation.updateParishSettings({}, { input: { qrRotationSeconds: 30 } }, memberCtx),
    ).rejects.toThrow(/Forbidden|insufficient/i);

    const updated = await resolvers.Mutation.updateParishSettings(
      {},
      {
        input: {
          parishName: "Grace Sanctuary Parish - Ikeja",
          qrRotationSeconds: 30,
          childMinorShieldEnabled: true,
        },
      },
      adminCtx,
    );

    expect(updated.parishName).toBe("Grace Sanctuary Parish - Ikeja");
    expect(updated.qrRotationSeconds).toBe(30);
    expect(updated.childMinorShieldEnabled).toBe(true);
  });

  it("exports a valid Next.js PWA Web App Manifest with Warm Sanctuary theme colors", () => {
    const pwa = manifest();
    expect(pwa.short_name).toBe("ChurchConnect");
    expect(pwa.display).toBe("standalone");
    expect(pwa.start_url).toBe("/dashboard");
    expect(pwa.background_color).toBe("#faf8ff");
    expect(pwa.theme_color).toBe("#00236f");
    expect(Array.isArray(pwa.icons)).toBe(true);
    expect(pwa.icons?.length).toBeGreaterThan(0);
  });
});
