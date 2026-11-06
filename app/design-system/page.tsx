import Link from "next/link";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { MemberRow } from "@/components/MemberRow";
import { QrCard } from "@/components/QrCard";
import { StreakCard } from "@/components/StreakCard";

export default function DesignSystemPage(): ReactNode {
  return (
    <div className="min-h-screen bg-surface">
      <AppHeader title="Design System" showBack />
      <main className="pt-20 pb-16 px-margin max-w-[600px] mx-auto flex flex-col gap-space-lg">
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-xs">
          <div className="inline-flex items-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed rounded-full px-space-sm py-0.5 w-max">
            <span className="material-symbols-outlined text-[14px]">palette</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Warm Sanctuary Digital Experience
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight mt-1">
            ChurchConnect Stitch UI Foundation
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Royal Blue (`#00236f` / `#1e3a8a`), Warm Gold (`#904d00` / `#fe932c`), Sanctuary Emerald
            (`#004b1f`), and Soft Sanctuary Linen (`#faf8ff`).
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm"
            >
              1. Welcome Login
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm"
            >
              2. Member Registration
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm"
            >
              3. Member Home
            </Link>
            <Link
              href="/usher"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm"
            >
              11. Usher Show QR
            </Link>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm"
            >
              Admin Dashboard Overview
            </Link>
          </div>
        </div>

        <Card className="flex flex-col gap-space-md">
          <h2 className="font-headline-md text-headline-md text-primary">
            1. Buttons &amp; Form Inputs
          </h2>
          <div className="flex flex-col gap-space-sm">
            <Button variant="primary">Primary Sanctuary Action</Button>
            <Button variant="present">Complete Registration</Button>
            <Button variant="secondary">Secondary Surface Action</Button>
            <Button variant="danger">Close Attendance Session</Button>
          </div>
          <div className="flex flex-col gap-space-md pt-2">
            <Input
              label="Full Name"
              icon="person"
              placeholder="Isaac Olumide Adeleke"
              helperText="Required for parish directory"
            />
            <Input
              label="Phone Number"
              icon="phone"
              placeholder="+234 803 456 7890"
              error="Please enter a valid Nigerian mobile number"
            />
          </div>
        </Card>

        <StreakCard currentStreak={6} longestStreak={14} />

        <QrCard
          serviceId="srv_sunday_first"
          serviceName="Sunday First Service"
          staticToken="stitch-preview-slot-token"
          expiresInSeconds={42}
        />

        <Card className="flex flex-col gap-space-sm">
          <h2 className="font-headline-md text-headline-md text-primary">
            4. Congregation Member Rows
          </h2>
          <MemberRow name="Isaac Adeleke" department="Sanctuary Choir" time="8:42 AM" />
          <MemberRow name="Chioma Okonkwo" department="Ushering Lead" time="8:15 AM" />
          <MemberRow name="Kelechi Okafor" department="First-Time Visitor" time="9:20 AM" isGuest />
        </Card>
      </main>
    </div>
  );
}
