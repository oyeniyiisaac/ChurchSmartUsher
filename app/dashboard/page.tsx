"use client";

import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { hasAdminAccess, hasPhotoUploadAccess, hasUsherAccess } from "@/auth/permissions";
import { QrScannerModal } from "@/components/QrScannerModal";

const DASHBOARD_QUERY = gql`
  query DashboardData {
    me {
      id
      fullName
      phone
      avatarUrl
      role
      department
      activities
      status
      currentStreak
      longestStreak
      consentGivenAt
    }
    activeService {
      id
      name
      serviceTag
      sermonTopic
      serviceType
      serviceDate
      startTime
      location
      status
    }
    servicePhotos {
      id
      title
      albumTitle
      imageUrl
      mediaType
      daysLeftLabel
    }
  }
`;

const ADMIN_CHECK_QUERY = gql`
  query AdminOnlyCheckFromDashboard {
    adminOnlyCheck
  }
`;

const LOGOUT_MUTATION = gql`
  mutation LogoutFromDashboard {
    logout
  }
`;

interface DashboardQueryData {
  me: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string | null;
    role: "MEMBER" | "USHER" | "ADMIN";
    department?: string | null;
    activities?: string[] | null;
    status: string;
    currentStreak: number;
    longestStreak: number;
    consentGivenAt: string;
  } | null;
  activeService: {
    id: string;
    name: string;
    serviceTag?: string | null;
    sermonTopic?: string | null;
    serviceType: string;
    serviceDate: string;
    startTime: string;
    location: string;
    status: string;
  } | null;
  servicePhotos: Array<{
    id: string;
    title: string;
    albumTitle: string;
    imageUrl: string;
    daysLeftLabel: string;
  }>;
}

export default function DashboardPage(): ReactNode {
  const router = useRouter();
  const { data, loading, client } = useQuery<DashboardQueryData>(DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });
  const [runAdminCheck] = useLazyQuery<{ adminOnlyCheck: string }>(ADMIN_CHECK_QUERY, {
    fetchPolicy: "network-only",
  });
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [adminCheckMessage, setAdminCheckMessage] = useState<string | null>(null);
  const [adminCheckError, setAdminCheckError] = useState<boolean>(false);

  const member = data?.me ?? null;
  const activeService = data?.activeService ?? null;
  const photos = data?.servicePhotos ?? [];

  const firstName = member?.fullName ? member.fullName.split(" ")[0] : "Member";
  const initials = member?.fullName
    ? member.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JH";

  const currentStreak = member?.currentStreak ?? 0;
  const longestStreak = member?.longestStreak ?? 0;
  const pacePercent = Math.min(100, Math.round((currentStreak / 4) * 100));

  async function handleTestAdminGuard(): Promise<void> {
    setAdminCheckMessage(null);
    setAdminCheckError(false);
    const res = await runAdminCheck();
    if (res.error) {
      setAdminCheckError(true);
      setAdminCheckMessage(res.error.message);
    } else if (res.data?.adminOnlyCheck) {
      setAdminCheckError(false);
      setAdminCheckMessage(res.data.adminOnlyCheck);
    }
  }

  async function handleSignOut(): Promise<void> {
    await logoutMutation();
    await client.resetStore();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Fixed Top Header (3._member_home) */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img
              alt="RCCG JESUS HOUSE, OGBOMOSHO Logo"
              className="h-8 w-8 object-contain"
              src="/rccg-logo.png"
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                RCCG JESUS HOUSE, OGBOMOSHO
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                Home
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            {member ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="h-9 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1 shadow-sm"
              >
                <span>Sign In</span>
              </Link>
            )}
            <button
              aria-label="Notifications"
              type="button"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
            <Link
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center"
              href="/profile"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-surface-container"
                src={member?.avatarUrl || "/rccg-logo.png"}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-space-lg pb-space-xl">
          {/* Greeting Header Banner */}
          <div className="pt-space-sm flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-lg-mobile md:text-3xl text-headline-lg-mobile text-on-surface tracking-tight">
                  Welcome, {firstName}
                </h1>
                <span aria-hidden="true" className="text-[24px] select-none">
                  🙏
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary">church</span>
                <p className="font-body-sm text-body-sm font-medium">
                  RCCG JESUS HOUSE, OGBOMOSHO
                  {member ? ` · ${member.role}` : loading ? " · Loading..." : ""}
                </p>
              </div>
            </div>
            <div className="relative shrink-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md shadow-sm">
                {initials}
              </span>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary-fixed-dim ring-2 ring-surface" />
            </div>
          </div>

          {/* Responsive Bento Grid (1 col on mobile, 12 cols on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Primary Next Service Focus Card */}
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md sm:p-6 flex flex-col space-y-space-md relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-secondary-container/10 pointer-events-none blur-2xl" />
                <div className="flex items-center justify-between gap-space-sm flex-wrap">
                  <div className="inline-flex items-center gap-1.5 bg-tertiary-container/10 text-on-tertiary-fixed-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                    <span>
                      {activeService?.status === "OPEN"
                        ? "Attendance Open Now"
                        : (activeService?.status ?? "Ready for Service")}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">
                    Sanctuary Gate
                  </span>
                </div>
                <div>
                  {activeService?.serviceTag && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                      <span>{activeService.serviceTag}</span>
                    </span>
                  )}
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    {activeService?.name ?? "Sunday Worship Service"}
                  </h2>
                  {activeService?.sermonTopic && (
                    <p className="font-body-sm text-body-sm text-primary font-semibold mt-0.5">
                      Sermon Topic: “{activeService.sermonTopic}”
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      schedule
                    </span>
                    <p className="font-body-sm text-body-sm">
                      {activeService
                        ? `${activeService.serviceDate} · ${activeService.startTime}`
                        : "Schedule in Admin Services"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      location_on
                    </span>
                    <p className="font-body-sm text-body-sm">
                      {activeService?.location ?? "RCCG JESUS HOUSE, OGBOMOSHO Auditorium"}
                    </p>
                  </div>
                </div>

                {/* Check-in Visual Guide Box */}
                <div className="bg-secondary-fixed/30 rounded-lg p-space-sm flex items-start gap-space-sm">
                  <div className="p-2 rounded-lg bg-surface-container-lowest text-secondary shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-label-md text-label-md text-on-secondary-fixed font-semibold">
                      Entrance Scanner Ready
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                      Point your phone camera at the rotating QR display on the ushering desk to
                      verify check-in.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCameraModalOpen(true)}
                    className="flex-1 h-12 bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 active:bg-primary transition-colors shadow-sm cursor-pointer px-4"
                    id="openCameraBtn"
                  >
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <span>Open Camera to Scan Church QR</span>
                  </button>
                  <Link
                    href={`/checkin/${activeService?.id ?? "65f000000000000000000100"}?t=preview`}
                    className="h-12 px-4 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>Quick Check-In</span>
                  </Link>
                </div>
              </div>

              {/* Role Authorization Verification Card */}
              <div className="w-full bg-surface-container-low rounded-xl p-space-md sm:p-5 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      security
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Role Access &amp; Unit Clearance
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm">
                      {member?.role ?? "MEMBER"} · {member?.department || "General Member"}
                    </span>
                    {hasUsherAccess(member) && (
                      <>
                        <Link
                          href="/usher"
                          className="font-label-sm text-label-sm text-primary hover:underline"
                        >
                          Usher QR
                        </Link>
                        <span className="text-outline">·</span>
                        <Link
                          href="/usher/live"
                          className="font-label-sm text-label-sm text-primary hover:underline"
                        >
                          Live Roster
                        </Link>
                      </>
                    )}
                    {hasPhotoUploadAccess(member) && (
                      <>
                        <span className="text-outline">·</span>
                        <Link
                          href="/admin/photos"
                          className="font-label-sm text-label-sm text-primary font-semibold hover:underline"
                        >
                          Media Photo Upload
                        </Link>
                      </>
                    )}
                    {hasAdminAccess(member) && (
                      <>
                        <span className="text-outline">·</span>
                        <Link
                          href="/admin"
                          className="font-label-sm text-label-sm text-primary hover:underline"
                        >
                          Admin
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                {hasPhotoUploadAccess(member) && !hasAdminAccess(member) && (
                  <Link
                    href="/admin/photos"
                    className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add_photo_alternate
                    </span>
                    <span>Media Unit: Upload Service Photos</span>
                  </Link>
                )}
                {hasAdminAccess(member) && (
                  <button
                    type="button"
                    onClick={() => void handleTestAdminGuard()}
                    className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      admin_panel_settings
                    </span>
                    <span>Verify Admin Clearance (adminOnlyCheck)</span>
                  </button>
                )}
                {adminCheckMessage && (
                  <div
                    className={`rounded-lg px-3 py-2 font-body-sm text-body-sm ${
                      adminCheckError
                        ? "bg-error-container text-on-error-container"
                        : "bg-tertiary-fixed/50 text-on-tertiary-fixed-variant"
                    }`}
                    role="status"
                  >
                    {adminCheckMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Fidelity & Streak Bento Card */}
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md sm:p-6 flex flex-col space-y-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[22px] material-icon-filled">
                        local_fire_department
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {currentStreak} {currentStreak === 1 ? "Sunday" : "Sundays"} in a row
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-medium">
                        Faithful Worshipper Level
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary-container text-[28px] material-icon-filled">
                    military_tech
                  </span>
                </div>

                <div className="px-space-sm py-2 rounded-md bg-surface-container text-on-surface">
                  <p className="font-body-sm text-body-sm italic text-center">
                    “Consistent in fellowship, prayer, and uplifting worship.”
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
                    <span className="font-headline-md text-headline-md font-bold text-primary">
                      {currentStreak}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
                      Current Streak
                    </span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
                    <span className="font-headline-md text-headline-md font-bold text-secondary">
                      {longestStreak}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
                      Best Streak
                    </span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
                    <span className="font-headline-md text-headline-md font-bold text-tertiary-container">
                      {Math.min(4, currentStreak)}/4
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
                      This Month
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-on-surface">
                    <span className="font-label-md text-label-md font-medium">
                      Monthly Attendance Pace
                    </span>
                    <span className="font-label-md text-label-md text-secondary font-bold">
                      {pacePercent}% Consistency
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-secondary-container rounded-full transition-all duration-500"
                      style={{ width: `${pacePercent}%` }}
                    />
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-right">
                    {Math.max(0, 4 - currentStreak)} more service(s) to achieve Perfect Month badge
                  </p>
                </div>
              </div>

              {/* Weekly Congregation Photo Roll Preview (from Cloudinary + MongoDB) */}
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md sm:p-6 flex flex-col space-y-space-sm">
                <div className="flex items-start justify-between gap-space-xs">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Service Photos &amp; Videos
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Cloudinary 7-day parish captures &amp; video highlights
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-secondary-fixed text-on-secondary-fixed px-2.5 py-1 rounded-full font-label-sm text-label-sm self-start">
                  <span className="material-symbols-outlined text-[14px]">auto_delete</span>
                  <span>Auto-deleted after 7 days</span>
                </div>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {photos.slice(0, 3).map((p, idx) => {
                      const isVid =
                        (p as { mediaType?: string }).mediaType === "VIDEO" ||
                        /\.(mp4|webm|mov|m4v|ogg)$/i.test(p.imageUrl);
                      return (
                        <Link
                          key={p.id}
                          href={`/photos/${p.id}`}
                          className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high shadow-sm block group"
                        >
                          {isVid ? (
                            <div className="w-full h-full relative bg-inverse-surface/90 flex items-center justify-center">
                              <video
                                src={p.imageUrl}
                                preload="metadata"
                                className="w-full h-full object-cover opacity-85"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-7 h-7 rounded-full bg-primary/90 text-on-primary flex items-center justify-center shadow-sm">
                                  <span className="material-symbols-outlined text-[16px]">
                                    play_arrow
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              alt={p.title}
                              src={p.imageUrl}
                            />
                          )}
                          {idx === 2 && photos.length > 3 && (
                            <div className="absolute inset-0 bg-primary/60 flex items-center justify-center backdrop-blur-xs">
                              <span className="font-label-lg text-label-lg text-on-primary font-bold">
                                +{photos.length - 3}
                              </span>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg bg-surface-container-low p-4 text-center text-on-surface-variant font-body-sm text-body-sm">
                    No service photos or videos uploaded yet. Media uploaded to Cloudinary will
                    appear here for all church members.
                  </div>
                )}
                <Link
                  className="inline-flex items-center justify-between pt-2 text-primary font-label-lg text-label-lg hover:underline"
                  href="/photos"
                >
                  <span>View all photos &amp; videos ({photos.length})</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Live Camera QR Scanner Modal */}
        <QrScannerModal
          open={cameraModalOpen}
          onClose={() => setCameraModalOpen(false)}
          fallbackCheckinPath={`/checkin/${activeService?.id ?? "65f000000000000000000100"}?t=preview`}
          activeServiceName={activeService?.name}
          activeServiceTag={activeService?.serviceTag ?? undefined}
          activeSermonTopic={activeService?.sermonTopic ?? undefined}
        />
      </main>

      {/* Stitch Persistent 4-Slot Member Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex justify-around items-center h-16 max-w-[600px] mx-auto px-space-xs">
          <Link
            aria-current="page"
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors text-primary-container font-semibold"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px] material-icon-filled">home</span>
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
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
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
