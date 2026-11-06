"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

interface ViewerPhotoSlide {
  id: string;
  albumTitle: string;
  expiryText: string;
  imageUrl: string;
  fileSizeLabel: string;
  photographer: string;
  dateTimeLabel: string;
}

const SLIDES: ViewerPhotoSlide[] = [
  {
    id: "photo-1",
    albumTitle: "Thanksgiving Sunday Service",
    expiryText: "Expires in 3 days · Sun 24 Nov",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAsxIcTsJqarrXyVtdNznsxVsL7V1Y-7xVizf2ytbV1QKAtvOOk6R-8lpTIanP2ixcCFBEumHxwecegZQ5DjqvJlue7h9BPgWte1kUiqkEd-_EhnSCrQ1bU-VddRPca-qMqihakoMVVT_Dw4pUmjB3vDYTf-EuvB5DILRzTyVVNcZDz3p1ZkpjdsasA6ZR_b44KiYKu7JOr9WDJ9SXf66kE5wNoy5T5L4tPWCHBthQ",
    fileSizeLabel: "3.4 MB",
    photographer: "Emmanuel & Grace",
    dateTimeLabel: "Sunday 17 Nov 2024 · 9:45 AM (First Service)",
  },
  {
    id: "photo-2",
    albumTitle: "Thanksgiving Sunday Service",
    expiryText: "Expires in 3 days · Sun 24 Nov",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDUzDedsfSo8l-h9uud_0qc2UjaxWf6dsni4Rul7kQ4nwlBcDRfNE9q_4eP9wJvWaF4mHzMJYl6dfyzZj-8Q0ncdR5njBQsNqqhQXOX1mKBhQOiT0VfTVi32OJSzZya2xuWtUiDqXZTg8tn-QCXT5AHFbz_V7E7gV3IHxVymPC8_TVQYmXSY5KMMnF60ociY36K7PuI8Btq-tCQackHkyaRfBCjXolwdAO2hC6UI-g",
    fileSizeLabel: "4.1 MB",
    photographer: "Emmanuel & Grace",
    dateTimeLabel: "Sunday 17 Nov 2024 · 9:45 AM (First Service)",
  },
  {
    id: "photo-3",
    albumTitle: "Thanksgiving Sunday Service",
    expiryText: "Expires in 3 days · Sun 24 Nov",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUc_c72PpuvnKasxlubgUPacO1sZJ4UDnvu2pFu7-UiluslFnOmCrN7ALfPhAAsp1VhJb-T5nYr8O8wDf6khrryELhAmS5TdQt4UuC1vuYjmrkOI_StrDh2MFLHvZPKqRFZqgrJiBx-8xsP5rxYlMLnhsd5LNHz1iCnKy-e3TAIxN2-H4M5Bzb8odnOXUZFnRFxC8lmrswFPNJYlvlfLL3l2ZQcRiZYRq0z_3qUDM",
    fileSizeLabel: "3.1 MB",
    photographer: "Emmanuel & Grace",
    dateTimeLabel: "Sunday 17 Nov 2024 · 9:45 AM (First Service)",
  },
  {
    id: "photo-4",
    albumTitle: "Thanksgiving Sunday Service",
    expiryText: "Expires in 3 days · Sun 24 Nov",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBsdo8jVOaxFelJzxnfdC122VNSbFdbqErcIERjiA4-2t0okYmg34LNmVYCAxIUJffhwPpEUCET7nK3IaRzOHH4CcXisObdTphT9Qut3CDkkGQgJCCRcv7GBte7P79J9jxFkLxoIdlTE_Oo5B5xh7W88eusSS1zpUgn_ZeBsWBziBqAuXEF0qiy_i4g3oc3SwaDC4MT7JUHcxfIcZnQ_o7GWv4BF6rwa-bfzFEV38U",
    fileSizeLabel: "3.2 MB",
    photographer: "Emmanuel & Grace",
    dateTimeLabel: "Sunday 17 Nov 2024 · 9:45 AM (First Service)",
  },
  {
    id: "photo-5",
    albumTitle: "Thanksgiving Sunday Service",
    expiryText: "Expires in 3 days · Sun 24 Nov",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJZrhy2NPwmlgqzYQHh1VeWI2SSTDUoJuCL9NpZgiLKCfV-CMrCGG_TrZyx10SxOLiGfgHX54yvQCZL_mf2PeoqPU1Nohr9rzb4dOEmiP2VD61sCYMKvzcjVED2K6dD-Q3MsuRIR6pWAw4YTsTLT9T1PNB0Dsgruq9oDGO_SjL5LcPxtIhMdEcBvUhsXMF5T-HPj_4t1YMNTzfdD5CxdnsncNpAUeY4yxSXaDbED4",
    fileSizeLabel: "4.4 MB",
    photographer: "Emmanuel & Grace",
    dateTimeLabel: "Sunday 17 Nov 2024 · 9:45 AM (First Service)",
  },
  {
    id: "photo-6",
    albumTitle: "Thanksgiving Sunday Service",
    expiryText: "Expires in 3 days · Sun 24 Nov",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC12FuQ6I29zLPHseTIqG9xTIV04uC25m8QB71CHf0aNh-HLp03JcnSaNVJExlaPw0WbUOAWaYSS3xQnLzSb5wF93qWgPDfJU2_kdlSnrn8pnz259PVzxsmfN-J74S0x-FlLyNXOoDlsG7kg5iTqTLKvgYEaMMIvb5vlXcLeiKhurZ7WWKNYTjTVDfpVOs4nFL3yue5mZiF6xKUy4PRrr8Li68NThHx09W9QM_lgIY",
    fileSizeLabel: "2.7 MB",
    photographer: "Emmanuel & Grace",
    dateTimeLabel: "Sunday 17 Nov 2024 · 9:45 AM (First Service)",
  },
];

const THUMBNAILS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAsxIcTsJqarrXyVtdNznsxVsL7V1Y-7xVizf2ytbV1QKAtvOOk6R-8lpTIanP2ixcCFBEumHxwecegZQ5DjqvJlue7h9BPgWte1kUiqkEd-_EhnSCrQ1bU-VddRPca-qMqihakoMVVT_Dw4pUmjB3vDYTf-EuvB5DILRzTyVVNcZDz3p1ZkpjdsasA6ZR_b44KiYKu7JOr9WDJ9SXf66kE5wNoy5T5L4tPWCHBthQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUzDedsfSo8l-h9uud_0qc2UjaxWf6dsni4Rul7kQ4nwlBcDRfNE9q_4eP9wJvWaF4mHzMJYl6dfyzZj-8Q0ncdR5njBQsNqqhQXOX1mKBhQOiT0VfTVi32OJSzZya2xuWtUiDqXZTg8tn-QCXT5AHFbz_V7E7gV3IHxVymPC8_TVQYmXSY5KMMnF60ociY36K7PuI8Btq-tCQackHkyaRfBCjXolwdAO2hC6UI-g",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCUc_c72PpuvnKasxlubgUPacO1sZJ4UDnvu2pFu7-UiluslFnOmCrN7ALfPhAAsp1VhJb-T5nYr8O8wDf6khrryELhAmS5TdQt4UuC1vuYjmrkOI_StrDh2MFLHvZPKqRFZqgrJiBx-8xsP5rxYlMLnhsd5LNHz1iCnKy-e3TAIxN2-H4M5Bzb8odnOXUZFnRFxC8lmrswFPNJYlvlfLL3l2ZQcRiZYRq0z_3qUDM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAbZ9E46AiH8PbVW0R1e324fuqwbXjaHjTtU5JGuuxsFqn8Ng6RnvbqrKW126yo59WhiA6IIfgRsWar0dZDM2JxeUgbbUB9ezbBo8nvcwgGHOSdNi6bDj9FA0eqg67F_Oirrj1cAwUs4mwVESIXRjwPslkw8y8BxrsbCFdki4eB5o9D-ZVEnRtWwmXu7rDKWlVmCrihY2GCJIK6hvues7JVbIYHGSw6rN8Lv2xRpdc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDJZrhy2NPwmlgqzYQHh1VeWI2SSTDUoJuCL9NpZgiLKCfV-CMrCGG_TrZyx10SxOLiGfgHX54yvQCZL_mf2PeoqPU1Nohr9rzb4dOEmiP2VD61sCYMKvzcjVED2K6dD-Q3MsuRIR6pWAw4YTsTLT9T1PNB0Dsgruq9oDGO_SjL5LcPxtIhMdEcBvUhsXMF5T-HPj_4t1YMNTzfdD5CxdnsncNpAUeY4yxSXaDbED4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC12FuQ6I29zLPHseTIqG9xTIV04uC25m8QB71CHf0aNh-HLp03JcnSaNVJExlaPw0WbUOAWaYSS3xQnLzSb5wF93qWgPDfJU2_kdlSnrn8pnz259PVzxsmfN-J74S0x-FlLyNXOoDlsG7kg5iTqTLKvgYEaMMIvb5vlXcLeiKhurZ7WWKNYTjTVDfpVOs4nFL3yue5mZiF6xKUy4PRrr8Li68NThHx09W9QM_lgIY",
];

export default function PhotoViewerPage(): ReactElement {
  const params = useParams<{ photoId?: string }>();
  const photoId = params?.photoId ?? "photo-4";

  useEffect(() => {
    void fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query:
          "query GetServicePhoto($id: ID!) { servicePhoto(id: $id) { id title albumTitle } }",
        variables: { id: photoId },
      }),
    }).catch(() => undefined);
  }, [photoId]);

  const [activeIndex, setActiveIndex] = useState(3);
  const [isFavorite, setIsFavorite] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "saving" | "done">("idle");
  const [showSaveToast, setShowSaveToast] = useState(false);

  const currentSlide = SLIDES[activeIndex] ?? SLIDES[3]!;

  function handleDownload(): void {
    setDownloadState("saving");
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
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Link
              aria-label="Go back"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors"
              href="/photos"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <img
              alt="ChurchConnect Brand Logo"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full relative select-none">
          {/* Status & Expiration Warning Strip */}
          <div className="w-full px-margin pt-space-xs pb-space-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <Link
                className="flex items-center gap-space-xs text-on-surface hover:text-primary transition-colors py-1 min-h-[44px]"
                href="/photos"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span className="font-label-md text-label-md text-on-surface">Back to Gallery</span>
              </Link>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                Photo {activeIndex + 1} of 18
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

          {/* High-Resolution Focus Frame */}
          <div className="relative w-full px-margin pb-space-md">
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-md bg-surface-container-lowest">
              <img
                alt={currentSlide.albumTitle}
                className="w-full h-full object-cover transition-transform duration-300 active:scale-98"
                src={currentSlide.imageUrl}
              />

              {/* Quick Gesture Overlay Indicators */}
              <div className="absolute inset-x-0 top-0 p-space-md bg-gradient-to-b from-inverse-surface/60 via-inverse-surface/20 to-transparent flex items-center justify-between text-on-primary">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm opacity-90">Service Album</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-primary drop-shadow-sm truncate max-w-[220px]">
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
                onClick={() => setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">chevron_left</span>
              </button>
              <button
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-inverse-surface/40 backdrop-blur-md text-on-primary flex items-center justify-center active:scale-90 transition-transform"
                onClick={() => setActiveIndex((prev) => (prev + 1) % SLIDES.length)}
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
            <div className="fixed top-20 inset-x-margin z-50 transition-all duration-300">
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
                      Added to &apos;ChurchConnect&apos; album in Gallery
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

          {/* Bottom Action Sheet / Controls Panel */}
          <div className="w-full px-margin pb-space-xl flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-space-md flex flex-col gap-space-md">
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
                  Photos are permanently cleared from church cloud servers after 7 days to preserve
                  sanctuary privacy and optimize fellowship storage.
                </p>
              </div>
            </div>

            {/* Album Peek Thumbnails strip */}
            <div className="flex flex-col gap-space-xs pt-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  More from this Service
                </span>
                <span className="font-label-sm text-label-sm text-primary">18 photos</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-margin px-margin">
                {THUMBNAILS.map((thumb, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      className={
                        isActive
                          ? "w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-md bg-primary-container p-0.5"
                          : "w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm opacity-60"
                      }
                      key={thumb}
                      onClick={() => setActiveIndex(idx)}
                      type="button"
                    >
                      <img
                        alt={`Service thumbnail ${idx + 1}`}
                        className={`w-full h-full object-cover ${isActive ? "rounded-md" : ""}`}
                        src={thumb}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
