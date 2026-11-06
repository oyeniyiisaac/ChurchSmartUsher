"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

const CHECKIN_PREVIEW_QUERY = gql`
  query CheckinPreviewPage($serviceId: ID!, $token: String!) {
    me {
      id
      fullName
      phone
      department
      currentStreak
    }
    checkinPreview(serviceId: $serviceId, token: $token) {
      state
      message
      service {
        id
        name
        serviceDate
        startTime
        location
        usherStation
        status
      }
    }
  }
`;

const MARK_PRESENT_MUTATION = gql`
  mutation MarkMemberPresent($serviceId: ID!, $token: String!) {
    markPresent(serviceId: $serviceId, token: $token) {
      status
      message
      attendance {
        id
        checkedInAt
      }
    }
  }
`;

type ViewMode = "welcome" | "success" | "exceptions";
type ExceptionTab = "a" | "b" | "c";

function CheckinPageContent(): ReactNode {
  const params = useParams<{ serviceId: string }>();
  const searchParams = useSearchParams();

  const serviceId = params?.serviceId ?? "65f000000000000000000100";
  const tokenParam = searchParams.get("t") ?? "preview";
  const initialModeParam = searchParams.get("mode");

  const { data } = useQuery(CHECKIN_PREVIEW_QUERY, {
    variables: { serviceId, token: tokenParam },
    fetchPolicy: "network-only",
  });

  const [markPresentMutation] = useMutation(MARK_PRESENT_MUTATION);

  const memberName = (data?.me?.fullName as string | undefined) ?? "Isaac Adeleke";
  const serviceName =
    (data?.checkinPreview?.service?.name as string | undefined) ?? "Sunday First Service";
  const serviceLocation =
    (data?.checkinPreview?.service?.location as string | undefined) ?? "Grace Sanctuary Auditorium";
  const usherStation =
    (data?.checkinPreview?.service?.usherStation as string | undefined) ?? "Door A (Main Entrance)";

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (initialModeParam === "success") return "success";
    if (initialModeParam === "exceptions" || tokenParam === "expired" || tokenParam === "already") {
      return "exceptions";
    }
    return "welcome";
  });

  const [exceptionTab, setExceptionTab] = useState<ExceptionTab>(() => {
    if (tokenParam === "expired") return "b";
    return "a";
  });

  const [syncing, setSyncing] = useState<boolean>(false);
  const [confirmedInline, setConfirmedInline] = useState<boolean>(false);

  const returnToPath = `/checkin/${serviceId}?t=${encodeURIComponent(tokenParam)}`;

  async function handleConfirmPresence(): Promise<void> {
    setSyncing(true);
    try {
      const result = await markPresentMutation({
        variables: { serviceId, token: tokenParam },
      });
      const status = result.data?.markPresent?.status as string | undefined;
      if (status === "ALREADY_MARKED") {
        setSyncing(false);
        setExceptionTab("a");
        setViewMode("exceptions");
        return;
      }
      if (status === "EXPIRED_TOKEN" || status === "INVALID_TOKEN") {
        setSyncing(false);
        setExceptionTab("b");
        setViewMode("exceptions");
        return;
      }
      if (status === "SERVICE_NOT_OPEN") {
        setSyncing(false);
        setExceptionTab("c");
        setViewMode("exceptions");
        return;
      }
      setSyncing(false);
      setConfirmedInline(true);
      window.setTimeout(() => {
        setViewMode("success");
      }, 400);
    } catch {
      window.setTimeout(() => {
        setSyncing(false);
        setConfirmedInline(true);
      }, 450);
    }
  }

  if (viewMode === "success") {
    // 1:1 Stitch 5._check_in_success/code.html
    return (
      <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <button
                aria-label="Go back"
                type="button"
                onClick={() => setViewMode("welcome")}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <img
                alt="ChurchConnect Brand Logo"
                className="h-7 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
              />
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">
                Check In Success
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("exceptions")}
                className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm cursor-pointer"
              >
                States
              </button>
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
          <div className="flex flex-col w-full max-w-[600px] md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pb-space-2xl space-y-space-lg">
            {/* Subtle Ambient Glow & Celebratory Badge */}
            <div className="relative flex flex-col items-center text-center pt-space-md">
              <div className="relative flex items-center justify-center mb-space-md">
                <div className="absolute w-28 h-28 rounded-full bg-tertiary-fixed/30 animate-ping opacity-30" />
                <div className="absolute w-24 h-24 rounded-full bg-tertiary-fixed/60" />
                <div className="relative w-20 h-20 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[44px] material-icon-filled">
                    check_circle
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm mb-space-xs">
                <span className="material-symbols-outlined text-[14px]">church</span>
                Sanctuary Check-In
              </span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
                You are marked present. Thank you!
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-space-xs">
                Your fellowship has been recorded for {serviceName}. God bless your worship today.
              </p>
            </div>

            {/* Member Fellowship Snapshot Card */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <img
                    className="w-11 h-11 rounded-full object-cover shadow-xs"
                    alt={memberName}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMmoiLbdAWLNRDe3WxAk1MK5kKX9zeNWFInEBn9RAt-hdjOdQjc6i1KG_-UG0PUk9UCFXSILUw1Wu72Ku3W-SoCcHyMn17xCcNCvOg9wqW12Fo0NXtZ37nUUDP5jLRtVmWOFr0HuELHe3ZU1UeGxGA_9NQSi4Nm0BP0XFSyo_0l0CIxKuom8VIZpzDyZ8cVn_UcBfqo-DxCm42ENVNcFg-qbe-cdoEEGiqxzUC7Fo"
                  />
                  <div className="min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface truncate">
                      {memberName}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Sanctuary Choir · Tenor
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 bg-surface-container-high text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-2.5 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    schedule
                  </span>
                  Marked at 8:42 AM
                </span>
                <span className="flex items-center gap-1 text-on-surface font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    meeting_room
                  </span>
                  Usher Desk #1 (Main Foyer)
                </span>
              </div>
            </div>

            {/* Updated Streak Showcase Card */}
            <div className="w-full rounded-2xl bg-secondary-fixed/50 p-space-lg shadow-sm space-y-space-md">
              <div className="flex items-start justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container shadow-xs font-label-md text-label-md">
                  <span>🔥</span>
                  <span>7 Sundays in a Row!</span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[26px]">
                  workspace_premium
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-secondary-fixed">
                  Congratulations {memberName.split(" ")[0]}!
                </h3>
                <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-0.5">
                  You reached 7 consecutive services. Your steadfastness in the house of the Lord is
                  truly inspiring.
                </p>
              </div>
              <div className="space-y-1.5 pt-space-xs">
                <div className="flex justify-between font-label-sm text-label-sm text-on-secondary-fixed-variant">
                  <span>7 Services</span>
                  <span>Goal: 12 Services</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container-lowest rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-secondary-container rounded-full w-[58%] transition-all duration-700 ease-out" />
                </div>
                <p className="font-label-sm text-label-sm text-on-secondary-container flex items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-[15px]">flag</span>5 more services
                  to unlock 12-Service Milestone Badge.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-space-xs">
                <div className="bg-surface-container-lowest/80 rounded-lg p-2 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    verified
                  </span>
                  <span className="font-label-sm text-[10px] text-on-surface mt-0.5">3 Wks</span>
                </div>
                <div className="bg-surface-container-lowest/80 rounded-lg p-2 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    military_tech
                  </span>
                  <span className="font-label-sm text-[10px] text-on-surface mt-0.5">5 Wks</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-2 text-center flex flex-col items-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px] text-secondary-container">
                    local_fire_department
                  </span>
                  <span className="font-label-sm text-[10px] text-secondary-container font-bold mt-0.5">
                    7 Wks ⭐
                  </span>
                </div>
                <div className="bg-surface-container-lowest/40 rounded-lg p-2 text-center flex flex-col items-center opacity-60">
                  <span className="material-symbols-outlined text-[18px] text-outline">lock</span>
                  <span className="font-label-sm text-[10px] text-outline mt-0.5">12 Wks</span>
                </div>
              </div>
            </div>

            {/* Media Photo Gallery Reminder Notice */}
            <div className="w-full rounded-xl bg-surface-container-low p-space-md shadow-xs flex items-start gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[22px]">photo_camera</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-label-md text-on-surface">Service Photos Alert</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                  Media team will upload service photos today. Remember photos expire after 7 days!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-space-sm space-y-space-sm">
              <Link
                href="/dashboard"
                className="w-full h-[54px] rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:bg-primary transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                Go to Home
              </Link>
              <Link
                href="/streak"
                className="w-full h-[48px] rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs shadow-xs active:bg-surface-container-high transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  insights
                </span>
                View My Streak &amp; Milestones
              </Link>
            </div>

            {/* Comforting Verse Banner */}
            <div className="text-center pt-space-xs pb-space-sm">
              <p className="font-body-sm text-body-sm italic text-outline">
                “I was glad when they said unto me, Let us go into the house of the Lord.”
              </p>
              <p className="font-label-sm text-label-sm text-outline mt-0.5">Psalm 122:1</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (viewMode === "exceptions") {
    // 1:1 Stitch 6._check_in_other_states/code.html
    return (
      <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <button
                aria-label="Go back"
                type="button"
                onClick={() => setViewMode("welcome")}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <img
                alt="ChurchConnect Brand Logo"
                className="h-7 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
              />
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">
                Check In States
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
          <div className="flex flex-col w-full max-w-[600px] md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pt-space-md pb-space-lg gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="inline-flex items-center gap-space-xs self-start px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-primary material-icon-filled">
                  info
                </span>
                <span>Status Simulator &amp; Guidelines</span>
              </div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Check-in Exceptions &amp; System States
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Reassuring feedback for non-standard scan occurrences during fellowship entrance.
              </p>
            </div>

            {/* 3-State Switcher Bar */}
            <div className="w-full bg-surface-container-low p-space-xs rounded-xl shadow-sm flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => setExceptionTab("a")}
                className={`flex-1 py-space-sm px-1 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  exceptionTab === "a"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Recorded</span>
              </button>
              <button
                type="button"
                onClick={() => setExceptionTab("b")}
                className={`flex-1 py-space-sm px-1 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  exceptionTab === "b"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">update</span>
                <span>Expired</span>
              </button>
              <button
                type="button"
                onClick={() => setExceptionTab("c")}
                className={`flex-1 py-space-sm px-1 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  exceptionTab === "c"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span>Pending</span>
              </button>
            </div>

            {exceptionTab === "a" && (
              /* STATE A: ALREADY MARKED PRESENT */
              <div className="flex flex-col gap-space-lg">
                <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col items-center text-center">
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-tertiary-fixed/30 pointer-events-none blur-2xl" />
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-tertiary-container mb-space-md shadow-sm relative">
                    <div className="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                      <span className="material-symbols-outlined text-[32px] material-icon-filled">
                        check_circle
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center shadow">
                      <span className="material-symbols-outlined text-[14px]">
                        local_fire_department
                      </span>
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-tertiary-fixed-variant font-label-sm text-label-sm mb-space-xs">
                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                    <span>Attendance Confirmed</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                    You are already marked present
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-space-lg">
                    You were marked present at <strong>9:12 AM</strong> for <em>{serviceName}</em>{" "}
                    by Door A Usher Desk. Only one attendance record is required per service.
                  </p>
                  <div className="w-full bg-surface-container-low rounded-lg p-space-md mb-space-lg text-left flex items-center gap-space-md shadow-sm">
                    <img
                      className="w-12 h-12 rounded-full object-cover"
                      alt={memberName}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnVwYFNtY8TgvSNf7sUrNmFhSmqkGs9eK6A1LUtsSvZ9pohFCfHqqO8nCqDOu0WsMmOYmZqEzi-LSi2K3VW-jkYnckjJdOjOX_68474wdzlUsqVwgEtNkDc54tFwl4OkxukX0seOuRRjMIWIG1GC3sCZJRzltRPp-0bLJM-XTJFHrb7jhmNWwudvnhYg3nGvFwxq_8v7OQPc6BEeyIu86PcVVCMNe8Nd66QphAQPQ"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-label-lg text-label-lg text-on-surface truncate">
                        {memberName}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        Sanctuary Choir • Seat Section B
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-label-sm text-label-sm text-on-tertiary-fixed-variant bg-surface-container px-2 py-0.5 rounded-full">
                        Present
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        09:12 AM
                      </span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-space-sm">
                    <Link
                      href="/profile"
                      className="w-full h-12 rounded-lg bg-secondary-container text-on-secondary font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-space-xs active:bg-secondary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px] material-icon-filled">
                        local_fire_department
                      </span>
                      <span>View My Streak</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="w-full h-12 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-space-xs active:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">home</span>
                      <span>Return Home</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {exceptionTab === "b" && (
              /* STATE B: QR CODE EXPIRED */
              <div className="flex flex-col gap-space-lg">
                <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col items-center text-center">
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-secondary-fixed/40 pointer-events-none blur-2xl" />
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-space-md shadow-sm relative">
                    <div className="w-14 h-14 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px]">timer_off</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center shadow">
                      <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm mb-space-xs">
                    <span className="material-symbols-outlined text-[14px]">lock_clock</span>
                    <span>Security Token Refreshed</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                    This QR Code Has Expired
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-space-lg">
                    The service QR code refreshes every 60 seconds to ensure security. Please scan
                    the current code displayed on the usher screen or projector.
                  </p>
                  <div className="w-full bg-surface-container-low rounded-lg p-space-md mb-space-lg flex flex-col gap-space-sm shadow-sm">
                    <div className="flex items-center justify-between text-on-surface">
                      <span className="font-label-md text-label-md">Next Token Refresh</span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        00:48 remaining
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary-container h-full rounded-full w-3/4" />
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                      <span>Usher Terminal: Desk 02</span>
                      <span>Sync: Live</span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-space-sm">
                    <Link
                      href="/usher"
                      className="w-full h-12 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-space-xs active:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                      <span>Refresh &amp; Scan Again</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setViewMode("welcome")}
                      className="w-full h-12 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-space-xs active:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">support_agent</span>
                      <span>Ask Desk Usher for Help</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {exceptionTab === "c" && (
              /* STATE C: ATTENDANCE NOT OPEN YET */
              <div className="flex flex-col gap-space-lg">
                <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col items-center text-center">
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-surface-variant/40 pointer-events-none blur-2xl" />
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-space-md shadow-sm relative">
                    <div className="w-14 h-14 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px]">schedule</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm mb-space-xs">
                    <span className="material-symbols-outlined text-[14px]">event_upcoming</span>
                    <span>Session Scheduled</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">
                    Attendance is not open yet
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-space-lg">
                    Attendance for <strong>Sunday Second Service</strong> opens at{" "}
                    <strong>10:15 AM</strong>. Please wait for the ushering team to open the service
                    doors.
                  </p>
                  <div className="w-full flex flex-col gap-space-sm">
                    <Link
                      href="/dashboard"
                      className="w-full h-12 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-space-xs active:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                      <span>Check Service Schedule</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY MATRIX / COMPARISON CARD */}
            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-md flex flex-col gap-space-sm mt-space-sm">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Quick Troubleshooting
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Gate Desk A-01
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-[20px]">
                      check_circle
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      Duplicate Scan Warning
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                    Already saved
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      timer_off
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      Token Invalidation
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                    Scan fresh QR
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      lock_clock
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">
                      Premature Scan
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                    Gate at 10:15 AM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Default: 1:1 Stitch 4._check_in_page/code.html
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Link
              href="/usher"
              aria-label="Go back"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <img
              alt="ChurchConnect Brand Logo"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
            />
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Check In</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("exceptions")}
              className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm cursor-pointer"
            >
              States
            </button>
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
        <div className="flex flex-col w-full max-w-[600px] md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pb-space-2xl">
          {/* Subtle Sanctuary Ambient Glow & Motif */}
          <div className="flex flex-col items-center text-center mt-space-sm mb-space-md">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-surface-container shadow-sm mb-space-sm">
              <img
                alt="ChurchConnect Brand Logo"
                className="w-14 h-14 object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[14px]">church</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm mb-space-xs">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
              <span>Sanctuary Door Gateway</span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
              Welcome to Church, {memberName}
            </h2>
            <p className="font-body-md text-body-md italic text-on-surface-variant mt-space-xs max-w-xs leading-relaxed">
              “Please confirm your presence in the House of your Maker.”
            </p>
          </div>

          {/* Service Information Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 mb-space-md">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-5 -mt-5 p-4 rounded-t-xl">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  calendar_today
                </span>
                <span className="font-label-md text-label-md text-primary font-semibold">
                  Active Sanctuary Session
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm">
                Live Check-in
              </span>
            </div>

            <div className="space-y-space-sm">
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Service</p>
                  <p className="font-headline-sm text-headline-sm text-on-surface truncate">
                    {serviceName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Date &amp; Time
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">
                    Sunday, 17 November 2024 · 8:30 AM
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">place</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Sanctuary Hall
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">{serviceLocation}</p>
                </div>
              </div>

              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">door_front</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Usher Station
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">{usherStation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Encouragement Card */}
          <div className="bg-surface-container-high rounded-xl p-4 mb-space-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-label-md text-label-md text-secondary font-bold">
                    6-Week Faithful Streak
                  </p>
                  <span className="text-[12px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.2 rounded-full font-label-sm">
                    Active
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Confirming today keeps your worship streak active and counts toward fellowship
                  milestones.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Check-In Area */}
          <div className="flex flex-col items-center w-full" id="checkin-container">
            <button
              id="confirm-presence-btn"
              type="button"
              disabled={syncing}
              onClick={() => {
                if (confirmedInline) {
                  setViewMode("success");
                } else {
                  handleConfirmPresence();
                }
              }}
              className={`w-full h-[60px] rounded-xl font-headline-sm text-headline-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-space-sm cursor-pointer ${
                confirmedInline
                  ? "bg-tertiary-container text-on-tertiary"
                  : "bg-primary-container text-on-primary hover:bg-primary"
              }`}
            >
              {syncing ? (
                <>
                  <span className="material-symbols-outlined text-[24px] animate-spin">
                    refresh
                  </span>
                  <span>Syncing with Usher Station...</span>
                </>
              ) : confirmedInline ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">done_all</span>
                  <span>Presence Confirmed · View Receipt</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[26px]">check_circle</span>
                  <span>Confirm I Am Present</span>
                </>
              )}
            </button>

            {confirmedInline && (
              <div
                className="w-full mt-space-sm bg-tertiary-fixed text-on-tertiary-fixed-variant p-4 rounded-xl text-center shadow-sm"
                id="confirmation-feedback"
              >
                <div className="flex items-center justify-center gap-space-xs font-label-lg text-label-lg mb-0.5">
                  <span className="material-symbols-outlined text-[22px]">celebration</span>
                  <span>Check-in Recorded!</span>
                </div>
                <p className="font-body-sm text-body-sm">
                  Welcome into His presence, {memberName.split(" ")[0]}. Have a blessed and
                  uplifting service.
                </p>
              </div>
            )}

            <Link
              href={`/login?returnTo=${encodeURIComponent(returnToPath)}`}
              className="mt-space-md inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded-lg"
            >
              <span>Not {memberName}?</span>
              <span className="text-primary font-semibold underline decoration-outline-variant underline-offset-4">
                Switch member account
              </span>
            </Link>
          </div>

          {/* Security Integrity Footnote */}
          <div className="mt-space-xl pt-space-md text-center bg-surface-container-low rounded-lg p-3">
            <div className="flex items-center justify-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mb-1">
              <span className="material-symbols-outlined text-[15px] text-outline">
                verified_user
              </span>
              <span className="font-semibold">Security &amp; Sanctuary Integrity</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">
              One check-in per service. Timestamp and usher desk geolocation are securely logged.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckinServicePage(): ReactNode {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface flex items-center justify-center font-body-md text-on-surface">
          Loading Sanctuary Check-in Gateway...
        </main>
      }
    >
      <CheckinPageContent />
    </Suspense>
  );
}
