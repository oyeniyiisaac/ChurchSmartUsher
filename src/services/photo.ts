import fs from "node:fs";
import path from "node:path";
import { Photo, type PhotoStatus } from "../db/models";
import { connectToDatabase } from "../db/mongoose";

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

function createInitialPhotos(baseNow: Date = new Date()): ServicePhotoRecord[] {
  const d7 = computePhotoExpiryDate(baseNow);
  const d3Upload = new Date(baseNow.getTime() - 4 * 24 * 60 * 60 * 1000);
  const d3 = computePhotoExpiryDate(d3Upload);
  const d1Upload = new Date(baseNow.getTime() - 6 * 24 * 60 * 60 * 1000);
  const d1 = computePhotoExpiryDate(d1Upload);

  const seedItems: Array<Omit<ServicePhotoRecord, "daysLeftLabel" | "daysLeftCount">> = [
    {
      id: "photo-1",
      title: "Voices of Grace",
      fileName: "DSC_4901_Choir_Praise.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCFIkmYeJ_X_xQqkSkBDwNiTxkFYs_HOuKPhRUnEBPUbKrD-RIgyWOHifF4jcs5f4Afn6woYtA1GqcU_XmWm3Mls5v65FM3-JGM6hZAFhkEQKnj_rxZNLPVb6GsMMOZ-kS_J2AdMrabdyVtOfBwSv0ocJA1EwoT9k0tHNGEI7HxYzFScW8YBilPNozDA_bGwK1Eh4iz9si2bpXOFmuXmdhbqRBOZz4Gl_wZQvl4pMY",
      storageKey: "seed-DSC_4901_Choir_Praise.jpg",
      fileSizeLabel: "3.4 MB",
      fileSizeBytes: 3_400_000,
      tags: ["Sanctuary Choir", "Front Row"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: baseNow.toISOString(),
      expiresAt: d7.toISOString(),
    },
    {
      id: "photo-2",
      title: "The Sermon",
      fileName: "DSC_4905_Pastoral_Blessing.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAFyztO9XKS5jYCAbc2Ezm9gq7Q1kcuwcCfw_jK9fWRdNQRv6x3nf1hCKXWr9rXghgRVIjiKUusnQI-rnbrao_Y497WMxB3avprG9Ol4L0Tqq4HwUqRhfaUyKApO9sBqcdnP-It1bu9SDkaVLexnEx4NfMlPcKQNl71tXxSbCb-LreLdNHykpM1klGQ4ew9635Me6jKbmpAojmCAutYm3wcDMSwI_PzBMjFSl5oExU",
      storageKey: "seed-DSC_4905_Pastoral_Blessing.jpg",
      fileSizeLabel: "4.1 MB",
      fileSizeBytes: 4_100_000,
      tags: ["Pastoral", "Altar"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: new Date(baseNow.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      expiresAt: d7.toISOString(),
    },
    {
      id: "photo-3",
      title: "Entrance Welcome",
      fileName: "DSC_4925_Protocol_Entrance.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAA6CUTDOr5X3n8F-e_F0cJqew5VEqyyHMya9TKnQAwMuZn_zVtcV0Hj9ihs_Envm2w-YsoOUdHIFBcz7ck_7Z1ht6f9MNVCGZ1Q42Q_qkpBy_dFhMkWUrYq6SujUlI-hKfjQ_hyxBWdaDGH7l9zDyTs4FSpx8e9DWh5nECIme7RpRwCWccXbQtTd9C3tEnysQb9m-haPbjx5cdCzAQx6KFG7CVZT2P38ck21-RdPg",
      storageKey: "seed-DSC_4925_Protocol_Entrance.jpg",
      fileSizeLabel: "3.1 MB",
      fileSizeBytes: 3_100_000,
      tags: ["Protocol & Ushers", "Door A"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: baseNow.toISOString(),
      expiresAt: d7.toISOString(),
    },
    {
      id: "photo-4",
      title: "Deep Worship",
      fileName: "DSC_4908_Auditorium_Prayer.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTvZCsHu5n9CXCQxokFEPH-kFxZuKSWA4NxVqqcZMbRowbmI9al38EslWFycK7B3Cvsx4PCD5z8IDMkNT5yOKi4WHHvCEK3nwc3REO7WUvz-Ox1_-rgHGYH8lgF0BXkB9-oTU4pipwQCCU3YwaKg1Ba3mcLg0dejrQXoCagAzF-LNz3PfWEpE7wU7zd73qP_HdIgjyyjC7LaNULEo8EooPIzwuTq6-DfgIAwipcmA",
      storageKey: "seed-DSC_4908_Auditorium_Prayer.jpg",
      fileSizeLabel: "5.2 MB",
      fileSizeBytes: 5_200_000,
      tags: ["Congregation", "Wide Angle"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: new Date(baseNow.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      expiresAt: d7.toISOString(),
    },
    {
      id: "photo-5",
      title: "Thanksgiving Joy",
      fileName: "DSC_4928_HighPraise_Aisle.jpg",
      albumKey: "thanksgiving",
      albumTitle: "Thanksgiving Service",
      serviceDate: "2026-11-13",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLk47Ls8c2ZlQtKkbITssCUhsCxc-KIurouC6QMfAvdV7yAYmO6F5vxBcFglGLsYKzXFepeMNOIdpBYGf1Pl53gME7frEKUo1j6I19pnSVw99H3moEPGZXYAYkGKlSYiyuh_0yjMQCdxEtO2jcJwYYAsblIccyxAZ7mzN1MvCfyEJyrxRCrHDFClmSiQwS2B_XpYr76_kvyIjqjhZoLKdv9SfXawKIiFW7DOVz4",
      storageKey: "seed-DSC_4928_HighPraise_Aisle.jpg",
      fileSizeLabel: "4.4 MB",
      fileSizeBytes: 4_400_000,
      tags: ["Praise & Worship", "Auditorium West"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: d3Upload.toISOString(),
      expiresAt: d3.toISOString(),
    },
    {
      id: "photo-6",
      title: "Children Recital",
      fileName: "DSC_4922_Sanctuary_Table.jpg",
      albumKey: "thanksgiving",
      albumTitle: "Thanksgiving Service",
      serviceDate: "2026-11-13",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC2Yl3JEL8DGB1w21i8HGe2lLYjrxmqoVLU-pFDKnhIyozPa0dW6hXxnUruuuCxq00zeHPicL5g6BwnMzYvTxEK7pRULL1J6vI6RzJRiAxSytlTPgYvNoSQO60H7vNNOcm_9na1ewESECTELDFPrOqa7KgVlAq0yTweUflNqPWyUypijR5QWnKJXx6-hGsZ8-OP-9YbDQrLInCsyR9ZzWDAF89GMqVeIQyNqYCU0IE",
      storageKey: "seed-DSC_4922_Sanctuary_Table.jpg",
      fileSizeLabel: "2.7 MB",
      fileSizeBytes: 2_700_000,
      tags: ["Sanctuary Details", "Communion"],
      status: "APPROVED",
      needsConsentCheck: false,
      uploadedAt: d3Upload.toISOString(),
      expiresAt: d3.toISOString(),
    },
    {
      id: "photo-7",
      title: "Courtyard Smiles",
      fileName: "DSC_4930_Courtyard_Smiles.jpg",
      albumKey: "thanksgiving",
      albumTitle: "Thanksgiving Service",
      serviceDate: "2026-11-13",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDf-G25FPUvsUi3JrwgzSpbZt_14G7b8x3AFN6bA8I8FLDnRDBxUUXplY1IW8rog0NSTpNX1BG78ttp8aZJTW5r155mOiA9CwIV297FS97NA00VJInGk6MfLqAECluLTyuBqI_2weNvWwYecOa8ZqylLJz8lQxTh9A_tKpZPqvXlKHKCw1SjrxPok_sCJcDjPxL97Zl0iPaf6GQ0JFsaYhw8mZMV7PlI4E5lELj8Zo",
      storageKey: "seed-DSC_4930_Courtyard_Smiles.jpg",
      fileSizeLabel: "3.1 MB",
      fileSizeBytes: 3_100_000,
      tags: ["Youth Fellowship"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: d3Upload.toISOString(),
      expiresAt: d3.toISOString(),
    },
    {
      id: "photo-8",
      title: "Solo Minister",
      fileName: "DSC_4810_Solo_Minister.jpg",
      albumKey: "choir",
      albumTitle: "Choir Concert",
      serviceDate: "2026-11-11",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBsdo8jVOaxFelJzxnfdC122VNSbFdbqErcIERjiA4-2t0okYmg34LNmVYCAxIUJffhwPpEUCET7nK3IaRzOHH4CcXisObdTphT9Qut3CDkkGQgJCCRcv7GBte7P79J9jxFkLxoIdlTE_Oo5B5xh7W88eusSS1zpUgn_ZeBsWBziBqAuXEF0qiy_i4g3oc3SwaDC4MT7JUHcxfIcZnQ_o7GWv4BF6rwa-bfzFEV38U",
      storageKey: "seed-DSC_4810_Solo_Minister.jpg",
      fileSizeLabel: "3.6 MB",
      fileSizeBytes: 3_600_000,
      tags: ["Sanctuary Choir"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: d1Upload.toISOString(),
      expiresAt: d1.toISOString(),
    },
    {
      id: "photo-9",
      title: "Sanctuary Brass",
      fileName: "DSC_4812_Sanctuary_Brass.jpg",
      albumKey: "choir",
      albumTitle: "Choir Concert",
      serviceDate: "2026-11-11",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC1w1_MQ5ywvI-dkTiOw4fdmfoN-MXxUBulNnr5nV0RuFM7qGYW4udAJv1Xvgvt4ErhrJQ5C4M_8Tdoanc2Qet5pEL7OoZv8z9f4Lu915rPHuM2hVRYlVTcyQrq3ndrLuSXFjBM3rgvaOvk6ZRTT5w24TI6gcnIX4p1hZz2DaHWh-6veyoWvX31l-TWASCttcWiUpBslatAkoSWkFF9PM1ZstsXI3HHnJHojQ9jDDM",
      storageKey: "seed-DSC_4812_Sanctuary_Brass.jpg",
      fileSizeLabel: "4.4 MB",
      fileSizeBytes: 4_400_000,
      tags: ["Sanctuary Choir", "Orchestra"],
      status: "PUBLISHED",
      needsConsentCheck: false,
      uploadedAt: d1Upload.toISOString(),
      expiresAt: d1.toISOString(),
    },
    {
      id: "photo-pending-1",
      title: "Youth Ablaze Trio",
      fileName: "DSC_4914_YouthAblaze_Trio.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCsd48IQMbgoVlG75AgWKEdMq9UoE8SHqtl5t5GJEogJLVFmKv-K6A_o1hyzsDMvTsNVZ8imgM6Hmda_aVhFwLtyHWfOIEEnMooAl_U_z9IwCpuAbUGuXX6CQoCXxKSG7t4pabczsZfr4d6Y008txm7gcDEbvKB-keTQkey5prHuNfkGNVrxc8W6u06StpBQR3I8kjoB-kO1H1S3yok3mmAGNnX-BU_ieu4W-qsxcM",
      storageKey: "seed-DSC_4914_YouthAblaze_Trio.jpg",
      fileSizeLabel: "3.9 MB",
      fileSizeBytes: 3_900_000,
      tags: ["Youth Fellowship", "Parent Consent Pending"],
      status: "PENDING",
      needsConsentCheck: true,
      uploadedAt: baseNow.toISOString(),
      expiresAt: d7.toISOString(),
    },
    {
      id: "photo-pending-2",
      title: "Dedication Adeleke",
      fileName: "DSC_4919_Dedication_Adeleke.jpg",
      albumKey: "today",
      albumTitle: "Sunday Thanksgiving Service - 17 Nov 2024",
      serviceDate: "2026-11-17",
      photographer: "Emmanuel & Grace",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC4VY7yDyKFy9_SDTrJbnEaLdcsoB4CGlnLOx28yNsVuDLW3S9xrKnveO_6SOsvsJw3TzWyIYY8NEwrBxPJVWv6jktNdBK_LgrXZqG6Nzcvi9lbefJADKqFl_MtAXg-DJKjfF8zW5C5r8szfGejarvisW0W7ljpnrO91XbzRXKjIwPZAhlxqG_w7OWE8E2k4ZMjIyQnwYgKbUa32pPHQ0LDtQb0jk_yjDSqB78XSJA",
      storageKey: "seed-DSC_4919_Dedication_Adeleke.jpg",
      fileSizeLabel: "4.8 MB",
      fileSizeBytes: 4_800_000,
      tags: ["Family & Dedication", "Foyer Portrait"],
      status: "PENDING",
      needsConsentCheck: false,
      uploadedAt: baseNow.toISOString(),
      expiresAt: d7.toISOString(),
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

let inMemoryPhotoStore: ServicePhotoRecord[] = createInitialPhotos();
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
  inMemoryPhotoStore = createInitialPhotos(new Date("2026-11-17T10:00:00.000Z"));
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
  const uploadedAt = input.uploadedAt ?? new Date();
  const expiresAt = computePhotoExpiryDate(uploadedAt);
  nextPhotoSeq += 1;

  const storageKey = `${uploadedAt.getTime()}-${nextPhotoSeq}-${path.basename(input.fileName)}`;
  const filePath = getPhotoStorageFilePath(storageKey);

  const fileBuffer = input.fileContentBase64
    ? Buffer.from(input.fileContentBase64, "base64")
    : Buffer.from(`churchconnect-photo-${storageKey}`);

  await fs.promises.writeFile(filePath, fileBuffer);

  const fileSizeBytes = input.fileSizeBytes ?? Math.max(fileBuffer.byteLength, 3_200_000);
  const fileSizeLabel = input.fileSizeLabel ?? `${(fileSizeBytes / 1_000_000).toFixed(1)} MB`;

  const record: ServicePhotoRecord = {
    id: `photo-${nextPhotoSeq}`,
    title: input.title.trim(),
    fileName: input.fileName.trim(),
    albumKey: input.albumKey ?? "today",
    albumTitle: input.albumTitle ?? "Sunday Thanksgiving Service - 17 Nov 2024",
    serviceDate: input.serviceDate ?? uploadedAt.toISOString().slice(0, 10),
    photographer: input.photographer ?? "Emmanuel & Grace",
    imageUrl:
      input.imageUrl ??
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFIkmYeJ_X_xQqkSkBDwNiTxkFYs_HOuKPhRUnEBPUbKrD-RIgyWOHifF4jcs5f4Afn6woYtA1GqcU_XmWm3Mls5v65FM3-JGM6hZAFhkEQKnj_rxZNLPVb6GsMMOZ-kS_J2AdMrabdyVtOfBwSv0ocJA1EwoT9k0tHNGEI7HxYzFScW8YBilPNozDA_bGwK1Eh4iz9si2bpXOFmuXmdhbqRBOZz4Gl_wZQvl4pMY",
    storageKey,
    fileSizeLabel,
    fileSizeBytes,
    tags: input.tags ?? ["Sanctuary Choir"],
    status: input.status ?? "PUBLISHED",
    needsConsentCheck: input.needsConsentCheck ?? false,
    uploadedAt: uploadedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    daysLeftLabel: formatPhotoDaysLeft(expiresAt, uploadedAt, uploadedAt),
    daysLeftCount: computeDaysLeftCount(expiresAt, uploadedAt),
  };

  inMemoryPhotoStore.unshift(record);

  try {
    await connectToDatabase();
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
  } catch {
    // Fallback to in-memory store when MongoDB is offline
  }

  return record;
}

export async function listActivePhotos(options?: {
  albumKey?: string;
  now?: Date;
}): Promise<ServicePhotoRecord[]> {
  const now = options?.now ?? new Date();
  const albumKey = options?.albumKey;

  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = {
      expiresAt: { $gt: now },
      status: { $in: ["PUBLISHED", "APPROVED"] },
    };
    if (albumKey && albumKey !== "all") {
      filter.albumKey = albumKey;
    }
    const docs = await Photo.find(filter).sort({ uploadedAt: -1 }).lean();
    if (docs.length > 0) {
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
    // Fallback to in-memory store
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
  try {
    await connectToDatabase();
    const doc = await Photo.findOne({
      _id: photoId,
      expiresAt: { $gt: now },
    }).lean();
    if (doc) {
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
    // Fallback to in-memory store
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
  const activeRecords = inMemoryPhotoStore
    .filter(
      (item) => new Date(item.expiresAt).getTime() > now.getTime() && item.status !== "REJECTED",
    )
    .map((item) => refreshPhotoComputedFields(item, now));

  const publishedCount = activeRecords.filter(
    (p) => p.status === "PUBLISHED" || p.status === "APPROVED",
  ).length;
  const pendingCount = activeRecords.filter((p) => p.status === "PENDING").length;

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
    flaggedCount: 0,
    storageUsedLabel: "142 MB",
    storageLimitLabel: "2.0 GB Limit",
    policyPurgeCountdown: "6d 14h left",
    photos: filtered,
  };
}

export async function moderateServicePhoto(input: {
  photoId: string;
  action: "PUBLISH" | "APPROVE" | "BLUR_MINORS" | "REJECT" | "DELETE";
}): Promise<ServicePhotoRecord> {
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

  try {
    await connectToDatabase();
    if (input.action === "DELETE" || input.action === "REJECT") {
      await Photo.deleteOne({ _id: input.photoId });
    } else {
      await Photo.updateOne(
        { _id: input.photoId },
        {
          $set: {
            status: target.status,
            needsConsentCheck: target.needsConsentCheck,
            tags: target.tags,
          },
        },
      );
    }
  } catch {
    // Fallback to in-memory store
  }

  return refreshPhotoComputedFields(target, new Date());
}

/**
 * Permanently deletes all photos whose `expiresAt <= now` from both
 * physical storage on disk (`.data/photos/<storageKey>`) and the database.
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
    const expiredDocs = await Photo.find({
      expiresAt: { $lte: now },
    }).lean();
    for (const doc of expiredDocs) {
      if (!expiredKeys.has(doc.storageKey)) {
        expiredKeys.add(doc.storageKey);
        reclaimedBytes += doc.fileSizeBytes ?? 0;
      }
    }
    if (expiredDocs.length > 0) {
      await Photo.deleteMany({ expiresAt: { $lte: now } });
    }
  } catch {
    // Fallback to in-memory store
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
      // Ignore ENOENT if already removed
    }
  }

  return {
    deletedCount: expiredKeys.size,
    deletedKeys: Array.from(expiredKeys),
    reclaimedBytes,
  };
}
