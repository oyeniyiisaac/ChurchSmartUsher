import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { resolvers } from "../src/graphql/resolvers";
import {
  SEVEN_DAYS_MS,
  computePhotoExpiryDate,
  formatPhotoDaysLeft,
  getPhotoById,
  getPhotoStorageFilePath,
  listActivePhotos,
  listAdminPhotos,
  moderateServicePhoto,
  purgeExpiredPhotos,
  resetPhotoStoreForTests,
  uploadServicePhoto,
} from "../src/services/photo";

describe("Slice 6 — Service Photos with 7-Day Expiry & Physical File Purge", () => {
  beforeEach(async () => {
    await resetPhotoStoreForTests();
  });

  it("computes expiresAt strictly 7 days (604,800,000 ms) after uploadedAt and formats days-left badges", () => {
    const uploadedAt = new Date("2026-11-17T09:00:00.000Z");
    const expiresAt = computePhotoExpiryDate(uploadedAt);

    expect(expiresAt.getTime() - uploadedAt.getTime()).toBe(SEVEN_DAYS_MS);
    expect(expiresAt.toISOString()).toBe("2026-11-24T09:00:00.000Z");

    // Same day (< 18 hours since upload -> "Today" or "7d left")
    expect(formatPhotoDaysLeft(expiresAt, new Date("2026-11-17T12:00:00.000Z"), uploadedAt)).toBe(
      "Today",
    );
    // 3 days left
    expect(formatPhotoDaysLeft(expiresAt, new Date("2026-11-21T10:00:00.000Z"), uploadedAt)).toBe(
      "3d left",
    );
    // <= 24 hours left
    expect(formatPhotoDaysLeft(expiresAt, new Date("2026-11-23T12:00:00.000Z"), uploadedAt)).toBe(
      "1d left",
    );
    // Past expiresAt
    expect(formatPhotoDaysLeft(expiresAt, new Date("2026-11-24T09:00:01.000Z"), uploadedAt)).toBe(
      "Expired",
    );
  });

  it("writes uploaded photo data to disk and immediately filters out expired photos on read queries", async () => {
    const now = new Date("2026-11-17T10:00:00.000Z");

    const activePhoto = await uploadServicePhoto({
      title: "Voices of Grace",
      fileName: "DSC_9001_Voices.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      tags: ["Sanctuary Choir", "Front Row"],
      status: "PUBLISHED",
      uploadedAt: now,
      fileContentBase64: Buffer.from("fake-jpeg-binary-active").toString("base64"),
    });

    const expiredUploadTime = new Date(now.getTime() - SEVEN_DAYS_MS - 60_000);
    const expiredPhoto = await uploadServicePhoto({
      title: "Old Sunday Moment",
      fileName: "DSC_8001_Old.jpg",
      albumKey: "thanksgiving",
      albumTitle: "Previous Sunday Service",
      serviceDate: "2026-11-03",
      photographer: "Media Team",
      tags: ["Congregation"],
      status: "PUBLISHED",
      uploadedAt: expiredUploadTime,
      fileContentBase64: Buffer.from("fake-jpeg-binary-expired").toString("base64"),
    });

    // Both files exist on disk right after upload before purge runs
    expect(fs.existsSync(getPhotoStorageFilePath(activePhoto.storageKey))).toBe(true);
    expect(fs.existsSync(getPhotoStorageFilePath(expiredPhoto.storageKey))).toBe(true);

    // Query filtering immediately hides expiredPhoto even before purgeExpiredPhotos runs
    const visiblePhotos = await listActivePhotos({ now });
    const visibleIds = visiblePhotos.map((p) => p.id);
    expect(visibleIds).toContain(activePhoto.id);
    expect(visibleIds).not.toContain(expiredPhoto.id);

    // Direct lookup by ID returns null when expired
    const fetchedExpired = await getPhotoById(expiredPhoto.id, now);
    expect(fetchedExpired).toBeNull();

    const fetchedActive = await getPhotoById(activePhoto.id, now);
    expect(fetchedActive).not.toBeNull();
    expect(fetchedActive?.title).toBe("Voices of Grace");
  });

  it("permanently deletes expired photo records AND physical storage files during purgeExpiredPhotos", async () => {
    const now = new Date("2026-11-17T10:00:00.000Z");

    const keepPhoto = await uploadServicePhoto({
      title: "Keep Me Active",
      fileName: "DSC_Keep.jpg",
      albumKey: "today",
      albumTitle: "Sunday 17 Nov",
      serviceDate: "2026-11-17",
      status: "PUBLISHED",
      uploadedAt: now,
      fileContentBase64: Buffer.from("keep-photo-bytes-12345").toString("base64"),
    });

    const purgePhoto = await uploadServicePhoto({
      title: "Purge Me Expired",
      fileName: "DSC_Purge.jpg",
      albumKey: "choir",
      albumTitle: "Choir Concert",
      serviceDate: "2026-11-09",
      status: "PUBLISHED",
      uploadedAt: new Date(now.getTime() - SEVEN_DAYS_MS - 5_000),
      fileContentBase64: Buffer.from("purge-photo-bytes-67890").toString("base64"),
    });

    const keepPath = getPhotoStorageFilePath(keepPhoto.storageKey);
    const purgePath = getPhotoStorageFilePath(purgePhoto.storageKey);

    expect(path.basename(keepPath)).toContain("DSC_Keep.jpg");
    expect(fs.existsSync(keepPath)).toBe(true);
    expect(fs.existsSync(purgePath)).toBe(true);

    const purgeResult = await purgeExpiredPhotos(now);
    expect(purgeResult.deletedCount).toBeGreaterThanOrEqual(1);
    expect(purgeResult.deletedKeys).toContain(purgePhoto.storageKey);
    expect(purgeResult.reclaimedBytes).toBeGreaterThan(0);

    // Physical file for expired photo MUST be gone from disk
    expect(fs.existsSync(purgePath)).toBe(false);
    // Physical file for active photo MUST still exist on disk
    expect(fs.existsSync(keepPath)).toBe(true);
  });

  it("supports moderation workflow (PENDING -> PUBLISHED / REJECTED) and hides non-published photos from member gallery", async () => {
    const now = new Date("2026-11-17T10:00:00.000Z");

    const pendingPhoto = await uploadServicePhoto({
      title: "Youth Ablaze Trio",
      fileName: "DSC_4914_YouthAblaze_Trio.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      status: "PENDING",
      needsConsentCheck: true,
      uploadedAt: now,
    });

    // Not visible in member gallery while PENDING
    const beforeApprove = await listActivePhotos({ now });
    expect(beforeApprove.some((p) => p.id === pendingPhoto.id)).toBe(false);

    // Visible in admin moderation list
    const adminOverview = await listAdminPhotos({ now });
    expect(adminOverview.photos.some((p) => p.id === pendingPhoto.id)).toBe(true);

    // Approve & publish
    const approved = await moderateServicePhoto({
      photoId: pendingPhoto.id,
      action: "PUBLISH",
    });
    expect(approved.status).toBe("PUBLISHED");

    const afterApprove = await listActivePhotos({ now });
    expect(afterApprove.some((p) => p.id === pendingPhoto.id)).toBe(true);
  });

  it("enforces role guards on GraphQL photo queries and mutations", async () => {
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

    const gallery = await resolvers.Query.servicePhotos({}, {}, memberCtx);
    expect(gallery.length).toBeGreaterThan(0);

    await expect(resolvers.Query.adminPhotoHub({}, {}, memberCtx)).rejects.toThrow(
      /Forbidden|insufficient/i,
    );

    await expect(resolvers.Mutation.purgeExpiredPhotos({}, {}, memberCtx)).rejects.toThrow(
      /Forbidden|insufficient/i,
    );

    const hub = await resolvers.Query.adminPhotoHub({}, {}, adminCtx);
    expect(hub.totalCount).toBeGreaterThan(0);

    const purge = await resolvers.Mutation.purgeExpiredPhotos({}, {}, adminCtx);
    expect(typeof purge.deletedCount).toBe("number");
  });
});
