"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

const PHOTO_VIEWER_QUERY = gql`
  query GetPhotoViewerData($id: ID!) {
    me {
      id
      fullName
      avatarUrl
    }
    servicePhoto(id: $id) {
      id
      title
      fileName
      albumTitle
      serviceDate
      photographer
      imageUrl
      mediaType
      fileSizeLabel
      daysLeftLabel
    }
    servicePhotos(albumKey: "all") {
      id
      title
      fileName
      albumTitle
      serviceDate
      photographer
      imageUrl
      mediaType
      fileSizeLabel
      daysLeftLabel
    }
  }
`;

interface ViewerPhotoSlide {
  id: string;
  title?: string;
  fileName?: string;
  albumTitle: string;
  expiryText: string;
  imageUrl: string;
  mediaType: "PHOTO" | "VIDEO";
  fileSizeLabel: string;
  photographer: string;
  dateTimeLabel: string;
}

export default function PhotoViewerPage(): ReactElement {
  const params = useParams<{ photoId?: string }>();
  const photoId = params?.photoId ?? "photo-1";

  const { data } = useQuery(PHOTO_VIEWER_QUERY, {
    variables: { id: photoId },
    fetchPolicy: "network-only",
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "saving" | "done">("idle");
  const [showSaveToast, setShowSaveToast] = useState(false);

  const slides: ViewerPhotoSlide[] = (
    (data?.servicePhotos as Array<{
      id: string;
      title?: string;
      fileName?: string;
      albumTitle: string;
      daysLeftLabel: string;
      imageUrl: string;
      mediaType?: string;
      fileSizeLabel: string;
      photographer: string;
      serviceDate: string;
    }>) ?? []
  ).map((p) => {
    const isVid =
      p.mediaType === "VIDEO" || /\.(mp4|webm|mov|m4v|ogg)$/i.test(p.fileName || p.imageUrl);
    return {
      id: p.id,
      title: p.title,
      fileName: p.fileName || `${p.title || "service"}.${isVid ? "mp4" : "jpg"}`,
      albumTitle: p.albumTitle,
      expiryText: `${p.daysLeftLabel} · Auto-expires after 7 days`,
      imageUrl: p.imageUrl,
      mediaType: isVid ? "VIDEO" : "PHOTO",
      fileSizeLabel: p.fileSizeLabel,
      photographer: p.photographer,
      dateTimeLabel: p.serviceDate,
    };
  });

  useEffect(() => {
    const idx = slides.findIndex((s) => s.id === photoId);
    if (idx >= 0) {
      setActiveIndex(idx);
    }
  }, [photoId, slides.length]);

  const fallbackIsVid =
    data?.servicePhoto?.mediaType === "VIDEO" ||
    /\.(mp4|webm|mov|m4v|ogg)$/i.test(
      data?.servicePhoto?.fileName || data?.servicePhoto?.imageUrl || "",
    );

  const fallbackSlide: ViewerPhotoSlide = {
    id: photoId,
    title: (data?.servicePhoto?.title as string | undefined) ?? "Service Highlight",
    fileName:
      (data?.servicePhoto?.fileName as string | undefined) ??
      `church-media.${fallbackIsVid ? "mp4" : "jpg"}`,
    albumTitle:
      (data?.servicePhoto?.albumTitle as string | undefined) ?? "RCCG JESUS HOUSE, OGBOMOSHO",
    expiryText: "Expires in 7 days · Auto-clears",
    imageUrl: (data?.servicePhoto?.imageUrl as string | undefined) ?? "/rccg-logo.png",
    mediaType: fallbackIsVid ? "VIDEO" : "PHOTO",
    fileSizeLabel: (data?.servicePhoto?.fileSizeLabel as string | undefined) ?? "High-Res",
    photographer: (data?.servicePhoto?.photographer as string | undefined) ?? "Media Team",
    dateTimeLabel: (data?.servicePhoto?.serviceDate as string | undefined) ?? "Sunday Service",
  };

  const currentSlide = slides[activeIndex] ?? fallbackSlide;
  const totalSlides = Math.max(slides.length, 1);

  function handleDownload(): void {
    setDownloadState("saving");
    try {
      const a = document.createElement("a");
      a.href = currentSlide.imageUrl;
      a.download =
        currentSlide.fileName ||
        `service-media.${currentSlide.mediaType === "VIDEO" ? "mp4" : "jpg"}`;
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
    setTimeout(() => {
      setDownloadState("done");
      setShowSaveToast(true);
      setTimeout(() => {
        setShowSaveToast(false);
      }, 4000);
    }, 600);
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Link
              aria-label="Go back"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors"
              href="/photos"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <img
              alt="RCCG JESUS HOUSE, OGBOMOSHO Brand Logo"
              className="h-7 w-auto object-contain"
              src="/rccg-logo.png"
            />
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">
              Photo Viewer
            </h1>
          </div>
          <div className="flex items-center">
            <Link href="/profile">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src={(data?.me?.avatarUrl as string | undefined) || "/rccg-logo.png"}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface pb-safe">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto relative select-none">
          {/* Status & Expiration Warning Strip */}
          <div className="w-full px-4 sm:px-6 lg:px-8 pt-space-xs pb-space-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <Link
                className="flex items-center gap-space-xs text-on-surface hover:text-primary transition-colors py-1 min-h-[44px]"
                href="/photos"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span className="font-label-md text-label-md text-on-surface">Back to Gallery</span>
              </Link>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                Photo {activeIndex + 1} of {totalSlides}
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-high px-space-md py-2 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  schedule
                </span>
                <p className="font-label-sm text-label-sm text-on-surface truncate">
                  {currentSlide.expiryText}
                </p>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold shrink-0">
                Auto-clears
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start px-4 sm:px-6 lg:px-8 pb-space-xl">
            {/* High-Resolution Focus Frame */}
            <div className="lg:col-span-7 relative w-full">
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-md bg-surface-container-lowest flex items-center justify-center">
                {currentSlide.mediaType === "VIDEO" ? (
                  <video
                    src={currentSlide.imageUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    alt={currentSlide.albumTitle}
                    className="w-full h-full object-cover transition-transform duration-300 active:scale-98"
                    src={currentSlide.imageUrl}
                  />
                )}

                {/* Quick Gesture Overlay Indicators */}
                <div className="absolute inset-x-0 top-0 p-space-md bg-gradient-to-b from-inverse-surface/60 via-inverse-surface/20 to-transparent flex items-center justify-between text-on-primary">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm opacity-90">Service Album</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-primary drop-shadow-sm truncate max-w-[220px] sm:max-w-xs">
                      {currentSlide.albumTitle}
                    </h2>
                  </div>
                  <button
                    aria-label="Favorite photo"
                    className="w-11 h-11 rounded-full bg-inverse-surface/40 backdrop-blur-md flex items-center justify-center text-on-primary active:scale-90 transition-transform"
                    onClick={() => setIsFavorite((prev) => !prev)}
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{
                        fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0",
                        color: isFavorite ? "#fe932c" : "#ffffff",
                      }}
                    >
                      {isFavorite ? "favorite" : "favorite_border"}
                    </span>
                  </button>
                </div>

                {/* Navigation Arrows for Quick Browsing */}
                <button
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-inverse-surface/40 backdrop-blur-md text-on-primary flex items-center justify-center active:scale-90 transition-transform"
                  onClick={() => setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                </button>
                <button
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-inverse-surface/40 backdrop-blur-md text-on-primary flex items-center justify-center active:scale-90 transition-transform"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % totalSlides)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                </button>

                {/* Watermark/Quality Tag */}
                <div className="absolute bottom-3 right-3 bg-inverse-surface/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-on-primary">
                  <span className="material-symbols-outlined text-[14px]">high_density</span>
                  <span className="font-label-sm text-label-sm font-semibold tracking-wider">
                    RAW · 4240 × 2832
                  </span>
                </div>
              </div>
            </div>

            {/* Toast Confirmation Preview */}
            {showSaveToast && (
              <div className="fixed top-20 inset-x-margin z-50 transition-all duration-300 max-w-md mx-auto">
                <div className="bg-primary text-on-primary shadow-xl rounded-xl p-space-md flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div>
                      <p className="font-label-lg text-label-lg font-semibold">
                        Photo saved to phone
                      </p>
                      <p className="font-body-sm text-body-sm text-on-primary-container">
                        Added to &apos;RCCG JESUS HOUSE, OGBOMOSHO&apos; album in Gallery
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-on-primary opacity-80 hover:opacity-100 p-1"
                    onClick={() => setShowSaveToast(false)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Right / Bottom Action Sheet & Controls Panel */}
            <div className="lg:col-span-5 w-full flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-space-md sm:p-6 flex flex-col gap-space-md">
                {/* Primary Download CTA */}
                <button
                  className="w-full h-[52px] bg-primary-container text-on-primary hover:bg-primary active:bg-primary font-label-lg text-label-lg rounded-xl shadow-md flex items-center justify-center gap-space-sm transition-all active:scale-[0.99]"
                  disabled={downloadState === "saving"}
                  onClick={handleDownload}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {downloadState === "saving"
                      ? "hourglass_top"
                      : downloadState === "done"
                        ? "check_circle"
                        : "download"}
                  </span>
                  <span>
                    {downloadState === "saving"
                      ? "Saving original file..."
                      : downloadState === "done"
                        ? `Downloaded (${currentSlide.fileSizeLabel})`
                        : `Download High-Resolution (${currentSlide.fileSizeLabel})`}
                  </span>
                </button>

                {/* Auxiliary Secondary Actions */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <button
                    className="h-11 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-colors"
                    onClick={handleDownload}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <span>Share Link</span>
                  </button>
                  <button
                    className="h-11 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-colors"
                    onClick={handleDownload}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">folder_zip</span>
                    <span>Download Album</span>
                  </button>
                </div>

                {/* Metadata Panel */}
                <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      photo_camera
                    </span>
                    <p className="font-body-sm text-body-sm">
                      <span className="font-semibold text-on-surface">Taken by Media Team</span> ·{" "}
                      {currentSlide.photographer}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <p className="font-body-sm text-body-sm">{currentSlide.dateTimeLabel}</p>
                  </div>
                </div>

                {/* Dignified Privacy Notice */}
                <div className="flex items-start gap-2 pt-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <p className="font-label-sm text-label-sm leading-snug">
                    Photos are permanently cleared from church cloud servers after 7 days to
                    preserve sanctuary privacy and optimize fellowship storage.
                  </p>
                </div>
              </div>

              {/* Album Peek Thumbnails strip */}
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    More from this Service
                  </span>
                  <span className="font-label-sm text-label-sm text-primary">
                    {slides.length} photos
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {slides.map((slideItem, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        className={
                          isActive
                            ? "w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-md bg-primary-container p-0.5"
                            : "w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm opacity-60"
                        }
                        key={slideItem.id}
                        onClick={() => setActiveIndex(idx)}
                        type="button"
                      >
                        <img
                          alt={`Service thumbnail ${idx + 1}`}
                          className={`w-full h-full object-cover ${isActive ? "rounded-md" : ""}`}
                          src={slideItem.imageUrl}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
