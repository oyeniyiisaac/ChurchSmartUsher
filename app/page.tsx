"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import type { ReactNode } from "react";

const PING_QUERY = gql`
  query Ping {
    ping
    me {
      id
      fullName
      role
    }
  }
`;

interface PingData {
  ping: string;
  me: {
    id: string;
    fullName: string;
    role: string;
  } | null;
}

export default function HomePage(): ReactNode {
  const { data, loading } = useQuery<PingData>(PING_QUERY);

  return (
    <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface">
      <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin pt-space-md pb-space-2xl">
        {/* Stitch Brand Banner */}
        <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low shadow-sm mb-space-lg p-space-md">
          <div className="flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm flex items-center justify-center p-space-xs">
                <img
                  alt="ChurchConnect Brand Logo"
                  className="w-full h-full object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="inline-flex items-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed rounded-full px-space-sm py-0.5 w-max">
                  <span className="material-symbols-outlined text-[14px]">church</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Sanctuary Portal
                  </span>
                </div>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight truncate mt-1">
                  ChurchConnect
                </h1>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-tertiary-container/10 text-on-tertiary-fixed-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
              <span>{loading ? "Syncing..." : `API: ${data?.ping ?? "ok"}`}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col mb-space-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Grace Sanctuary Parish · Digital Fellowship
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs leading-relaxed">
            Scan the rotating service QR code at the sanctuary entrance, track your consistency
            streak, and stay connected with your department.
          </p>
        </div>

        {/* Navigation Cards to Stitch Screens */}
        <div className="flex flex-col gap-space-md mb-space-xl">
          <Link
            href="/login"
            className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">login</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary">
                  1. Welcome &amp; Member Sign In
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Phone &amp; passkey login with check-in return redirect
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>

          <Link
            href="/register"
            className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  2. Member Registration
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Department selection &amp; NDPA 2023 consent
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">home</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  3. Member Home &amp; Streak Portal
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Next service focus, 6-Sunday streak bento, and photo roll
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>

          <Link
            href="/usher"
            className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  11. Usher Live QR Desk
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Rotating sanctuary gate QR &amp; projector mode
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>

          <Link
            href="/admin"
            className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Admin Sanctuary Overview
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Attendance trend, department breakdown &amp; pastoral care
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-1.5 p-space-md rounded-xl bg-surface-container-low">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span className="font-label-md text-label-md font-semibold">
              Grace Sanctuary Parish, Lagos
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Connecting the body of Christ in worship, fellowship, and truth.
          </p>
        </div>
      </div>
    </main>
  );
}
