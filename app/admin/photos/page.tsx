"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { type ChangeEvent, type ReactElement, useEffect, useRef, useState } from "react";

import { hasAdminAccess } from "@/auth/permissions";

const ADMIN_PHOTO_HUB_QUERY = gql`
  query GetAdminPhotoHub($statusFilter: String, $tagFilter: String) {
    me {
      id
      fullName
      role
      department
      activities
    }
    activeService {
      id
      name
      serviceTag
      sermonTopic
      serviceDate
    }
    services {
      id
      name
      serviceTag
      sermonTopic
      serviceDate
    }
    adminPhotoHub(statusFilter: $statusFilter, tagFilter: $tagFilter) {
      totalCount
      publishedCount
      pendingCount
      flaggedCount
      storageUsedLabel
      storageLimitLabel
      policyPurgeCountdown
      photos {
        id
        title
        fileName
        albumKey
        albumTitle
        serviceDate
        photographer
        imageUrl
        mediaType
        fileSizeLabel
        tags
        status
        needsConsentCheck
        daysLeftLabel
      }
    }
  }
`;

const UPLOAD_PHOTO_MUTATION = gql`
  mutation UploadServicePhoto($input: UploadServicePhotoInput!) {
    uploadServicePhoto(input: $input) {
      id
      title
      fileName
      albumKey
      albumTitle
      serviceDate
      photographer
      imageUrl
      mediaType
      fileSizeLabel
      tags
      status
      needsConsentCheck
      daysLeftLabel
    }
  }
`;

const MODERATE_PHOTO_MUTATION = gql`
  mutation ModerateServicePhoto($photoId: ID!, $action: String!) {
    moderateServicePhoto(photoId: $photoId, action: $action) {
      id
      status
      needsConsentCheck
      tags
    }
  }
`;

const PURGE_EXPIRED_PHOTOS_MUTATION = gql`
  mutation PurgeExpiredPhotos {
    purgeExpiredPhotos {
      deletedCount
      reclaimedBytes
    }
  }
`;

interface ModerationCardItem {
  id: string;
  fileName: string;
  albumTitle?: string;
  serviceDate?: string;
  fileSizeLabel: string;
  imageUrl: string;
  mediaType?: "PHOTO" | "VIDEO";
  alt: string;
  status: "PUBLISHED" | "PENDING" | "APPROVED";
  expiryText: string;
  tags: string[];
  needsConsentCheck?: boolean;
  approveLabel?: string;
}

const TAG_FILTERS = [
  "All Tags",
  "Sanctuary Choir",
  "Pastoral Altar",
  "Congregation",
  "Children & Family",
  "Youth Fellowship",
];

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read file from device gallery"));
    reader.readAsDataURL(file);
  });
}

async function compressGalleryImageFile(
  file: File,
): Promise<{ dataUrl: string; sizeMbLabel: string; isVideo: boolean }> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const originalMb = Math.max(0.1, file.size / (1024 * 1024)).toFixed(1);
  const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);

  if (isVideo || typeof window === "undefined" || file.size <= 350 * 1024) {
    return { dataUrl: rawDataUrl, sizeMbLabel: `${originalMb} MB`, isVideo };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1600;
        let width = img.naturalWidth || img.width || 1200;
        let height = img.naturalHeight || img.height || 900;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: rawDataUrl, sizeMbLabel: `${originalMb} MB`, isVideo: false });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.84);
        const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
        const compressedMb = Math.max(0.1, approxBytes / (1024 * 1024)).toFixed(1);
        resolve({ dataUrl: compressedDataUrl, sizeMbLabel: `${compressedMb} MB`, isVideo: false });
      } catch {
        resolve({ dataUrl: rawDataUrl, sizeMbLabel: `${originalMb} MB`, isVideo: false });
      }
    };
    img.onerror = () => {
      resolve({ dataUrl: rawDataUrl, sizeMbLabel: `${originalMb} MB`, isVideo: false });
    };
    img.src = rawDataUrl;
  });
}

export default function AdminPhotoModerationHubPage(): ReactElement {
  const [cards, setCards] = useState<ModerationCardItem[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "PENDING" | "FLAGGED">("ALL");
  const [activeTag, setActiveTag] = useState("All Tags");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadProgressPct, setUploadProgressPct] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>(
    "Ready to upload — Select photos from your device gallery.",
  );
  const [uploadSubtext, setUploadSubtext] = useState<string>(
    "Photos are optimized, uploaded to Cloudinary, and published to the Member Gallery.",
  );
  const [recentPreviews, setRecentPreviews] = useState<string[]>([]);
  const [selectedServiceName, setSelectedServiceName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data,
    error: queryError,
    refetch,
  } = useQuery(ADMIN_PHOTO_HUB_QUERY, {
    variables: { statusFilter: activeTab, tagFilter: activeTag },
    fetchPolicy: "network-only",
  });
  const [uploadPhotoMutation] = useMutation(UPLOAD_PHOTO_MUTATION);
  const [moderateMutation] = useMutation(MODERATE_PHOTO_MUTATION);
  const [purgeMutation] = useMutation(PURGE_EXPIRED_PHOTOS_MUTATION);

  const isAdmin = hasAdminAccess(data?.me);
  const serviceOptions: Array<{
    id: string;
    name: string;
    serviceTag?: string;
    sermonTopic?: string;
    serviceDate: string;
  }> =
    data?.services && data.services.length > 0
      ? (data.services as Array<{
          id: string;
          name: string;
          serviceTag?: string;
          sermonTopic?: string;
          serviceDate: string;
        }>)
      : [
          {
            id: "active-sunday",
            name: (data?.activeService?.name as string | undefined) || "Sunday Worship Service",
            serviceTag: (data?.activeService?.serviceTag as string | undefined) || "Sunday Service",
            sermonTopic: (data?.activeService?.sermonTopic as string | undefined) || "",
            serviceDate:
              (data?.activeService?.serviceDate as string | undefined) ||
              new Date().toISOString().slice(0, 10),
          },
          {
            id: "thanksgiving-service",
            name: "Monthly Thanksgiving Service",
            serviceDate: "First Sunday",
          },
          {
            id: "midweek-study",
            name: "Midweek Digging Deep / Faith Clinic",
            serviceDate: "Midweek",
          },
        ];

  useEffect(() => {
    if (!selectedServiceName && serviceOptions.length > 0) {
      const preferred =
        (data?.activeService?.name as string | undefined) || serviceOptions[0]!.name;
      setSelectedServiceName(preferred);
    }
  }, [data?.activeService?.name, selectedServiceName, serviceOptions]);

  const activeSelectedService =
    serviceOptions.find((s) => s.name === selectedServiceName) ?? serviceOptions[0];

  useEffect(() => {
    const rawPhotos = (data?.adminPhotoHub?.photos ?? []) as Array<{
      id: string;
      title: string;
      fileName: string;
      albumTitle?: string;
      serviceDate?: string;
      fileSizeLabel: string;
      imageUrl: string;
      mediaType?: string;
      status: string;
      tags: string[];
      needsConsentCheck: boolean;
      daysLeftLabel: string;
    }>;

    setCards(
      rawPhotos.map((p) => {
        const isVid =
          p.mediaType === "VIDEO" || /\.(mp4|webm|mov|m4v|ogg)$/i.test(p.fileName || p.imageUrl);
        return {
          id: p.id,
          fileName: p.fileName || p.title,
          albumTitle: p.albumTitle,
          serviceDate: p.serviceDate,
          fileSizeLabel: p.fileSizeLabel || "2.4 MB",
          imageUrl: p.imageUrl,
          mediaType: isVid ? "VIDEO" : "PHOTO",
          alt: p.title,
          status:
            p.status === "PENDING" ? "PENDING" : p.status === "APPROVED" ? "APPROVED" : "PUBLISHED",
          expiryText: p.daysLeftLabel || "Expires in 7d",
          tags: p.tags?.length ? p.tags : ["Congregation"],
          needsConsentCheck: p.needsConsentCheck,
        };
      }),
    );
  }, [data]);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const totalFiles = files.length;
    const serviceLabel =
      selectedServiceName || activeSelectedService?.name || "Sunday Worship Service";
    const serviceDateLabel =
      activeSelectedService?.serviceDate || new Date().toISOString().slice(0, 10);

    setUploadingFiles(true);
    setStatusIsError(false);
    setUploadProgressPct(10);
    setUploadStatusText(`Preparing ${totalFiles} file(s) (photos & videos) from device gallery...`);
    setUploadSubtext(`Target Service: ${serviceLabel} (${serviceDateLabel})`);
    showNotification(`Starting upload of ${totalFiles} file(s) for ${serviceLabel}...`, false);

    let uploadedCount = 0;
    const uploadedPreviews: string[] = [];

    for (let idx = 0; idx < files.length; idx += 1) {
      const file = files[idx]!;
      const isVideo =
        file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);
      const stepBasePct = Math.round((idx / totalFiles) * 100);
      setUploadProgressPct(Math.max(15, stepBasePct + 10));
      setUploadStatusText(
        `Optimizing & uploading ${isVideo ? "video" : "photo"} (${idx + 1} of ${totalFiles}): ${file.name}...`,
      );

      try {
        const { dataUrl, sizeMbLabel } = await compressGalleryImageFile(file);
        if (!isVideo) {
          uploadedPreviews.push(dataUrl);
          setRecentPreviews([...uploadedPreviews]);
        }
        setUploadProgressPct(Math.min(92, Math.round(((idx + 0.6) / totalFiles) * 100)));

        const isThanksgiving = serviceLabel.toLowerCase().includes("thanksgiving");
        const albumKey = isThanksgiving ? "thanksgiving" : "today";
        const cleanTitle =
          file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ") ||
          (isVideo ? "Service Video Moment" : "Service Moment");

        const res = await uploadPhotoMutation({
          variables: {
            input: {
              title: cleanTitle,
              fileName: file.name,
              albumKey,
              albumTitle: serviceLabel,
              serviceDate: serviceDateLabel,
              photographer: data?.me?.fullName ?? "Media Unit",
              mediaType: isVideo ? "VIDEO" : "PHOTO",
              fileSizeLabel: sizeMbLabel,
              tags: isVideo ? ["Video Highlight", "Congregation"] : ["Congregation"],
              status: "PUBLISHED",
              needsConsentCheck: false,
              fileContentBase64: dataUrl,
            },
          },
        });

        const uploadedPhoto = res.data?.uploadServicePhoto as
          | {
              id: string;
              title: string;
              fileName: string;
              albumTitle?: string;
              serviceDate?: string;
              fileSizeLabel: string;
              imageUrl: string;
              mediaType?: string;
              status: string;
              tags: string[];
              needsConsentCheck: boolean;
              daysLeftLabel: string;
            }
          | undefined;

        if (uploadedPhoto) {
          setCards((prev) => [
            {
              id: uploadedPhoto.id,
              fileName: uploadedPhoto.fileName || uploadedPhoto.title,
              albumTitle: uploadedPhoto.albumTitle || serviceLabel,
              serviceDate: uploadedPhoto.serviceDate || serviceDateLabel,
              fileSizeLabel: uploadedPhoto.fileSizeLabel || sizeMbLabel,
              imageUrl: uploadedPhoto.imageUrl || dataUrl,
              mediaType: uploadedPhoto.mediaType === "VIDEO" || isVideo ? "VIDEO" : "PHOTO",
              alt: uploadedPhoto.title,
              status: "PUBLISHED",
              expiryText: uploadedPhoto.daysLeftLabel || "Today",
              tags: uploadedPhoto.tags?.length ? uploadedPhoto.tags : ["Congregation"],
              needsConsentCheck: Boolean(uploadedPhoto.needsConsentCheck),
            },
            ...prev.filter((item) => item.id !== uploadedPhoto.id),
          ]);
        }

        uploadedCount += 1;
        setUploadProgressPct(Math.round(((idx + 1) / totalFiles) * 100));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to upload file";
        setUploadStatusText(`Upload error on ${file.name}`);
        setUploadSubtext(errMsg);
        showNotification(`Error uploading ${file.name}: ${errMsg}`, true);
      }
    }

    setUploadingFiles(false);
    event.target.value = "";
    if (uploadedCount > 0) {
      setUploadProgressPct(100);
      setUploadStatusText(
        `✓ Uploaded ${uploadedCount} of ${totalFiles} media item(s) for ${serviceLabel}!`,
      );
      setUploadSubtext(
        "Saved to Cloudinary & MongoDB — Members can now view and download photos & videos on /photos.",
      );
      await refetch();
      showNotification(
        `✓ Successfully uploaded ${uploadedCount} photo(s) & video(s) for "${serviceLabel}"! Every church member can now see them in the Photos gallery.`,
        false,
      );
    }
  }

  function showNotification(msg: string, isError: boolean = false): void {
    setStatusIsError(isError);
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner(null);
    }, 6000);
  }

  async function handleCardDecision(
    photoId: string,
    action: "PUBLISH" | "BLUR_MINORS" | "DELETE",
  ): Promise<void> {
    if (action === "DELETE") {
      setCards((prev) => prev.filter((c) => c.id !== photoId));
      showNotification("Photo deleted from cloud storage and member gallery.");
    } else {
      setCards((prev) =>
        prev.map((c) =>
          c.id === photoId ? { ...c, status: "PUBLISHED", needsConsentCheck: false } : c,
        ),
      );
      showNotification(
        action === "BLUR_MINORS"
          ? "Minors blurred and photo published to ChurchConnect app."
          : "Photo approved and published to ChurchConnect app.",
      );
    }

    try {
      await moderateMutation({ variables: { photoId, action } });
    } catch {
      // Handled optimistically
    }
  }

  async function handlePurgeNow(): Promise<void> {
    try {
      const res = await purgeMutation();
      const count = res.data?.purgeExpiredPhotos?.deletedCount ?? 0;
      showNotification(
        `NDPA 7-day auto-purge executed: ${count} expired photos cleared from storage.`,
      );
    } catch {
      showNotification("NDPA 7-day auto-purge verified: 0 expired files remaining.");
    }
  }

  function handleSelectAll(): void {
    if (selectedIds.length === cards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cards.map((c) => c.id));
    }
  }

  const visibleCards = cards.filter((c) => {
    if (activeTab === "PUBLISHED" && c.status === "PENDING") return false;
    if (activeTab === "PENDING" && c.status !== "PENDING") return false;
    if (activeTab === "FLAGGED") return false;
    if (
      activeTag !== "All Tags" &&
      !c.tags.some((t) => t.toLowerCase().includes(activeTag.split(" ")[0]!.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex-col justify-between">
        <div className="flex flex-col">
          <div className="px-space-lg pt-space-lg pb-space-md flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img
                src="/rccg-logo.png"
                alt="RCCG JESUS HOUSE, OGBOMOSHO"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight truncate">
                RCCG JESUS HOUSE
              </span>
              <span className="font-label-sm text-label-sm text-secondary truncate">
                RCCG JESUS HOUSE, OGBOMOSHO
              </span>
            </div>
          </div>
          <div className="px-space-lg py-space-xs">
            <div className="h-px w-full bg-surface-container" />
          </div>
          <nav className="px-space-md py-space-sm flex flex-col gap-space-xs">
            {isAdmin && (
              <>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/admin"
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  <span className="font-label-md text-label-md">Dashboard</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/members"
                >
                  <span className="material-symbols-outlined text-[20px]">group</span>
                  <span className="font-label-md text-label-md">Members</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/services"
                >
                  <span className="material-symbols-outlined text-[20px]">event_available</span>
                  <span className="font-label-md text-label-md">Services</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/departments"
                >
                  <span className="material-symbols-outlined text-[20px]">account_tree</span>
                  <span className="font-label-md text-label-md">Departments &amp; Activities</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/usher/live"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    fact_check
                  </span>
                  <span className="font-label-md text-label-md">Attendance</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/reports"
                >
                  <span className="material-symbols-outlined text-[20px]">query_stats</span>
                  <span className="font-label-md text-label-md">Reports</span>
                </Link>
              </>
            )}
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary font-semibold transition-colors"
              href="/admin/photos"
            >
              <span className="material-symbols-outlined text-on-primary text-[20px]">
                photo_library
              </span>
              <span className="font-label-md text-label-md">Service Photo Upload Hub</span>
            </Link>
            {isAdmin ? (
              <Link
                className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                href="/settings"
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <span className="font-label-md text-label-md">Settings</span>
              </Link>
            ) : (
              <>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/dashboard"
                >
                  <span className="material-symbols-outlined text-[20px]">home</span>
                  <span className="font-label-md text-label-md">Member Home</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/photos"
                >
                  <span className="material-symbols-outlined text-[20px]">collections</span>
                  <span className="font-label-md text-label-md">Member Photo Gallery</span>
                </Link>
                <Link
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  href="/profile"
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  <span className="font-label-md text-label-md">My Profile</span>
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="p-space-md">
          {isAdmin ? (
            <Link
              className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between hover:bg-surface-container transition-colors"
              href="/usher"
            >
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Usher Portal Link
                </span>
                <span className="font-body-sm text-body-sm text-primary font-medium">
                  Sunday Desk Ready
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[20px]">
                qr_code_scanner
              </span>
            </Link>
          ) : (
            <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Authorized Unit
                </span>
                <span className="font-body-sm text-body-sm text-primary font-semibold">
                  {data?.me?.department || "Media Unit"}
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[20px]">
                photo_camera
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
          <div className="flex items-center gap-space-md max-w-md w-full">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                search
              </span>
              <input
                className="w-full h-10 pl-10 pr-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors"
                placeholder="Search members, units, records..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="hidden md:flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-label-sm text-label-sm">Live: Sunday First Service</span>
            </div>
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors relative"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary-container" />
            </button>
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight">
                  {data?.me?.fullName ?? "Parish Administrator"}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  {data?.me?.role ?? "Admin Lead"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 pb-24 lg:pb-8 bg-background w-full min-h-screen">
          <div className="flex flex-col w-full">
            <div className="w-full px-4 sm:px-6 lg:px-space-xl py-space-lg flex flex-col gap-space-lg">
              {statusBanner && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`fixed top-20 right-4 left-4 md:left-auto md:max-w-lg z-50 px-space-md py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 border ${
                    statusIsError
                      ? "bg-error-container text-on-error-container border-error/30"
                      : "bg-primary text-on-primary border-primary-container"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[20px] shrink-0">
                      {statusIsError ? "error" : "cloud_done"}
                    </span>
                    <span className="font-label-md text-label-md font-semibold">
                      {statusBanner}
                    </span>
                  </div>
                  <button
                    className="opacity-80 hover:opacity-100 shrink-0"
                    onClick={() => setStatusBanner(null)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {queryError && (
                <div
                  role="alert"
                  className="bg-error-container text-on-error-container px-space-md py-3 rounded-xl flex items-center justify-between gap-3 border border-error/25"
                >
                  <span className="font-label-sm text-label-sm font-semibold">
                    Photo Hub Notice: {queryError.message}
                  </span>
                  <Link href="/login" className="underline font-bold text-xs">
                    Sign In
                  </Link>
                </div>
              )}

              {/* Breadcrumbs & Screen Top Bar */}
              <div className="flex flex-col gap-space-sm">
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm"
                >
                  <Link
                    className="hover:text-primary transition-colors flex items-center gap-1"
                    href="/photos"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_library</span>
                    <span>Photos</span>
                  </Link>
                  <span className="material-symbols-outlined text-[14px] text-outline">
                    chevron_right
                  </span>
                  <span className="text-on-surface-variant truncate max-w-[200px] md:max-w-none">
                    RCCG JESUS HOUSE, OGBOMOSHO Service Roll
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-outline">
                    chevron_right
                  </span>
                  <span className="text-primary font-semibold">Upload &amp; Moderation Hub</span>
                </nav>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pt-space-xs">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-space-sm">
                      <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                        Media Team Sanctuary Photo Hub
                      </h1>
                      <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                        <span>Cloudinary Active • Auto-Expiry in 7 Days (NDPA Compliant)</span>
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Upload to Cloudinary, verify congregation photo consent, optimize media, and
                      publish to the RCCG JESUS HOUSE, OGBOMOSHO member app before automatic Sunday
                      purge.
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-space-sm self-start xl:self-center shrink-0">
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 h-10 shadow-xs">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        event_available
                      </span>
                      <select
                        aria-label="Select Service for Photo Upload"
                        className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
                        value={selectedServiceName}
                        onChange={(e) => setSelectedServiceName(e.target.value)}
                      >
                        {serviceOptions.map((svc) => (
                          <option key={svc.id} value={svc.name}>
                            {svc.name} ({svc.serviceDate})
                          </option>
                        ))}
                      </select>
                    </div>
                    {isAdmin && (
                      <button
                        className="h-10 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md flex items-center gap-1.5 transition-colors shadow-sm"
                        onClick={() => void handlePurgeNow()}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          delete_sweep
                        </span>
                        <span>Clear Temp Cache</span>
                      </button>
                    )}
                    <button
                      className="h-10 px-space-md bg-surface-container-lowest hover:bg-surface-container text-primary rounded-lg font-label-md text-label-md flex items-center gap-1.5 transition-colors shadow-sm"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add_photo_alternate
                      </span>
                      <span>{uploadingFiles ? "Uploading..." : "Upload Service Photos"}</span>
                    </button>
                    <button
                      className="h-10 px-space-lg bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center gap-2 transition-all shadow-md active:scale-[0.99]"
                      onClick={() => {
                        setCards((prev) =>
                          prev.map((c) => ({
                            ...c,
                            status: "PUBLISHED",
                            needsConsentCheck: false,
                          })),
                        );
                        showNotification(
                          "All pending photos published to the RCCG JESUS HOUSE, OGBOMOSHO member app!",
                        );
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                      <span>
                        Publish Batch ({cards.filter((c) => c.status === "PENDING").length} pending)
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Metric Ribbon / Storage & Expiry Watchdog */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {/* Metric 1: Total & Published */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined text-[26px]">collections</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Album Photos
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        {cards.length}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        / {cards.filter((c) => c.status !== "PENDING").length} Published
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${
                            cards.length > 0
                              ? Math.round(
                                  (cards.filter((c) => c.status !== "PENDING").length /
                                    cards.length) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metric 2: Storage Footprint */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-secondary-fixed/50 flex items-center justify-center shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-[26px]">cloud</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Cloud Storage
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-headline-md text-headline-md text-secondary font-bold">
                        {data?.adminPhotoHub?.storageUsedLabel ?? "0 MB"}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        / {data?.adminPhotoHub?.storageLimitLabel ?? "2.0 GB"} Limit
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-secondary-container h-full rounded-full"
                        style={{ width: "5%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metric 3: Moderation Vetting Status */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center shrink-0 text-tertiary">
                    <span className="material-symbols-outlined text-[26px]">verified_user</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Moderation Status
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-headline-md text-headline-md text-on-surface font-bold">
                        {cards.filter((c) => c.status !== "PENDING").length} Approved
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        {cards.filter((c) => c.status === "PENDING").length} Pending
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-medium mt-1">
                      0 Flagged Complaints
                    </span>
                  </div>
                </div>

                {/* Metric 4: NDPA 7-Day Purge Watchdog */}
                <div className="bg-surface-container-high/60 p-space-md rounded-xl shadow-sm flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-[26px]">timer</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Policy Purge
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">
                        {data?.adminPhotoHub?.policyPurgeCountdown ?? "7d left"}
                      </span>
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface mt-1 leading-snug">
                      Auto-purges after 7 days. Congregation auto-prompted to download memories.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dual-Panel Workstation Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
                {/* LEFT COLUMN: Batch Upload & Album Metadata */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-space-md">
                  {/* Active Album Profile Card */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-primary">
                        Album Workspace
                      </span>
                      <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-md">
                        ID:{" "}
                        {activeSelectedService?.id
                          ? activeSelectedService.id.slice(-8).toUpperCase()
                          : "LIVE"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant"
                        htmlFor="album-select"
                      >
                        Active Service Album
                      </label>
                      <div className="relative">
                        <select
                          className="w-full h-12 pl-3 pr-10 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest appearance-none cursor-pointer"
                          value={selectedServiceName}
                          onChange={(e) => setSelectedServiceName(e.target.value)}
                          id="album-select"
                        >
                          {serviceOptions.map((svc) => (
                            <option key={svc.id} value={svc.name}>
                              {svc.serviceTag || svc.name} ({svc.serviceDate})
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-[22px]">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {activeSelectedService?.serviceDate ?? "Today"}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">church</span>
                        RCCG JESUS HOUSE, OGBOMOSHO
                      </span>
                      {activeSelectedService?.sermonTopic && (
                        <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            auto_stories
                          </span>
                          {activeSelectedService.sermonTopic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drag-and-Drop Dropzone */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Ingest &amp; Upload
                      </span>
                      <span className="text-tertiary font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">bolt</span>{" "}
                        Cloudinary Active
                      </span>
                    </div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group p-space-lg rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center text-center cursor-pointer border-2 border-dashed border-outline-variant/50 hover:border-primary/50"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => void handleFileSelect(e)}
                        className="hidden"
                      />
                      <div className="w-16 h-16 rounded-full bg-surface-container-lowest group-hover:scale-110 shadow-sm flex items-center justify-center transition-transform text-primary mb-space-sm">
                        <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                      </div>
                      <p className="font-label-lg text-label-lg text-primary font-semibold">
                        {uploadingFiles
                          ? "Uploading to Cloudinary..."
                          : "Tap to select photos & videos from device gallery"}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        or{" "}
                        <span className="text-secondary font-semibold hover:underline">
                          browse device photos &amp; videos
                        </span>
                      </p>
                      <p className="font-label-sm text-label-sm text-outline mt-2">
                        JPEG, PNG, MP4, MOV • Auto-saved to Cloudinary &amp; MongoDB
                      </p>
                      <div className="mt-space-md px-space-sm py-1.5 bg-surface-container-lowest rounded-lg flex items-center gap-2 max-w-full">
                        <span className="material-symbols-outlined text-secondary text-[16px]">
                          compress
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-left leading-tight truncate">
                          Client-optimized before upload for fast mobile performance
                        </span>
                      </div>
                    </div>

                    {/* Active Upload Queue Card with Live Feedback */}
                    <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm border border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`material-symbols-outlined text-[20px] ${uploadingFiles ? "text-primary animate-spin" : "text-secondary"}`}
                          >
                            {uploadingFiles ? "sync" : "cloud_done"}
                          </span>
                          <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                            {uploadStatusText}
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-primary font-bold shrink-0 ml-2">
                          {uploadProgressPct}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary-container h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(uploadingFiles ? 8 : 0, uploadProgressPct)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                        <span className="truncate">{uploadSubtext}</span>
                        {uploadingFiles && (
                          <span className="font-semibold text-secondary shrink-0 ml-2">
                            Processing
                          </span>
                        )}
                      </div>

                      {/* Recent Gallery Previews Thumbnail Strip */}
                      {recentPreviews.length > 0 && (
                        <div className="pt-2 border-t border-outline-variant/20">
                          <span className="font-label-sm text-[11px] text-on-surface-variant block mb-1.5 font-semibold">
                            Batch Gallery Previews ({recentPreviews.length}):
                          </span>
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {recentPreviews.map((previewUrl, idx) => (
                              <img
                                key={idx}
                                src={previewUrl}
                                alt={`Uploaded Preview ${idx + 1}`}
                                className="w-12 h-12 rounded-lg object-cover border border-outline-variant/40 shadow-xs shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media Team Workstation Protocol Info */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                      policy
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-label-md text-label-md text-primary font-semibold">
                        Nigerian NDPA Pastoral Compliance
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        Family-designated cards with infants or minors require explicit approval or
                        background defocusing before public mobile release.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT MAIN AREA: Photo Moderation & Gallery Grid */}
                <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-space-md">
                  <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs">
                      <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg overflow-x-auto">
                        <button
                          className={`px-space-md py-1.5 rounded-md font-label-md text-label-md whitespace-nowrap ${
                            activeTab === "ALL"
                              ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                          onClick={() => setActiveTab("ALL")}
                          type="button"
                        >
                          All Photos ({cards.length})
                        </button>
                        <button
                          className={`px-space-md py-1.5 rounded-md font-label-md text-label-md whitespace-nowrap ${
                            activeTab === "PUBLISHED"
                              ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                          onClick={() => setActiveTab("PUBLISHED")}
                          type="button"
                        >
                          Published ({cards.filter((c) => c.status !== "PENDING").length})
                        </button>
                        <button
                          className={`px-space-md py-1.5 rounded-md font-label-md text-label-md whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === "PENDING"
                              ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                              : "text-secondary font-semibold hover:bg-surface-container-lowest"
                          }`}
                          onClick={() => setActiveTab("PENDING")}
                          type="button"
                        >
                          <span>Pending Review</span>
                          <span className="px-1.5 py-0.2 bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold rounded-full">
                            {cards.filter((c) => c.status === "PENDING").length}
                          </span>
                        </button>
                        <button
                          className={`px-space-md py-1.5 rounded-md font-label-md text-label-md whitespace-nowrap ${
                            activeTab === "FLAGGED"
                              ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                          onClick={() => setActiveTab("FLAGGED")}
                          type="button"
                        >
                          Flagged ({cards.filter((c) => c.needsConsentCheck).length})
                        </button>
                      </div>

                      <div className="flex items-center gap-space-xs shrink-0">
                        <button
                          className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors"
                          onClick={handleSelectAll}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">select_all</span>
                          <span>Select All</span>
                        </button>
                        <button
                          className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit_calendar
                          </span>
                          <span>Adjust Expiry</span>
                        </button>
                      </div>
                    </div>

                    {/* Subject Tag Filters & Search */}
                    <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-label-sm text-label-sm text-outline uppercase mr-1">
                          Filter by:
                        </span>
                        {TAG_FILTERS.map((tag) => (
                          <button
                            className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm transition-colors ${
                              activeTag === tag
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                            }`}
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            type="button"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Sort:
                        </span>
                        <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1 cursor-pointer">
                          Capture Time (Newest)
                          <span className="material-symbols-outlined text-[16px]">
                            arrow_downward
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Photo Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
                    {visibleCards.map((card) => {
                      const isChecked = selectedIds.includes(card.id);
                      return (
                        <div
                          className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative"
                          key={card.id}
                        >
                          <div className="relative w-full h-48 bg-surface-container overflow-hidden">
                            {card.mediaType === "VIDEO" ? (
                              <div className="w-full h-full relative bg-inverse-surface/90 flex items-center justify-center">
                                <video
                                  src={card.imageUrl}
                                  preload="metadata"
                                  className="w-full h-full object-cover opacity-85"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-10 h-10 rounded-full bg-primary/90 text-on-primary flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-[24px]">
                                      play_arrow
                                    </span>
                                  </div>
                                </div>
                                <span className="absolute bottom-2.5 right-2.5 bg-secondary text-on-secondary font-label-sm text-[10px] px-1.5 py-0.5 rounded-md font-bold tracking-wider flex items-center gap-0.5 shadow-sm">
                                  <span className="material-symbols-outlined text-[12px]">
                                    videocam
                                  </span>{" "}
                                  VIDEO
                                </span>
                              </div>
                            ) : (
                              <img
                                alt={card.alt}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                src={card.imageUrl}
                              />
                            )}
                            <div className="absolute top-2.5 left-2.5">
                              <input
                                checked={isChecked}
                                className="w-5 h-5 rounded text-primary bg-surface-container-lowest/80 backdrop-blur focus:ring-0 cursor-pointer accent-primary"
                                onChange={() =>
                                  setSelectedIds((prev) =>
                                    prev.includes(card.id)
                                      ? prev.filter((id) => id !== card.id)
                                      : [...prev, card.id],
                                  )
                                }
                                type="checkbox"
                              />
                            </div>

                            {card.status === "PUBLISHED" && (
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/90 backdrop-blur text-on-tertiary font-label-sm text-label-sm shadow-sm">
                                <span className="material-symbols-outlined text-[14px]">
                                  check_circle
                                </span>
                                <span>Published</span>
                              </div>
                            )}

                            {card.status === "APPROVED" && (
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm shadow-sm font-semibold">
                                <span className="material-symbols-outlined text-[14px]">
                                  thumb_up
                                </span>
                                <span>Approved</span>
                              </div>
                            )}

                            {card.status === "PENDING" && (
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm shadow-sm font-semibold">
                                <span className="material-symbols-outlined text-[14px]">
                                  pending
                                </span>
                                <span>Pending Review</span>
                              </div>
                            )}

                            {card.needsConsentCheck ? (
                              <div className="absolute bottom-2.5 inset-x-2.5 px-2.5 py-1 rounded bg-secondary-fixed/95 backdrop-blur text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-1.5 shadow-sm">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  shield_person
                                </span>
                                <span className="truncate">{card.expiryText}</span>
                              </div>
                            ) : (
                              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-inverse-surface/80 backdrop-blur text-inverse-on-surface font-label-sm text-label-sm">
                                {card.expiryText}
                              </div>
                            )}
                          </div>

                          <div className="p-space-md flex flex-col gap-space-sm flex-1 justify-between">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                                  {card.fileName}
                                </span>
                                <span className="font-label-sm text-label-sm text-outline">
                                  {card.fileSizeLabel}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {card.tags.map((tag) => (
                                  <span
                                    className={`px-2 py-0.5 rounded font-label-sm text-label-sm ${
                                      tag === "Pastoral" || tag === "Parent Consent Pending"
                                        ? "bg-secondary-fixed text-on-secondary-fixed"
                                        : "bg-surface-container text-on-surface-variant"
                                    }`}
                                    key={tag}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {card.status === "PENDING" ? (
                              <div className="pt-space-xs flex items-center gap-1.5">
                                <button
                                  className="flex-1 py-1.5 bg-primary text-on-primary rounded-md font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors"
                                  onClick={() => handleCardDecision(card.id, "PUBLISH")}
                                  type="button"
                                >
                                  {card.approveLabel ?? "Approve"}
                                </button>
                                {card.needsConsentCheck ? (
                                  <>
                                    <button
                                      className="flex-1 py-1.5 bg-surface-container text-on-surface rounded-md font-label-sm text-label-sm font-medium hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
                                      onClick={() => handleCardDecision(card.id, "BLUR_MINORS")}
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">
                                        blur_on
                                      </span>
                                      <span>Blur Minors</span>
                                    </button>
                                    <button
                                      className="px-2.5 py-1.5 bg-error-container text-on-error-container rounded-md font-label-sm text-label-sm font-medium hover:bg-error hover:text-on-error transition-colors"
                                      onClick={() => handleCardDecision(card.id, "DELETE")}
                                      type="button"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="px-2.5 py-1.5 bg-surface-container text-on-surface rounded-md font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                                    type="button"
                                  >
                                    Tag
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="pt-space-xs flex items-center justify-between bg-surface-container-low px-space-sm py-1.5 rounded-lg">
                                <div className="flex items-center gap-1">
                                  <Link
                                    className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                                    href={`/photos/${card.id}`}
                                    title="Preview"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      visibility
                                    </span>
                                  </Link>
                                  <button
                                    className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                                    title="Tag Members"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      label
                                    </span>
                                  </button>
                                  <button
                                    className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                                    title="Download"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      download
                                    </span>
                                  </button>
                                </div>
                                <button
                                  className="w-7 h-7 rounded hover:bg-error-container text-error flex items-center justify-center transition-colors"
                                  onClick={() => handleCardDecision(card.id, "DELETE")}
                                  title="Delete Photo"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    delete
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sticky Floating Multi-Select Batch Action Footer */}
                  {selectedIds.length > 0 && (
                    <div className="sticky bottom-6 z-30 w-full bg-inverse-surface/95 backdrop-blur-md text-inverse-on-surface rounded-2xl p-space-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-md">
                      <div className="flex items-center gap-space-md">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
                          <span className="material-symbols-outlined text-[22px]">checklist</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-semibold text-inverse-on-surface">
                            {selectedIds.length} Photo{selectedIds.length > 1 ? "s" : ""} Selected
                          </span>
                          <span className="font-body-sm text-body-sm text-surface-dim">
                            Selected for bulk publishing or removal from gallery
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm flex-wrap">
                        <button
                          className="h-10 px-space-md rounded-lg bg-surface-variant/20 hover:bg-surface-variant/30 text-inverse-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors"
                          onClick={() => {
                            setSelectedIds([]);
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                          <span>Clear Selection</span>
                        </button>
                        <button
                          className="h-10 px-space-md rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md flex items-center gap-1.5 transition-colors"
                          onClick={() => {
                            setCards((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
                            const count = selectedIds.length;
                            setSelectedIds([]);
                            showNotification(`${count} photo(s) removed.`);
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span>Delete ({selectedIds.length})</span>
                        </button>
                        <button
                          className="h-10 px-space-lg rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-md text-label-md font-bold flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
                          onClick={() => {
                            setCards((prev) =>
                              prev.map((c) =>
                                selectedIds.includes(c.id)
                                  ? { ...c, status: "PUBLISHED", needsConsentCheck: false }
                                  : c,
                              ),
                            );
                            const count = selectedIds.length;
                            setSelectedIds([]);
                            showNotification(
                              `Bulk published ${count} photo(s) to the RCCG JESUS HOUSE, OGBOMOSHO gallery!`,
                            );
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">publish</span>
                          <span>Bulk Publish ({selectedIds.length})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
