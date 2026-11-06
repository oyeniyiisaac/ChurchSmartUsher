"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { type ReactElement, useState } from "react";

const SERVICE_PHOTOS_QUERY = gql`
  query GetServicePhotos($albumKey: String) {
    servicePhotos(albumKey: $albumKey) {
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

const DEFAULT_GALLERY_ITEMS: GalleryPhotoItem[] = [
  {
    id: "photo-1",
    title: "Voices of Grace",
    albumKey: "today",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFIkmYeJ_X_xQqkSkBDwNiTxkFYs_HOuKPhRUnEBPUbKrD-RIgyWOHifF4jcs5f4Afn6woYtA1GqcU_XmWm3Mls5v65FM3-JGM6hZAFhkEQKnj_rxZNLPVb6GsMMOZ-kS_J2AdMrabdyVtOfBwSv0ocJA1EwoT9k0tHNGEI7HxYzFScW8YBilPNozDA_bGwK1Eh4iz9si2bpXOFmuXmdhbqRBOZz4Gl_wZQvl4pMY",
    alt: "Choir Praise",
    badgeText: "Today",
    badgeVariant: "today",
  },
  {
    id: "photo-2",
    title: "The Sermon",
    albumKey: "today",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFyztO9XKS5jYCAbc2Ezm9gq7Q1kcuwcCfw_jK9fWRdNQRv6x3nf1hCKXWr9rXghgRVIjiKUusnQI-rnbrao_Y497WMxB3avprG9Ol4L0Tqq4HwUqRhfaUyKApO9sBqcdnP-It1bu9SDkaVLexnEx4NfMlPcKQNl71tXxSbCb-LreLdNHykpM1klGQ4ew9635Me6jKbmpAojmCAutYm3wcDMSwI_PzBMjFSl5oExU",
    alt: "Word of Grace",
    badgeText: "7d left",
    badgeVariant: "neutral",
  },
  {
    id: "photo-3",
    title: "Entrance Welcome",
    albumKey: "today",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAA6CUTDOr5X3n8F-e_F0cJqew5VEqyyHMya9TKnQAwMuZn_zVtcV0Hj9ihs_Envm2w-YsoOUdHIFBcz7ck_7Z1ht6f9MNVCGZ1Q42Q_qkpBy_dFhMkWUrYq6SujUlI-hKfjQ_hyxBWdaDGH7l9zDyTs4FSpx8e9DWh5nECIme7RpRwCWccXbQtTd9C3tEnysQb9m-haPbjx5cdCzAQx6KFG7CVZT2P38ck21-RdPg",
    alt: "Ushers Welcoming",
    badgeText: "Today",
    badgeVariant: "today",
  },
  {
    id: "photo-4",
    title: "Deep Worship",
    albumKey: "today",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTvZCsHu5n9CXCQxokFEPH-kFxZuKSWA4NxVqqcZMbRowbmI9al38EslWFycK7B3Cvsx4PCD5z8IDMkNT5yOKi4WHHvCEK3nwc3REO7WUvz-Ox1_-rgHGYH8lgF0BXkB9-oTU4pipwQCCU3YwaKg1Ba3mcLg0dejrQXoCagAzF-LNz3PfWEpE7wU7zd73qP_HdIgjyyjC7LaNULEo8EooPIzwuTq6-DfgIAwipcmA",
    alt: "Worship Sanctuary",
    badgeText: "7d left",
    badgeVariant: "neutral",
  },
  {
    id: "photo-5",
    title: "Thanksgiving Joy",
    albumKey: "thanksgiving",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlsLk47Ls8c2ZlQtKkbITssCUhsCxc-KIurouC6QMfAvdV7yAYmO6F5vxBcFglGLsYKzXFepeMNOIdpBYGf1Pl53gME7frEKUo1j6I19pnSVw99H3moEPGZXYAYkGKlSYiyuh_0yjMQCdxEtO2jcJwYYAsblIccyxAZ7mzN1MvCfyEJyrxRCrHDFClmSiQwS2B_XpYr76_kvyIjqjhZoLKdv9SfXawKIiFW7DOVz4",
    alt: "Thanksgiving Joy",
    badgeText: "3d left",
    badgeVariant: "amber",
  },
  {
    id: "photo-6",
    title: "Children Recital",
    albumKey: "thanksgiving",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJZrhy2NPwmlgqzYQHh1VeWI2SSTDUoJuCL9NpZgiLKCfV-CMrCGG_TrZyx10SxOLiGfgHX54yvQCZL_mf2PeoqPU1Nohr9rzb4dOEmiP2VD61sCYMKvzcjVED2K6dD-Q3MsuRIR6pWAw4YTsTLT9T1PNB0Dsgruq9oDGO_SjL5LcPxtIhMdEcBvUhsXMF5T-HPj_4t1YMNTzfdD5CxdnsncNpAUeY4yxSXaDbED4",
    alt: "Kids Ministry",
    badgeText: "3d left",
    badgeVariant: "amber",
  },
  {
    id: "photo-7",
    title: "Courtyard Smiles",
    albumKey: "thanksgiving",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDUzDedsfSo8l-h9uud_0qc2UjaxWf6dsni4Rul7kQ4nwlBcDRfNE9q_4eP9wJvWaF4mHzMJYl6dfyzZj-8Q0ncdR5njBQsNqqhQXOX1mKBhQOiT0VfTVi32OJSzZya2xuWtUiDqXZTg8tn-QCXT5AHFbz_V7E7gV3IHxVymPC8_TVQYmXSY5KMMnF60ociY36K7PuI8Btq-tCQackHkyaRfBCjXolwdAO2hC6UI-g",
    alt: "Youth Fellowship",
    badgeText: "3d left",
    badgeVariant: "amber",
  },
  {
    id: "photo-8",
    title: "Solo Minister",
    albumKey: "choir",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBsdo8jVOaxFelJzxnfdC122VNSbFdbqErcIERjiA4-2t0okYmg34LNmVYCAxIUJffhwPpEUCET7nK3IaRzOHH4CcXisObdTphT9Qut3CDkkGQgJCCRcv7GBte7P79J9jxFkLxoIdlTE_Oo5B5xh7W88eusSS1zpUgn_ZeBsWBziBqAuXEF0qiy_i4g3oc3SwaDC4MT7JUHcxfIcZnQ_o7GWv4BF6rwa-bfzFEV38U",
    alt: "Choir Soloist",
    badgeText: "1d left",
    badgeVariant: "urgent",
  },
  {
    id: "photo-9",
    title: "Sanctuary Brass",
    albumKey: "choir",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUc_c72PpuvnKasxlubgUPacO1sZJ4UDnvu2pFu7-UiluslFnOmCrN7ALfPhAAsp1VhJb-T5nYr8O8wDf6khrryELhAmS5TdQt4UuC1vuYjmrkOI_StrDh2MFLHvZPKqRFZqgrJiBx-8xsP5rxYlMLnhsd5LNHz1iCnKy-e3TAIxN2-H4M5Bzb8odnOXUZFnRFxC8lmrswFPNJYlvlfLL3l2ZQcRiZYRq0z_3qUDM",
    alt: "Instrumentalists",
    badgeText: "1d left",
    badgeVariant: "urgent",
  },
];

export default function PhotosGalleryPage(): ReactElement {
  const [showBanner, setShowBanner] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "thanksgiving" | "choir">(
    "all",
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<GalleryPhotoItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useQuery(SERVICE_PHOTOS_QUERY, {
    variables: { albumKey: activeFilter },
  });

  const filteredPhotos = DEFAULT_GALLERY_ITEMS.filter(
    (item) => activeFilter === "all" || item.albumKey === activeFilter,
  );

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
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img
              alt="ChurchConnect Brand Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                ChurchConnect
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                Photos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full">
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
                42
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
              <span>Sunday 17 Nov</span>
              <span className="font-label-sm text-label-sm opacity-75">(18) · 7d left</span>
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
              <span className="font-label-sm text-label-sm opacity-75">(14) · 3d left</span>
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
              <span className="font-label-sm text-label-sm opacity-75">(10) · 1d left</span>
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

          {/* 3-Column Photo Grid */}
          <div className="px-margin mt-space-md">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
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
