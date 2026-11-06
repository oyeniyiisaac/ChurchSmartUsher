"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const USHER_DASHBOARD_QUERY = gql`
  query UsherDashboard {
    me {
      id
      fullName
      phone
      role
    }
    activeService {
      id
      name
      serviceType
      serviceDate
      startTime
      location
      usherStation
      status
    }
  }
`;

const SERVICE_QR_QUERY = gql`
  query ServiceQr($serviceId: ID!) {
    serviceQr(serviceId: $serviceId) {
      serviceId
      token
      checkinUrl
      slot
      expiresInSeconds
    }
  }
`;

const CLOSE_SERVICE_MUTATION = gql`
  mutation CloseUsherService($serviceId: ID!) {
    closeService(serviceId: $serviceId) {
      id
      status
      closedAt
    }
  }
`;

interface UsherDashboardData {
  me: {
    id: string;
    fullName: string;
    phone: string;
    role: "MEMBER" | "USHER" | "ADMIN";
  } | null;
  activeService: {
    id: string;
    name: string;
    serviceType: string;
    serviceDate: string;
    startTime: string;
    location: string;
    usherStation: string;
    status: "SCHEDULED" | "OPEN" | "CLOSED";
  } | null;
}

interface ServiceQrData {
  serviceQr: {
    serviceId: string;
    token: string;
    checkinUrl: string;
    slot: number;
    expiresInSeconds: number;
  };
}

export default function UsherPage(): ReactNode {
  const { data } = useQuery<UsherDashboardData>(USHER_DASHBOARD_QUERY, {
    fetchPolicy: "network-only",
  });
  const member = data?.me ?? null;
  const activeService = data?.activeService ?? null;
  const activeServiceId = activeService?.id ?? "65f000000000000000000100";

  const { data: qrData, refetch: refetchQr } = useQuery<ServiceQrData>(SERVICE_QR_QUERY, {
    variables: { serviceId: activeService?.id ?? "" },
    skip: !activeService?.id || (member?.role !== "USHER" && member?.role !== "ADMIN"),
    fetchPolicy: "network-only",
  });

  const [closeServiceMutation] = useMutation(CLOSE_SERVICE_MUTATION);

  const [timeLeft, setTimeLeft] = useState<number>(42);
  const [projectorOpen, setProjectorOpen] = useState<boolean>(false);
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);
  const [sessionClosed, setSessionClosed] = useState<boolean>(false);

  useEffect(() => {
    if (qrData?.serviceQr?.expiresInSeconds) {
      setTimeLeft(qrData.serviceQr.expiresInSeconds);
    }
  }, [qrData]);

  useEffect(() => {
    if (sessionClosed) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (activeService?.id) {
            void refetchQr();
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionClosed, activeService?.id, refetchQr]);

  const usherName = member?.fullName ?? "Brother Emmanuel Kalu";
  const usherInitials = usherName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const checkinHref = qrData?.serviceQr?.checkinUrl ?? `/checkin/${activeServiceId}?t=preview`;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Top Header (11._usher_show_qr_screen) */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin max-w-[600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Link
              aria-label="Go back"
              href="/dashboard"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <img
              alt="ChurchConnect Brand Logo"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
            />
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Usher Qr</h1>
          </div>
          <div className="flex items-center gap-2">
            {member && (
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                {member.role}
              </span>
            )}
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin pb-space-xl">
          {/* Operational Service Header */}
          <div className="flex flex-col gap-space-sm pt-space-md">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
                  Live Session
                </span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">
                  Door A · Main Auditorium
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProjectorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm transition-colors shadow-sm cursor-pointer"
                id="projectorToggle"
              >
                <span className="material-symbols-outlined text-[18px]">present_to_all</span>
                <span>Projector Mode</span>
              </button>
            </div>

            {/* Active Service & Counters Banner */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between flex-wrap gap-space-xs">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                    Sunday First Service
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Arrival &amp; Welcome Protocol
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-container/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container" />
                  <span className="font-label-lg text-label-lg text-tertiary font-bold">
                    312 Present
                  </span>
                </div>
              </div>

              {/* Breakdown Pill Metrics */}
              <div className="flex items-center justify-between pt-space-xs bg-surface-container-low rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    284 Members
                  </span>
                </div>
                <span className="text-outline-variant font-body-sm text-body-sm">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    person_add
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    28 Guests
                  </span>
                </div>
                <span className="text-outline-variant font-body-sm text-body-sm">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    speed
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    ~4 scans/min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Stage QR Card */}
          <div className="flex flex-col items-center mt-space-md" id="qrStageContainer">
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col items-center text-center">
              <div
                className={`flex items-center justify-center gap-2 mb-space-md px-3 py-1 rounded-full ${
                  sessionClosed
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
                <span className="font-label-sm text-label-sm font-semibold">
                  {sessionClosed ? "Session Closed" : `Code refreshes in ${timeLeft}s`}
                </span>
                {!sessionClosed && (
                  <div className="w-3 h-3 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
                )}
              </div>

              {/* High Contrast Giant QR Code Card (Stitch SVG) */}
              <div className="relative p-space-md bg-surface-container-lowest rounded-xl shadow-inner flex items-center justify-center">
                <svg
                  className="w-[250px] h-[250px] transition-transform duration-300"
                  fill="none"
                  id="qrSvg"
                  viewBox="0 0 240 240"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect fill="#FFFFFF" height="240" rx="8" width="240" />
                  <rect fill="#00236f" height="56" rx="8" width="56" x="16" y="16" />
                  <rect fill="#FFFFFF" height="40" rx="4" width="40" x="24" y="24" />
                  <rect fill="#00236f" height="24" rx="2" width="24" x="32" y="32" />
                  <rect fill="#00236f" height="56" rx="8" width="56" x="168" y="16" />
                  <rect fill="#FFFFFF" height="40" rx="4" width="40" x="176" y="24" />
                  <rect fill="#00236f" height="24" rx="2" width="24" x="184" y="32" />
                  <rect fill="#00236f" height="56" rx="8" width="56" x="16" y="168" />
                  <rect fill="#FFFFFF" height="40" rx="4" width="40" x="24" y="176" />
                  <rect fill="#00236f" height="24" rx="2" width="24" x="32" y="184" />
                  <g fill="#00236f">
                    <rect height="10" rx="1" width="10" x="88" y="20" />
                    <rect height="10" rx="1" width="10" x="106" y="20" />
                    <rect height="10" rx="1" width="10" x="124" y="20" />
                    <rect height="10" rx="1" width="10" x="142" y="28" />
                    <rect height="10" rx="1" width="10" x="88" y="38" />
                    <rect height="10" rx="1" width="10" x="124" y="38" />
                    <rect height="10" rx="1" width="10" x="106" y="54" />
                    <rect height="10" rx="1" width="10" x="142" y="54" />
                    <rect height="18" rx="2" width="18" x="88" y="88" />
                    <rect height="12" rx="1" width="12" x="114" y="88" />
                    <rect height="18" rx="2" width="18" x="134" y="88" />
                    <rect height="12" rx="1" width="12" x="160" y="88" />
                    <rect height="12" rx="1" width="12" x="20" y="88" />
                    <rect height="18" rx="2" width="18" x="40" y="88" />
                    <rect height="12" rx="1" width="12" x="66" y="88" />
                    <rect height="18" rx="2" width="18" x="20" y="114" />
                    <rect height="12" rx="1" width="12" x="46" y="114" />
                    <rect height="18" rx="2" width="18" x="66" y="114" />
                    <rect height="12" rx="1" width="12" x="92" y="114" />
                    <rect height="16" rx="2" width="16" x="112" y="114" />
                    <rect height="12" rx="1" width="12" x="136" y="114" />
                    <rect height="18" rx="2" width="18" x="156" y="114" />
                    <rect height="12" rx="1" width="12" x="182" y="114" />
                    <rect height="18" rx="2" width="18" x="202" y="114" />
                    <rect fill="#ffdcc3" height="24" rx="4" width="72" x="84" y="138" />
                    <path d="M112 150 L120 144 L128 150 L124 156 L116 156 Z" fill="#904d00" />
                    <rect height="16" rx="2" width="16" x="88" y="170" />
                    <rect height="12" rx="1" width="12" x="112" y="170" />
                    <rect height="18" rx="2" width="18" x="132" y="170" />
                    <rect height="12" rx="1" width="12" x="158" y="170" />
                    <rect height="18" rx="2" width="18" x="178" y="170" />
                    <rect height="16" rx="2" width="16" x="204" y="170" />
                    <rect height="12" rx="1" width="12" x="88" y="194" />
                    <rect height="18" rx="2" width="18" x="108" y="194" />
                    <rect height="12" rx="1" width="12" x="134" y="194" />
                    <rect height="18" rx="2" width="18" x="154" y="194" />
                    <rect height="12" rx="1" width="12" x="180" y="194" />
                    <rect height="20" rx="2" width="20" x="200" y="194" />
                    <circle cx="120" cy="120" fill="#fe932c" r="5" />
                  </g>
                </svg>
                <span className="absolute top-2 left-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
              </div>

              <div className="mt-space-md px-space-xs">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Scan this QR with your phone camera
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Instant check-in confirms your seat &amp; updates your fellowship streak
                </p>
              </div>

              <div className="mt-space-sm flex items-center justify-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  verified_user
                </span>
                <span className="font-label-sm text-label-sm">
                  Dynamic door-sync enabled · Anti-tamper token active
                </span>
              </div>

              <Link
                href={checkinHref}
                className="mt-space-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
                <span>Simulate Member QR Scan</span>
              </Link>
            </div>
          </div>

          {/* Operational Action Stack (Ushers) */}
          <div className="flex flex-col gap-space-sm mt-space-lg">
            <Link
              href="/services"
              className="h-12 w-full rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-between px-space-md shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[22px]">group</span>
                <span>Live Attendance List</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/20 font-label-sm text-label-sm font-semibold">
                312
              </span>
            </Link>

            <Link
              href="/services"
              className="h-12 w-full rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-between px-space-md shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  person_search
                </span>
                <span>Manual Search / Add Guest</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                arrow_forward
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setCloseModalOpen(true)}
              className="h-12 w-full rounded-lg bg-error-container/40 hover:bg-error-container text-on-error-container font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
              <span>Close Attendance Session</span>
            </button>
          </div>

          {/* Usher Identity Footer Card */}
          <div className="mt-space-lg bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-headline-sm text-headline-sm">
                {usherInitials}
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary font-semibold">
                  Usher On Duty
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  {usherName}
                </span>
              </div>
            </div>
            <span className="px-2 py-1 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant font-medium">
              Sanctuary Lead
            </span>
          </div>
        </div>

        {/* Projector Mode Fullscreen Overlay View */}
        {projectorOpen && (
          <div className="fixed inset-0 z-50 bg-surface-container-lowest flex flex-col items-center justify-between p-space-xl">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-3 rounded-full bg-tertiary-container animate-ping" />
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  SUNDAY FIRST SERVICE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProjectorOpen(false)}
                className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close_fullscreen</span>
                <span>Exit Projector</span>
              </button>
            </div>

            <div className="flex flex-col items-center text-center my-auto">
              <h1 className="font-display-lg text-display-lg text-primary font-bold mt-space-md">
                Scan Camera To Check In
              </h1>
              <p className="font-headline-sm text-headline-sm text-on-surface-variant mt-2 max-w-sm">
                Hold device toward screen · Door A Welcome Gate
              </p>
            </div>

            <div className="w-full flex items-center justify-around py-space-sm bg-surface-container rounded-xl">
              <div className="flex flex-col items-center">
                <span className="font-display-lg text-display-lg text-primary font-bold">312</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Total Present
                </span>
              </div>
              <div className="w-px h-10 bg-outline-variant" />
              <div className="flex flex-col items-center">
                <span className="font-headline-lg text-headline-lg text-tertiary font-bold">
                  284
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Members
                </span>
              </div>
              <div className="w-px h-10 bg-outline-variant" />
              <div className="flex flex-col items-center">
                <span className="font-headline-lg text-headline-lg text-secondary font-bold">
                  28
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  First-Time Guests
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Modal: Close Confirmation */}
        {closeModalOpen && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-margin">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm text-error">
                <span className="material-symbols-outlined text-[28px]">warning</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Close Attendance?
                </h3>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                This will invalidate the current gate QR code and finalize Door A check-ins for
                Sunday First Service. Remaining entries will require manual registry.
              </p>
              <div className="flex items-center justify-end gap-space-sm mt-space-xs">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer"
                >
                  Keep Active
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeService?.id) {
                      void closeServiceMutation({
                        variables: { serviceId: activeService.id },
                      });
                    }
                    setSessionClosed(true);
                    setCloseModalOpen(false);
                  }}
                  className="px-space-md py-2.5 rounded-lg bg-error hover:opacity-95 text-on-error font-label-md text-label-md cursor-pointer"
                >
                  Confirm Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
