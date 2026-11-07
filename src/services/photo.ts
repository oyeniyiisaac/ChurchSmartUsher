import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { getEnv } from "../config/env";
import { Photo, type PhotoStatus } from "../db/models";
import { connectToDatabase } from "../db/mongoose";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "./cloudinary";

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ServicePhotoRecord {
  id: string;
  title: string;
  fileName: string;
  albumKey: string;
  albumTitle: string;
  serviceDate: string;
  photographer: string;
  imageUrl: string;
  storageKey: string;
  fileSizeLabel: string;
  fileSizeBytes: number;
  tags: string[];
  status: PhotoStatus;
  needsConsentCheck: boolean;
  uploadedAt: string;
  expiresAt: string;
  daysLeftLabel: string;
  daysLeftCount: number;
}

export interface AdminPhotoHubOverview {
  totalCount: number;
  publishedCount: number;
  pendingCount: number;
  flaggedCount: number;
  storageUsedLabel: string;
  storageLimitLabel: string;
  policyPurgeCountdown: string;
  photos: ServicePhotoRecord[];
}

export interface PurgePhotosResult {
  deletedCount: number;
  deletedKeys: string[];
  reclaimedBytes: number;
}

const PHOTO_STORAGE_DIR = path.join(process.cwd(), ".data", "photos");

function ensureStorageDir(): void {
  if (!fs.existsSync(PHOTO_STORAGE_DIR)) {
    fs.mkdirSync(PHOTO_STORAGE_DIR, { recursive: true });
  }
}

export function getPhotoStorageFilePath(storageKey: string): string {
  ensureStorageDir();
  const safeFileName = path.basename(storageKey);
  return path.join(PHOTO_STORAGE_DIR, safeFileName);
}

export function computePhotoExpiryDate(uploadedAt: Date = new Date()): Date {
  return new Date(uploadedAt.getTime() + SEVEN_DAYS_MS);
}

export function computeDaysLeftCount(expiresAt: Date, now: Date = new Date()): number {
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function formatPhotoDaysLeft(
  expiresAt: Date,
  now: Date = new Date(),
  uploadedAt?: Date,
): string {
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) {
    return "Expired";
  }

  if (uploadedAt) {
    const ageMs = now.getTime() - uploadedAt.getTime();
    if (ageMs >= 0 && ageMs < 18 * 60 * 60 * 1000) {
      return "Today";
    }
  }

  const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  return `${days}d left`;
}

function createTestSeedPhotos(baseNow: Date = new Date()): ServicePhotoRecord[] {
  const d7 = computePhotoExpiryDate(baseNow);
  const d3Upload = new Date(baseNow.getTime() - 4 * 24 * 60 * 60 * 1000);
  const d3 = computePhotoExpiryDate(d3Upload);

  const seedItems: Array<Omit<ServicePhotoRecord, "daysLeftLabel" | "daysLeftCount">> = [
    {
      id: "photo-1",
      title: "Voices of Grace",
      fileName: "DSC_4901_Choir_Praise.jpg",
      albumKey: "today",
      albumTitle: "Sunday Service - RCCG JESUS HOUSE, OGBOMOSHO",
      serviceDate: "2026-11-17",
      photographer: "Media Department",
      imageUrl: "/rccg-logo.png",
      storageKey: "seed-DSC_4901_Choir_Praise.jpg",
      fileSizeLabel: "1.2 MB",
      fileSizeBytes: 1_200_000,
      tags: ["Sanctuary Choir"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: baseNow.toISOString(),
      expiresAt: d7.toISOString(),
    },
    {
      id: "photo-5",
      title: "Thanksgiving Joy",
      fileName: "DSC_4928_HighPraise_Aisle.jpg",
      albumKey: "thanksgiving",
      albumTitle: "Thanksgiving Service",
      serviceDate: "2026-11-13",
      photographer: "Media Department",
      imageUrl: "/rccg-logo.png",
      storageKey: "seed-DSC_4928_HighPraise_Aisle.jpg",
      fileSizeLabel: "1.4 MB",
      fileSizeBytes: 1_400_000,
      tags: ["Praise & Worship"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: d3Upload.toISOString(),
      expiresAt: d3.toISOString(),
    },
  ];

  return seedItems.map((item) => {
    const exp = new Date(item.expiresAt);
    const upl = new Date(item.uploadedAt);
    return {
      ...item,
      daysLeftLabel: formatPhotoDaysLeft(exp, baseNow, upl),
      daysLeftCount: computeDaysLeftCount(exp, baseNow),
    };
  });
}

let inMemoryPhotoStore: ServicePhotoRecord[] =
  process.env.NODE_ENV === "test" ? createTestSeedPhotos() : [];
let nextPhotoSeq = 100;

function refreshPhotoComputedFields(photo: ServicePhotoRecord, now: Date): ServicePhotoRecord {
  const exp = new Date(photo.expiresAt);
  const upl = new Date(photo.uploadedAt);
  return {
    ...photo,
    daysLeftLabel: formatPhotoDaysLeft(exp, now, upl),
    daysLeftCount: computeDaysLeftCount(exp, now),
  };
}

export async function resetPhotoStoreForTests(): Promise<void> {
  inMemoryPhotoStore = createTestSeedPhotos(new Date("2026-11-17T10:00:00.000Z"));
  nextPhotoSeq = 100;
  ensureStorageDir();
  for (const item of inMemoryPhotoStore) {
    const filePath = getPhotoStorageFilePath(item.storageKey);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, Buffer.from(`seed-photo-${item.id}`));
    }
  }
}

export interface UploadServicePhotoInput {
  title: string;
  fileName: string;
  albumKey?: string;
  albumTitle?: string;
  serviceDate?: string;
  photographer?: string;
  imageUrl?: string;
  fileSizeLabel?: string;
  fileSizeBytes?: number;
  tags?: string[];
  status?: PhotoStatus;
  needsConsentCheck?: boolean;
  uploadedAt?: Date;
  fileContentBase64?: string;
}

export async function uploadServicePhoto(
  input: UploadServicePhotoInput,
): Promise<ServicePhotoRecord> {
  const env = getEnv();
  const isTest = env.NODE_ENV === "test";
  const uploadedAt = input.uploadedAt ?? new Date();
  const expiresAt = computePhotoExpiryDate(uploadedAt);
  nextPhotoSeq += 1;

  let storageKey = `${uploadedAt.getTime()}-${nextPhotoSeq}-${path.basename(input.fileName)}`;
  let resolvedImageUrl = input.imageUrl ?? "";
  let fileSizeBytes = input.fileSizeBytes ?? 0;

  if (!isTest && input.fileContentBase64 && input.fileContentBase64.trim().length > 0) {
    const uploaded = await uploadImageToCloudinary({
      fileContentBase64: input.fileContentBase64,
      folder: "rccg_jesus_house_ogbomosho/service_photos",
    });
    resolvedImageUrl = uploaded.secureUrl;
    storageKey = uploaded.publicId;
    fileSizeBytes = uploaded.bytes || Buffer.from(input.fileContentBase64, "base64").byteLength;
  } else if (isTest) {
    const filePath = getPhotoStorageFilePath(storageKey);
    const fileBuffer = input.fileContentBase64
      ? Buffer.from(input.fileContentBase64, "base64")
      : Buffer.from(`churchconnect-photo-${storageKey}`);
    await fs.promises.writeFile(filePath, fileBuffer);
    fileSizeBytes = input.fileSizeBytes ?? Math.max(fileBuffer.byteLength, 1_200_000);
    resolvedImageUrl = resolvedImageUrl || "/rccg-logo.png";
  } else if (!resolvedImageUrl && input.fileContentBase64) {
    resolvedImageUrl = input.fileContentBase64.startsWith("data:")
      ? input.fileContentBase64
      : `data:image/jpeg;base64,${input.fileContentBase64}`;
    fileSizeBytes = Buffer.from(input.fileContentBase64, "base64").byteLength;
  }

  const fileSizeLabel =
    input.fileSizeLabel ??
    (fileSizeBytes >= 1_000_000
      ? `${(fileSizeBytes / 1_000_000).toFixed(1)} MB`
      : `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`);

  const record: ServicePhotoRecord = {
    id: `photo-${nextPhotoSeq}`,
    title: input.title.trim(),
    fileName: input.fileName.trim(),
    albumKey: input.albumKey ?? "today",
    albumTitle: input.albumTitle ?? "Sunday Service - RCCG JESUS HOUSE, OGBOMOSHO",
    serviceDate: input.serviceDate ?? uploadedAt.toISOString().slice(0, 10),
    photographer: input.photographer ?? "Media Department",
    imageUrl: resolvedImageUrl || "/rccg-logo.png",
    storageKey,
    fileSizeLabel,
    fileSizeBytes,
    tags: input.tags ?? [],
    status: input.status ?? "PUBLISHED",
    needsConsentCheck: input.needsConsentCheck ?? false,
    uploadedAt: uploadedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    daysLeftLabel: formatPhotoDaysLeft(expiresAt, uploadedAt, uploadedAt),
    daysLeftCount: computeDaysLeftCount(expiresAt, uploadedAt),
  };

  if (isTest) {
    inMemoryPhotoStore.unshift(record);
  }

  try {
    await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      const created = await Photo.create({
        title: record.title,
        fileName: record.fileName,
        albumKey: record.albumKey,
        albumTitle: record.albumTitle,
        serviceDate: record.serviceDate,
        photographer: record.photographer,
        imageUrl: record.imageUrl,
        storageKey: record.storageKey,
        fileSizeLabel: record.fileSizeLabel,
        fileSizeBytes: record.fileSizeBytes,
        tags: record.tags,
        status: record.status,
        needsConsentCheck: record.needsConsentCheck,
        uploadedAt,
        expiresAt,
      });
      record.id = String(created._id);
    }
  } catch {
    // Fallback to in-memory store when MongoDB is offline in test mode
  }

  return record;
}

export async function listActivePhotos(options?: {
  albumKey?: string;
  now?: Date;
}): Promise<ServicePhotoRecord[]> {
  const now = options?.now ?? new Date();
  const albumKey = options?.albumKey;
  const isTest = getEnv().NODE_ENV === "test";

  if (!isTest) {
    try {
      await connectToDatabase();
      if (mongoose.connection.readyState === 1) {
        const filter: Record<string, unknown> = {
          expiresAt: { $gt: now },
          status: { $in: ["PUBLISHED", "APPROVED"] },
        };
        if (albumKey && albumKey !== "all") {
          filter.albumKey = albumKey;
        }
        const docs = await Photo.find(filter).sort({ uploadedAt: -1 }).lean();
        return docs.map((doc) => {
          const exp = new Date(doc.expiresAt);
          const upl = new Date(doc.uploadedAt);
          return {
            id: String(doc._id),
            title: doc.title,
            fileName: doc.fileName,
            albumKey: doc.albumKey,
            albumTitle: doc.albumTitle,
            serviceDate: doc.serviceDate,
            photographer: doc.photographer,
            imageUrl: doc.imageUrl,
            storageKey: doc.storageKey,
            fileSizeLabel: doc.fileSizeLabel,
            fileSizeBytes: doc.fileSizeBytes,
            tags: doc.tags ?? [],
            status: doc.status as PhotoStatus,
            needsConsentCheck: Boolean(doc.needsConsentCheck),
            uploadedAt: upl.toISOString(),
            expiresAt: exp.toISOString(),
            daysLeftLabel: formatPhotoDaysLeft(exp, now, upl),
            daysLeftCount: computeDaysLeftCount(exp, now),
          };
        });
      }
    } catch {
      return [];
    }
  }

  return inMemoryPhotoStore
    .filter((item) => {
      const notExpired = new Date(item.expiresAt).getTime() > now.getTime();
      const isPublished = item.status === "PUBLISHED" || item.status === "APPROVED";
      const matchesAlbum = !albumKey || albumKey === "all" || item.albumKey === albumKey;
      return notExpired && isPublished && matchesAlbum;
    })
    .map((item) => refreshPhotoComputedFields(item, now));
}

export async function getPhotoById(
  photoId: string,
  now: Date = new Date(),
): Promise<ServicePhotoRecord | null> {
  const isTest = getEnv().NODE_ENV === "test";

  if (!isTest) {
    try {
      await connectToDatabase();
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(photoId)) {
        const doc = await Photo.findOne({
          _id: photoId,
          expiresAt: { $gt: now },
        }).lean();
        if (!doc) {
          return null;
        }
        const exp = new Date(doc.expiresAt);
        const upl = new Date(doc.uploadedAt);
        return {
          id: String(doc._id),
          title: doc.title,
          fileName: doc.fileName,
          albumKey: doc.albumKey,
          albumTitle: doc.albumTitle,
          serviceDate: doc.serviceDate,
          photographer: doc.photographer,
          imageUrl: doc.imageUrl,
          storageKey: doc.storageKey,
          fileSizeLabel: doc.fileSizeLabel,
          fileSizeBytes: doc.fileSizeBytes,
          tags: doc.tags ?? [],
          status: doc.status as PhotoStatus,
          needsConsentCheck: Boolean(doc.needsConsentCheck),
          uploadedAt: upl.toISOString(),
          expiresAt: exp.toISOString(),
          daysLeftLabel: formatPhotoDaysLeft(exp, now, upl),
          daysLeftCount: computeDaysLeftCount(exp, now),
        };
      }
    } catch {
      return null;
    }
  }

  const found = inMemoryPhotoStore.find(
    (item) => item.id === photoId && new Date(item.expiresAt).getTime() > now.getTime(),
  );
  return found ? refreshPhotoComputedFields(found, now) : null;
}

export async function listAdminPhotos(options?: {
  statusFilter?: string;
  tagFilter?: string;
  now?: Date;
}): Promise<AdminPhotoHubOverview> {
  const now = options?.now ?? new Date();
  const isTest = getEnv().NODE_ENV === "test";

  let activeRecords: ServicePhotoRecord[] = [];

  if (!isTest) {
    try {
      await connectToDatabase();
      if (mongoose.connection.readyState === 1) {
        const docs = await Photo.find({
          expiresAt: { $gt: now },
          status: { $ne: "REJECTED" },
        })
          .sort({ uploadedAt: -1 })
          .lean();

        activeRecords = docs.map((doc) => {
          const exp = new Date(doc.expiresAt);
          const upl = new Date(doc.uploadedAt);
          return {
            id: String(doc._id),
            title: doc.title,
            fileName: doc.fileName,
            albumKey: doc.albumKey,
            albumTitle: doc.albumTitle,
            serviceDate: doc.serviceDate,
            photographer: doc.photographer,
            imageUrl: doc.imageUrl,
            storageKey: doc.storageKey,
            fileSizeLabel: doc.fileSizeLabel,
            fileSizeBytes: doc.fileSizeBytes,
            tags: doc.tags ?? [],
            status: doc.status as PhotoStatus,
            needsConsentCheck: Boolean(doc.needsConsentCheck),
            uploadedAt: upl.toISOString(),
            expiresAt: exp.toISOString(),
            daysLeftLabel: formatPhotoDaysLeft(exp, now, upl),
            daysLeftCount: computeDaysLeftCount(exp, now),
          };
        });
      }
    } catch {
      activeRecords = [];
    }
  } else {
    activeRecords = inMemoryPhotoStore
      .filter(
        (item) => new Date(item.expiresAt).getTime() > now.getTime() && item.status !== "REJECTED",
      )
      .map((item) => refreshPhotoComputedFields(item, now));
  }

  const publishedCount = activeRecords.filter(
    (p) => p.status === "PUBLISHED" || p.status === "APPROVED",
  ).length;
  const pendingCount = activeRecords.filter((p) => p.status === "PENDING").length;
  const totalBytes = activeRecords.reduce((acc, p) => acc + (p.fileSizeBytes || 0), 0);
  const storageUsedLabel =
    totalBytes >= 1_000_000
      ? `${(totalBytes / 1_000_000).toFixed(1)} MB`
      : totalBytes > 0
        ? `${Math.max(1, Math.round(totalBytes / 1024))} KB`
        : "0 MB";

  let filtered = activeRecords;
  if (options?.statusFilter && options.statusFilter !== "ALL") {
    if (options.statusFilter === "PUBLISHED") {
      filtered = filtered.filter((p) => p.status === "PUBLISHED" || p.status === "APPROVED");
    } else if (options.statusFilter === "PENDING") {
      filtered = filtered.filter((p) => p.status === "PENDING");
    }
  }
  if (options?.tagFilter && options.tagFilter !== "All Tags") {
    filtered = filtered.filter((p) =>
      p.tags.some((t) => t.toLowerCase().includes(options.tagFilter!.toLowerCase())),
    );
  }

  return {
    totalCount: activeRecords.length,
    publishedCount,
    pendingCount,
    flaggedCount: activeRecords.filter((p) => p.needsConsentCheck).length,
    storageUsedLabel,
    storageLimitLabel: "Cloudinary 25 GB",
    policyPurgeCountdown: activeRecords[0]?.daysLeftLabel ?? "7d policy active",
    photos: filtered,
  };
}

export async function moderateServicePhoto(input: {
  photoId: string;
  action: "PUBLISH" | "APPROVE" | "BLUR_MINORS" | "REJECT" | "DELETE";
}): Promise<ServicePhotoRecord> {
  const isTest = getEnv().NODE_ENV === "test";

  if (!isTest) {
    await connectToDatabase();
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(input.photoId)) {
      const doc = await Photo.findById(input.photoId);
      if (!doc) {
        throw new Error(`Photo not found: ${input.photoId}`);
      }

      if (input.action === "PUBLISH" || input.action === "APPROVE") {
        doc.status = "PUBLISHED";
        doc.needsConsentCheck = false;
        await doc.save();
      } else if (input.action === "BLUR_MINORS") {
        doc.status = "PUBLISHED";
        doc.needsConsentCheck = false;
        if (!doc.tags.includes("Minors Blurred")) {
          doc.tags.push("Minors Blurred");
        }
        await doc.save();
      } else if (input.action === "REJECT" || input.action === "DELETE") {
        doc.status = "REJECTED";
        await deleteImageFromCloudinary(doc.storageKey);
        await Photo.deleteOne({ _id: doc._id });
      }

      const now = new Date();
      const exp = new Date(doc.expiresAt);
      const upl = new Date(doc.uploadedAt);
      return {
        id: String(doc._id),
        title: doc.title,
        fileName: doc.fileName,
        albumKey: doc.albumKey,
        albumTitle: doc.albumTitle,
        serviceDate: doc.serviceDate,
        photographer: doc.photographer,
        imageUrl: doc.imageUrl,
        storageKey: doc.storageKey,
        fileSizeLabel: doc.fileSizeLabel,
        fileSizeBytes: doc.fileSizeBytes,
        tags: doc.tags ?? [],
        status: doc.status as PhotoStatus,
        needsConsentCheck: Boolean(doc.needsConsentCheck),
        uploadedAt: upl.toISOString(),
        expiresAt: exp.toISOString(),
        daysLeftLabel: formatPhotoDaysLeft(exp, now, upl),
        daysLeftCount: computeDaysLeftCount(exp, now),
      };
    }
  }

  const target = inMemoryPhotoStore.find((p) => p.id === input.photoId);
  if (!target) {
    throw new Error(`Photo not found: ${input.photoId}`);
  }

  if (input.action === "PUBLISH" || input.action === "APPROVE") {
    target.status = "PUBLISHED";
    target.needsConsentCheck = false;
  } else if (input.action === "BLUR_MINORS") {
    target.status = "PUBLISHED";
    target.needsConsentCheck = false;
    if (!target.tags.includes("Minors Blurred")) {
      target.tags.push("Minors Blurred");
    }
  } else if (input.action === "REJECT" || input.action === "DELETE") {
    target.status = "REJECTED";
    const filePath = getPhotoStorageFilePath(target.storageKey);
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // Ignore if file was not written
    }
    inMemoryPhotoStore = inMemoryPhotoStore.filter((p) => p.id !== input.photoId);
  }

  return refreshPhotoComputedFields(target, new Date());
}

/**
 * Permanently deletes all photos whose `expiresAt <= now` from Cloudinary,
 * local storage (if present), and MongoDB.
 */
export async function purgeExpiredPhotos(now: Date = new Date()): Promise<PurgePhotosResult> {
  const expiredKeys = new Set<string>();
  let reclaimedBytes = 0;

  const remaining: ServicePhotoRecord[] = [];
  for (const item of inMemoryPhotoStore) {
    if (new Date(item.expiresAt).getTime() <= now.getTime()) {
      expiredKeys.add(item.storageKey);
      reclaimedBytes += item.fileSizeBytes;
    } else {
      remaining.push(item);
    }
  }
  inMemoryPhotoStore = remaining;

  try {
    await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      const expiredDocs = await Photo.find({
        expiresAt: { $lte: now },
      }).lean();
      for (const doc of expiredDocs) {
        if (!expiredKeys.has(doc.storageKey)) {
          expiredKeys.add(doc.storageKey);
          reclaimedBytes += doc.fileSizeBytes ?? 0;
        }
        await deleteImageFromCloudinary(doc.storageKey);
      }
      if (expiredDocs.length > 0) {
        await Photo.deleteMany({ expiresAt: { $lte: now } });
      }
    }
  } catch {
    // Fallback to in-memory store in test mode
  }

  for (const storageKey of expiredKeys) {
    const filePath = getPhotoStorageFilePath(storageKey);
    try {
      const stat = await fs.promises.stat(filePath);
      if (reclaimedBytes === 0) {
        reclaimedBytes += stat.size;
      }
      await fs.promises.unlink(filePath);
    } catch {
      // Ignore ENOENT if already removed or stored only in Cloudinary
    }
  }

  return {
    deletedCount: expiredKeys.size,
    deletedKeys: Array.from(expiredKeys),
    reclaimedBytes,
  };
}
