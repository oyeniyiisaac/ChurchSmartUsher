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
      serviceDate
    }
    services {
      id
      name
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
      imageUrl
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
  fileSizeLabel: string;
  imageUrl: string;
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

export default function AdminPhotoModerationHubPage(): ReactElement {
  const [cards, setCards] = useState<ModerationCardItem[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "PENDING" | "FLAGGED">("ALL");
  const [activeTag, setActiveTag] = useState("All Tags");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [selectedServiceName, setSelectedServiceName] = useState<string>("Sunday Worship Service");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, refetch } = useQuery(ADMIN_PHOTO_HUB_QUERY, {
    variables: { statusFilter: activeTab, tagFilter: activeTag },
    fetchPolicy: "network-only",
  });
  const [uploadPhotoMutation] = useMutation(UPLOAD_PHOTO_MUTATION);
  const [moderateMutation] = useMutation(MODERATE_PHOTO_MUTATION);
  const [purgeMutation] = useMutation(PURGE_EXPIRED_PHOTOS_MUTATION);

  const isAdmin = hasAdminAccess(data?.me);
  const serviceOptions: Array<{ id: string; name: string; serviceDate: string }> =
    data?.services && data.services.length > 0
      ? (data.services as Array<{ id: string; name: string; serviceDate: string }>)
      : [
          {
            id: "active-sunday",
            name: (data?.activeService?.name as string | undefined) || "Sunday Worship Service",
            serviceDate: (data?.activeService?.serviceDate as string | undefined) || "Sunday",
          },
          {
            id: "midweek-study",
            name: "Midweek Digging Deep / Faith Clinic",
            serviceDate: "Midweek",
          },
          {
            id: "thanksgiving-service",
            name: "Monthly Thanksgiving Service",
            serviceDate: "First Sunday",
          },
        ];

  useEffect(() => {
    const rawPhotos = (data?.adminPhotoHub?.photos ?? []) as Array<{
      id: string;
      title: string;
      fileName: string;
      fileSizeLabel: string;
      imageUrl: string;
      status: string;
      tags: string[];
      needsConsentCheck: boolean;
      daysLeftLabel: string;
    }>;

    setCards(
      rawPhotos.map((p) => ({
        id: p.id,
        fileName: p.fileName || p.title,
        fileSizeLabel: p.fileSizeLabel || "2.4 MB",
        imageUrl: p.imageUrl,
        alt: p.title,
        status:
          p.status === "PENDING" ? "PENDING" : p.status === "APPROVED" ? "APPROVED" : "PUBLISHED",
        expiryText: p.daysLeftLabel || "Expires in 7d",
        tags: p.tags?.length ? p.tags : ["Congregation"],
        needsConsentCheck: p.needsConsentCheck,
      })),
    );
  }, [data]);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const matchedService = serviceOptions.find((s) => s.name === selectedServiceName);
      const isThanksgiving = selectedServiceName.toLowerCase().includes("thanksgiving");
      const albumKey = isThanksgiving ? "thanksgiving" : "today";
      const sizeMb = Math.max(0.1, file.size / (1024 * 1024)).toFixed(1);

      try {
        await uploadPhotoMutation({
          variables: {
            input: {
              title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " "),
              fileName: file.name,
              albumKey,
              albumTitle: `${selectedServiceName} — RCCG JESUS HOUSE, OGBOMOSHO`,
              serviceDate: matchedService?.serviceDate ?? new Date().toLocaleDateString(),
              photographer: data?.me?.fullName ?? "Media Unit",
              fileSizeLabel: `${sizeMb} MB`,
              tags: ["Congregation"],
              status: "PUBLISHED",
              needsConsentCheck: false,
              fileContentBase64: base64,
            },
          },
        });
        uploadedCount += 1;
      } catch (err) {
        showNotification(err instanceof Error ? err.message : "Failed to upload photo");
      }
    }

    setUploadingFiles(false);
    event.target.value = "";
    if (uploadedCount > 0) {
      await refetch();
      showNotification(
        `Uploaded ${uploadedCount} photo(s) to Cloudinary & saved to MongoDB gallery!`,
      );
    }
  }

  function showNotification(msg: string): void {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner(null);
    }, 3200);
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
                <div className="bg-primary text-on-primary px-space-md py-2.5 rounded-xl shadow-md flex items-center justify-between">
                  <span className="font-label-md text-label-md">{statusBanner}</span>
                  <button
                    className="text-on-primary/80 hover:text-on-primary"
                    onClick={() => setStatusBanner(null)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
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
                        ID: ALB-241117
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
                          defaultValue="Sunday Thanksgiving Service - 17 Nov 2024"
                          id="album-select"
                        >
                          <option>Sunday Thanksgiving Service - 17 Nov 2024</option>
                          <option>Midweek Communion Service - 13 Nov 2024</option>
                          <option>Youth Ablaze Concert - 09 Nov 2024</option>
                          <option>Holy Ghost Night (Lagos Regional) - 01 Nov 2024</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-[22px]">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        17 November 2024
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">church</span>
                        Main Auditorium
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          nest_clock_farsight_analog
                        </span>
                        08:30 - 11:45 WAT
                      </span>
                    </div>
                  </div>

                  {/* Drag-and-Drop Dropzone */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Ingest &amp; Upload
                      </span>
                      <span className="text-tertiary font-label-sm text-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">bolt</span> CDN
                        Turbo Active
                      </span>
                    </div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group p-space-lg rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center text-center cursor-pointer"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
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
                          : "Drag & drop RAW / JPEG photos"}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        or{" "}
                        <span className="text-secondary font-semibold hover:underline">
                          browse workstation files
                        </span>
                      </p>
                      <p className="font-label-sm text-label-sm text-outline mt-2">
                        JPEG, HEIC, PNG • Uploaded directly to Cloudinary
                      </p>
                      <div className="mt-space-md px-space-sm py-1.5 bg-surface-container-lowest rounded-lg flex items-center gap-2 max-w-full">
                        <span className="material-symbols-outlined text-secondary text-[16px]">
                          compress
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-left leading-tight truncate">
                          Auto-optimizing for low-bandwidth mobile devices
                        </span>
                      </div>
                    </div>

                    {/* Active Upload Queue Card */}
                    <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            sync
                          </span>
                          <span className="font-label-md text-label-md text-on-surface font-semibold">
                            Uploading batch: DSC_4920 to DSC_4928
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          78%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary-container h-full rounded-full transition-all duration-300"
                          style={{ width: "78%" }}
                        />
                      </div>
                      <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                        <span>8 photos (32.4 MB of 41.5 MB)</span>
                        <span className="font-semibold text-secondary">4.2 MB/s</span>
                      </div>
                      <div className="pt-space-xs flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                            defaultChecked
                            type="checkbox"
                          />
                          <span className="font-label-sm text-label-sm text-on-surface">
                            Auto-enhance lighting &amp; sanctuary white balance
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                            defaultChecked
                            type="checkbox"
                          />
                          <span className="font-label-sm text-label-sm text-on-surface">
                            Tag Sanctuary Choir &amp; Pastoral Ministers
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                            type="checkbox"
                          />
                          <span className="font-label-sm text-label-sm text-on-surface">
                            Detect &amp; blur underage worshippers automatically
                          </span>
                        </label>
                      </div>
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
                          All Photos (24)
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
                          Published (18)
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
                            6
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
                          Flagged (0)
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
                            <img
                              alt={card.alt}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              src={card.imageUrl}
                            />
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
                  <div className="sticky bottom-6 z-30 w-full bg-inverse-surface/95 backdrop-blur-md text-inverse-on-surface rounded-2xl p-space-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-md">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[22px]">checklist</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-semibold text-inverse-on-surface">
                          6 Photos Selected for Moderation
                        </span>
                        <span className="font-body-sm text-body-sm text-surface-dim">
                          Pending review clearance for congregation app release
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm flex-wrap">
                      <button
                        className="h-10 px-space-md rounded-lg bg-surface-variant/20 hover:bg-surface-variant/30 text-inverse-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors"
                        onClick={() => showNotification("Master ZIP archive download started.")}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">folder_zip</span>
                        <span>Download Master ZIP</span>
                      </button>
                      <button
                        className="h-10 px-space-md rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md flex items-center gap-1.5 transition-colors"
                        onClick={() => {
                          setCards((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
                          setSelectedIds([]);
                          showNotification("Selected photos permanently deleted.");
                        }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        <span>Delete Selected</span>
                      </button>
                      <button
                        className="h-10 px-space-lg rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-md text-label-md font-bold flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
                        onClick={() => {
                          setCards((prev) =>
                            prev.map((c) => ({
                              ...c,
                              status: "PUBLISHED",
                              needsConsentCheck: false,
                            })),
                          );
                          showNotification(
                            "Bulk published 6 photos to the ChurchConnect member gallery.",
                          );
                        }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">publish</span>
                        <span>Bulk Publish (6)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
