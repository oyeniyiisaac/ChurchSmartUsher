"use client";

import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const ME_QUERY = gql`
  query MeDashboard {
    me {
      id
      fullName
      phone
      role
      status
      consentGivenAt
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

interface MeQueryData {
  me: {
    id: string;
    fullName: string;
    phone: string;
    role: "MEMBER" | "USHER" | "ADMIN";
    status: string;
    consentGivenAt: string;
  } | null;
}

export default function DashboardPage(): ReactNode {
  const router = useRouter();
  const { data, loading, client } = useQuery<MeQueryData>(ME_QUERY, {
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
  const firstName = member?.fullName ? member.fullName.split(" ")[0] : "Isaac";
  const initials = member?.fullName
    ? member.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "IA";

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
        <div className="h-16 px-margin max-w-[600px] mx-auto flex items-center justify-between">
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
              href="/dashboard"
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
        <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin space-y-space-lg pb-space-xl">
          {/* Greeting Header Banner */}
          <div className="pt-space-sm flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
                  Good morning, {firstName}
                </h1>
                <span aria-hidden="true" className="text-[24px] select-none">
                  🙏
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary">church</span>
                <p className="font-body-sm text-body-sm font-medium">
                  Grace Sanctuary Parish · Lagos
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

          {/* Primary Next Service Focus Card */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col space-y-space-md relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-secondary-container/10 pointer-events-none blur-2xl" />
            <div className="flex items-center justify-between gap-space-sm">
              <div className="inline-flex items-center gap-1.5 bg-tertiary-container/10 text-on-tertiary-fixed-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                <span>Attendance Open Now</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">
                Sanctuary Gate
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Sunday First Service
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                <p className="font-body-sm text-body-sm">Today, 8:00 AM – 10:30 AM</p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  location_on
                </span>
                <p className="font-body-sm text-body-sm">Main Auditorium, Ground Level</p>
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
                  Point your phone camera at the rotating QR display on the ushering desk to verify
                  check-in.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCameraModalOpen(true)}
              className="w-full h-12 bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 active:bg-primary transition-colors shadow-sm cursor-pointer"
              id="openCameraBtn"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <span>Open Camera to Scan Church QR</span>
            </button>
          </div>

          {/* Fidelity & Streak Bento Card */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px] material-icon-filled">
                    local_fire_department
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    6 Sundays in a row
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
                <span className="font-headline-md text-headline-md font-bold text-primary">6</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
                  Current Streak
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
                <span className="font-headline-md text-headline-md font-bold text-secondary">
                  14
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
                  Best Streak
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
                <span className="font-headline-md text-headline-md font-bold text-tertiary-container">
                  3/4
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
                  75% Consistency
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full bg-secondary-container rounded-full transition-all duration-500"
                  style={{ width: "75%" }}
                />
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant text-right">
                1 more service to achieve Perfect Month badge
              </p>
            </div>
          </div>

          {/* Weekly Congregation Photo Roll Preview */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col space-y-space-sm">
            <div className="flex items-start justify-between gap-space-xs">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Thanksgiving &amp; Praise Service
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Parish gallery captures from last Sunday
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-secondary-fixed text-on-secondary-fixed px-2.5 py-1 rounded-full font-label-sm text-label-sm self-start">
              <span className="material-symbols-outlined text-[14px]">auto_delete</span>
              <span>Expires in 3 days (Auto-deleted after 7 days)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Sanctuary choir praising"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtC6BUBUF1_aOL2qbo6gIh8jrrKT6-nR5LPdMbsFO69djFqDi7qANLdB7XpDjP-Hjltn-9Zvjst8A5W2oBti-_HeVHYD8543RSiK4pKMC0CBECrbOWkkZyK7INcOZKgEkIM_KL1IbwmA43aLr-OpaZMmEE_qY_EcdH41Rktf14hG-taVC8guZ209uf9oOgSXg5WXr1t3lCaxgdKoeVwHw4Z1zUQmSUStPdm1I_ocQ"
                />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Congregation lifting hands in worship"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYy-_MNgo6XM-GzELiwJiaA8dE3K_WOunWcOch9IisUtKoCenoT8W2me2IbwwPmwv_E2nzGGiwYPBClZ1rl05sLnrtp6ew80RCyAzGQFl5dfTnzR_7zOIvZN2xE4FwQPQb-DobM1widX8xLaTuM7kJyTndhshQX-rsfHdMws7Fe2AQJin3Gj6phQe2vmmcf0hjBCDMcQu6raBCcw9p9jhW9tjnE1iTS-lf8PsPUkA"
                />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Thanksgiving dedication prayer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6IKRWfQcxgdo76OvPmXxSuJuUcIgZCp1T55eEfzJIukO0DWC5r5Un4Z0Nod6y-vWgqe3Gzp04cdBPptbDfFSnsenyI5_Ud-oCqSjc3KAfQftGNXMfAHVcG7Zer-yZ-vS2YrpCF7g8_NmZejZ7KZBeQbaCaZs4II6fcvLNUZqhOn1GyAzCKkuzcOFce-DAmpA75D-wa9UVj4jnvfEWT4csXDZrGQX8MbK8vwAo4FE"
                />
                <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                  <span className="font-label-lg text-label-lg text-on-primary font-bold">+15</span>
                </div>
              </div>
            </div>
            <Link
              className="inline-flex items-center justify-between pt-2 text-primary font-label-lg text-label-lg hover:underline"
              href="/dashboard"
            >
              <span>View all photos (18)</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* Slice 1 Role Authorization Verification Card */}
          <div className="w-full bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">security</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Role Access &amp; Session Guard
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/usher"
                  className="font-label-sm text-label-sm text-primary hover:underline"
                >
                  Usher QR
                </Link>
                <span className="text-outline">·</span>
                <Link
                  href="/admin"
                  className="font-label-sm text-label-sm text-primary hover:underline"
                >
                  Admin
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleTestAdminGuard()}
              className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Test Admin-Only Query (adminOnlyCheck)</span>
            </button>
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

        {/* Interactive Modal Drawer for Camera Simulation */}
        {cameraModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-margin"
            id="cameraModal"
          >
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-xl p-space-lg flex flex-col items-center text-center space-y-space-md">
              <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[36px]">qr_code_scanner</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Scanning Entrance Code
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Align the screen with the church usher display kiosk at the sanctuary doors.
                </p>
              </div>
              <div className="w-full aspect-square max-w-[200px] rounded-lg bg-surface-container-highest flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-2 border-2 border-dashed border-secondary/60 rounded-md" />
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 animate-pulse">
                  qr_code_2
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                  Searching code...
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCameraModalOpen(false)}
                className="w-full h-11 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md cursor-pointer"
                id="closeCameraBtn"
              >
                Cancel Scan
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Stitch Persistent 4-Slot Member Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
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
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
            <span className="font-label-sm text-label-sm">Streak</span>
          </Link>
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
            <span className="font-label-sm text-label-sm">Photos</span>
          </Link>
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="font-label-sm text-label-sm">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
