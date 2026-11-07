"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { type ReactElement, useState } from "react";

import { hasPhotoUploadAccess } from "@/auth/permissions";

const SERVICE_PHOTOS_QUERY = gql`
  query GetServicePhotos($albumKey: String) {
    me {
      id
      fullName
      role
      department
      activities
      avatarUrl
    }
    servicePhotos(albumKey: "all") {
      id
      title
      fileName
      albumKey
      albumTitle
      serviceDate
      photographer
      imageUrl
      fileSizeLabel
      daysLeftLabel
      daysLeftCount
    }
  }
`;

interface GalleryPhotoItem {
  id: string;
  title: string;
  albumKey: "today" | "thanksgiving" | "choir";
  imageUrl: string;
  alt: string;
  badgeText: string;
  badgeVariant: "today" | "neutral" | "amber" | "urgent";
}

export default function PhotosGalleryPage(): ReactElement {
  const [showBanner, setShowBanner] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "thanksgiving" | "choir">(
    "all",
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<GalleryPhotoItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data } = useQuery(SERVICE_PHOTOS_QUERY, {
    variables: { albumKey: activeFilter },
    fetchPolicy: "network-only",
  });

  const allPhotos: GalleryPhotoItem[] = (
    (data?.servicePhotos as Array<{
      id: string;
      title: string;
      albumKey: "today" | "thanksgiving" | "choir";
      imageUrl: string;
      daysLeftLabel: string;
      daysLeftCount: number;
    }>) ?? []
  ).map((p) => ({
    id: p.id,
    title: p.title,
    albumKey: p.albumKey,
    imageUrl: p.imageUrl,
    alt: p.title,
    badgeText: p.daysLeftLabel,
    badgeVariant:
      p.daysLeftLabel === "Today" || p.daysLeftCount >= 7
        ? "today"
        : p.daysLeftCount <= 1
          ? "urgent"
          : p.daysLeftCount <= 3
            ? "amber"
            : "neutral",
  }));

  const filteredPhotos = allPhotos.filter(
    (item) => activeFilter === "all" || item.albumKey === activeFilter,
  );
  const todayCount = allPhotos.filter((p) => p.albumKey === "today").length;
  const thanksgivingCount = allPhotos.filter((p) => p.albumKey === "thanksgiving").length;
  const choirCount = allPhotos.filter((p) => p.albumKey === "choir").length;

  function triggerToast(msg: string): void {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }

  function toggleSelectMode(): void {
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds([]);
    } else {
      setSelectMode(true);
    }
  }

  function handleCardClick(item: GalleryPhotoItem): void {
    if (selectMode) {
      setSelectedIds((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
      );
    } else {
      setPreviewPhoto(item);
    }
  }

  function handleSelectAll(): void {
    setSelectedIds(filteredPhotos.map((p) => p.id));
  }

  function handleMultiDownload(): void {
    const count = selectedIds.length;
    setSelectMode(false);
    setSelectedIds([]);
    triggerToast(`Successfully downloaded ${count} church memories!`);
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img
              alt="RCCG JESUS HOUSE, OGBOMOSHO Brand Logo"
              className="h-8 w-auto object-contain"
              src="/rccg-logo.png"
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                RCCG JESUS HOUSE, OGBOMOSHO
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                Photos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            {hasPhotoUploadAccess(data?.me) && (
              <Link
                href="/admin/photos"
                className="h-9 px-3 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center gap-1.5 shadow-sm hover:bg-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                <span>Upload Service Photos</span>
              </Link>
            )}
            <button
              aria-label="Notifications"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
            <Link
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center"
              href="/profile"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src={(data?.me?.avatarUrl as string | undefined) || "/rccg-logo.png"}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto">
          {/* Info & Auto-Expiry Notice Banner */}
          {showBanner && (
            <div className="px-margin pt-space-md">
              <div className="bg-secondary-fixed text-on-secondary-fixed rounded-xl p-space-md shadow-sm flex items-start gap-space-sm relative overflow-hidden">
                <div className="p-1 rounded-full bg-secondary/10 flex-shrink-0 text-secondary">
                  <span
                    className="material-symbols-outlined text-[20px] block"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    hourglass_bottom
                  </span>
                </div>
                <div className="flex-1 pr-space-xs">
                  <div className="font-label-md text-label-md font-semibold text-on-secondary-fixed flex items-center gap-1">
                    7-Day Storage Preservation
                  </div>
                  <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-0.5 leading-snug">
                    Service moments are kept for 7 days to honor member privacy &amp; keep cloud
                    media clean. Download your favorites before they expire!
                  </p>
                </div>
                <button
                  aria-label="Dismiss banner"
                  className="text-on-secondary-fixed-variant hover:text-on-secondary-fixed p-1 transition-colors"
                  onClick={() => setShowBanner(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Controls Bar: Album Selection & Multi-Download Mode */}
          <div className="px-margin mt-space-lg flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <span
                className="material-symbols-outlined text-primary text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                photo_library
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Moments &amp; Memories
              </h2>
            </div>
            <button
              className={`h-10 px-space-md rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                selectMode
                  ? "bg-error-container text-on-error-container"
                  : "bg-surface-container-high text-primary hover:bg-surface-variant"
              }`}
              onClick={toggleSelectMode}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {selectMode ? "close" : "checklist"}
              </span>
              <span className="font-label-md text-label-md">
                {selectMode ? "Cancel" : "Select Photos"}
              </span>
            </button>
          </div>

          {/* Horizontal Filter Carousel */}
          <div className="mt-space-md w-full overflow-x-auto no-scrollbar flex items-center gap-space-sm px-margin py-1">
            <button
              className={`whitespace-nowrap h-9 px-space-md rounded-full font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 ${
                activeFilter === "all"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
              onClick={() => setActiveFilter("all")}
              type="button"
            >
              <span>All Photos</span>
              <span className="bg-on-primary/20 text-on-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {allPhotos.length}
              </span>
            </button>

            <button
              className={`whitespace-nowrap h-9 px-space-md rounded-full font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 ${
                activeFilter === "today"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
              onClick={() => setActiveFilter("today")}
              type="button"
            >
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Sunday Service</span>
              <span className="font-label-sm text-label-sm opacity-75">
                ({todayCount}) · 7d left
              </span>
            </button>

            <button
              className={`whitespace-nowrap h-9 px-space-md rounded-full font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 ${
                activeFilter === "thanksgiving"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
              onClick={() => setActiveFilter("thanksgiving")}
              type="button"
            >
              <span>Thanksgiving Service</span>
              <span className="font-label-sm text-label-sm opacity-75">
                ({thanksgivingCount}) · 3d left
              </span>
            </button>

            <button
              className={`whitespace-nowrap h-9 px-space-md rounded-full font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 ${
                activeFilter === "choir"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
              onClick={() => setActiveFilter("choir")}
              type="button"
            >
              <span>Choir Concert</span>
              <span className="font-label-sm text-label-sm opacity-75">
                ({choirCount}) · 1d left
              </span>
            </button>
          </div>

          {/* Selection Status Bar */}
          {selectMode && (
            <div className="px-margin mt-space-sm">
              <div className="bg-primary-container text-on-primary rounded-xl px-space-md py-space-sm flex items-center justify-between shadow-md">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md font-medium text-surface-container-highest">
                    {selectedIds.length === 1
                      ? "1 photo selected"
                      : `${selectedIds.length} photos selected`}
                  </span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    className="font-label-sm text-label-sm text-on-primary underline opacity-90 hover:opacity-100"
                    onClick={handleSelectAll}
                    type="button"
                  >
                    Select All
                  </button>
                  <button
                    className="h-8 px-space-md rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50"
                    disabled={selectedIds.length === 0}
                    onClick={handleMultiDownload}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Responsive Photo Grid (3 cols on mobile, 4 cols on tablet/desktop) */}
          <div className="px-margin mt-space-md">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {filteredPhotos.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    className={`relative aspect-square rounded-xl overflow-hidden shadow-sm bg-surface-container-low group cursor-pointer transition-all ${
                      isSelected ? "scale-[0.96] opacity-90" : ""
                    }`}
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                  >
                    <img
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={item.imageUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent opacity-80" />

                    {/* Days-left / Today Badge */}
                    {item.badgeVariant === "today" && (
                      <span className="absolute top-1.5 left-1.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[10px] leading-tight px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-on-tertiary-fixed" />{" "}
                        {item.badgeText}
                      </span>
                    )}
                    {item.badgeVariant === "neutral" && (
                      <span className="absolute top-1.5 left-1.5 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-[10px] leading-tight px-1.5 py-0.5 rounded-full shadow-sm">
                        {item.badgeText}
                      </span>
                    )}
                    {item.badgeVariant === "amber" && (
                      <span className="absolute top-1.5 left-1.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] leading-tight px-1.5 py-0.5 rounded-full shadow-sm">
                        {item.badgeText}
                      </span>
                    )}
                    {item.badgeVariant === "urgent" && (
                      <span className="absolute top-1.5 left-1.5 bg-error-container text-on-error-container font-label-sm text-[10px] leading-tight px-1.5 py-0.5 rounded-full shadow-sm font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">alarm</span>{" "}
                        {item.badgeText}
                      </span>
                    )}

                    {/* Select Checkbox */}
                    {selectMode && (
                      <div
                        className={`absolute top-1.5 right-1.5 flex w-5 h-5 rounded-full items-center justify-center shadow-sm ${
                          isSelected ? "bg-primary text-on-primary" : "bg-surface/90 text-primary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    )}

                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-on-primary">
                      <span className="font-label-sm text-[11px] truncate drop-shadow-sm font-medium">
                        {item.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Single Full-Screen Photo Preview Modal */}
          {previewPhoto && (
            <div className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-margin">
              <div className="relative w-full max-w-sm bg-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-space-sm flex items-center justify-between bg-surface">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      auto_awesome
                    </span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {previewPhoto.title}
                    </span>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                    onClick={() => setPreviewPhoto(null)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="relative aspect-square w-full bg-surface-container-high overflow-hidden">
                  <img
                    alt={previewPhoto.title}
                    className="w-full h-full object-cover"
                    src={previewPhoto.imageUrl}
                  />
                </div>
                <div className="p-space-md bg-surface flex items-center justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary font-medium">
                      {previewPhoto.badgeText === "Today"
                        ? "Added Today · Expires in 7 days"
                        : previewPhoto.badgeText}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Sunday Service · High Resolution
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      className="h-10 px-3 rounded-xl bg-surface-container text-primary font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high"
                      href={`/photos/${previewPhoto.id}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                      <span>Viewer</span>
                    </Link>
                    <button
                      className="h-10 px-space-md rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1 shadow-sm active:scale-95 hover:bg-primary-container"
                      onClick={() => {
                        setPreviewPhoto(null);
                        triggerToast("Photo saved to your device!");
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deliberate Empty State / Sanctuary Lifecycle Assurance Note */}
          <div className="px-margin my-space-xl">
            <div className="bg-surface-container-low rounded-2xl p-space-lg text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-surface-variant/60 flex items-center justify-center text-primary mb-space-sm">
                <span
                  className="material-symbols-outlined text-[30px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cloud_sync
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Sanctuary Archival Cycle
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mt-space-xs leading-relaxed">
                No expired photos are retained on our servers. Fresh photo memories from upcoming
                worship appear right here after every Sunday service!
              </p>
              <div className="mt-space-md inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Next upload: Sunday 24 Nov, ~2:00 PM</span>
              </div>
            </div>
          </div>

          {/* Floating Toast Notification on Download */}
          {toastMessage && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-space-lg py-2.5 rounded-full shadow-xl font-label-md text-label-md flex items-center gap-2 transition-all duration-300">
              <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">
                check_circle
              </span>
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-label-sm text-label-sm">Home</span>
          </Link>
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/streak"
          >
            <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
            <span className="font-label-sm text-label-sm">Streak</span>
          </Link>
          <Link
            aria-current="page"
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors text-primary-container font-semibold"
            href="/photos"
          >
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
            <span className="font-label-sm text-label-sm">Photos</span>
          </Link>
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/profile"
          >
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="font-label-sm text-label-sm">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
