"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const MY_STREAK_QUERY = gql`
  query MyStreakPage {
    myStreak {
      currentStreak
      longestStreak
      totalInYear
      monthCompletedLabel
      badges {
        code
        title
        threshold
        unlocked
        progressCount
        subtitle
      }
      calendarEntries {
        serviceId
        label
        subtitle
        status
      }
    }
  }
`;

export default function StreakPage(): ReactNode {
  const { data } = useQuery(MY_STREAK_QUERY, {
    fetchPolicy: "network-only",
  });

  const [reminderSaved, setReminderSaved] = useState<boolean>(false);
  const [sharedAffirmation, setSharedAffirmation] = useState<boolean>(false);

  const currentStreak: number = (data?.myStreak?.currentStreak as number | undefined) ?? 7;
  const longestStreak: number = (data?.myStreak?.longestStreak as number | undefined) ?? 14;
  const totalInYear: number = (data?.myStreak?.totalInYear as number | undefined) ?? 38;
  const monthCompletedLabel: string =
    (data?.myStreak?.monthCompletedLabel as string | undefined) ?? "3 of 4";

  const pillarProgressPercent = Math.min(100, Number(((currentStreak / 12) * 100).toFixed(1)));
  const servicesLeftForPillar = Math.max(0, 12 - currentStreak);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Top Header (7._streak_screen) */}
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
                Streak
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Notifications"
              type="button"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
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
        <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin pb-6 gap-space-lg">
          {/* Sub-header & Community Welcome Message */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                Devotion &amp; Presence
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                Active Grace Period
              </span>
            </div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Fellowship Consistency &amp; Streak
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Gathering with brothers and sisters in worship, steadfast in faith.
            </p>
          </div>

          {/* Big Streak Highlight Card (Warm Royal Blue with Soft Gold Accents) */}
          <div className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary shadow-xl p-space-lg flex flex-col gap-space-md">
            {/* Ambient Golden Glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-secondary-container/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-primary/40 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-surface-container-lowest/10 text-secondary-fixed-dim">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                </span>
                <span className="font-label-md text-label-md tracking-wide text-primary-fixed-dim uppercase">
                  Current Rhythm
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/15 text-primary-fixed text-label-sm font-label-sm">
                Weekly Sanctuary
              </span>
            </div>

            {/* Giant Streak Stat */}
            <div className="relative z-10 flex items-baseline gap-3 my-1">
              <span className="font-display-lg text-[68px] leading-none font-bold text-on-primary tracking-tight">
                {currentStreak}
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-secondary-fixed-dim leading-snug">
                  Sundays in a Row
                </span>
                <span className="font-body-sm text-body-sm text-primary-fixed-dim">
                  Next milestone at {currentStreak + 1} services
                </span>
              </div>
            </div>

            {/* Progress to Next Badge Sparkline Bar */}
            <div className="relative z-10 flex flex-col gap-1.5 w-full">
              <div className="flex justify-between font-label-sm text-label-sm text-primary-fixed">
                <span>Quarterly Pillar Progress</span>
                <span className="font-semibold text-secondary-fixed-dim">
                  {currentStreak} / 12 Services
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-lowest/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary-container to-secondary-fixed-dim transition-all duration-500"
                  style={{ width: `${pillarProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Supporting 3-Column Metrics Grid */}
            <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t-0 bg-surface-container-lowest/10 rounded-lg p-2.5">
              <div className="flex flex-col items-center text-center">
                <span className="font-label-sm text-label-sm text-primary-fixed-dim">Longest</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-primary">
                  {longestStreak}
                </span>
                <span className="font-label-sm text-[11px] text-primary-fixed-dim">
                  Consecutive
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="font-label-sm text-label-sm text-primary-fixed-dim">In 2024</span>
                <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed-dim">
                  {totalInYear}
                </span>
                <span className="font-label-sm text-[11px] text-primary-fixed-dim">
                  Total Services
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="font-label-sm text-label-sm text-primary-fixed-dim">Nov 2024</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-primary">
                  {monthCompletedLabel}
                </span>
                <span className="font-label-sm text-[11px] text-primary-fixed-dim">Completed</span>
              </div>
            </div>
          </div>

          {/* Encouraging Scripture Banner & Grace Note */}
          <div className="rounded-xl bg-surface-container-low p-space-md shadow-sm flex flex-col gap-2.5">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed mt-0.5 shrink-0">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  menu_book
                </span>
              </span>
              <div className="flex flex-col gap-1">
                <blockquote className="font-body-md text-body-md italic text-on-surface leading-snug">
                  “Let us not neglect meeting together, as some are in the habit of doing, but
                  encouraging one another...”
                </blockquote>
                <cite className="font-label-sm text-label-sm font-semibold text-secondary not-italic">
                  — Hebrews 10:25
                </cite>
              </div>
            </div>
            <div className="rounded-lg bg-surface-container p-2.5 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                sentiment_satisfied
              </span>
              <span className="font-body-sm text-body-sm">
                Start a new streak this Sunday — every week is a fresh beginning in fellowship.
              </span>
            </div>
          </div>

          {/* Month Calendar Card (November 2024) */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  calendar_month
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  November 2024
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                Sundays Log
              </span>
            </div>

            {/* Calendar Service Check-in Timeline */}
            <div className="flex flex-col gap-2.5">
              {/* Nov 3: Attended */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-sm">
                    <span className="material-symbols-outlined text-[22px] font-bold">check</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface">
                        Sunday, Nov 3
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant font-label-sm text-[11px] font-semibold">
                        Verified
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      First Service • 08:30 AM • Sanctuary A
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  chevron_right
                </span>
              </div>

              {/* Nov 10: Attended */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-sm">
                    <span className="material-symbols-outlined text-[22px] font-bold">check</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface">
                        Sunday, Nov 10
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant font-label-sm text-[11px] font-semibold">
                        Verified
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Praise Service • 10:30 AM • Main Hall
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  chevron_right
                </span>
              </div>

              {/* Nov 17: Attended */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-sm">
                    <span className="material-symbols-outlined text-[22px] font-bold">check</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface">
                        Sunday, Nov 17
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant font-label-sm text-[11px] font-semibold">
                        Verified
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      First Service • 08:30 AM • Sanctuary A
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  chevron_right
                </span>
              </div>

              {/* Nov 24: Upcoming */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                        Sunday, Nov 24
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-[11px] font-semibold">
                        Upcoming
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Harvest Thanksgiving • 09:00 AM
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="setReminderBtn"
                  onClick={() => setReminderSaved(true)}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                    reminderSaved ? "bg-tertiary text-on-tertiary" : "bg-primary text-on-primary"
                  }`}
                >
                  {reminderSaved ? "Saved ✓" : "Remind"}
                </button>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center justify-between pt-2 px-1 text-on-surface-variant">
              <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed" />
                <span>Attended</span>
              </div>
              <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <span>Excused/Departed</span>
              </div>
            </div>
          </div>

          {/* Community Fellowship Momentum Photo Story */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Sanctuary Atmosphere
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Memories from last Lord&apos;s day gathering
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary">church</span>
            </div>
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
              <img
                alt="Sanctuary worship atmosphere"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDefiLYSUlJ8UQRl4jsZYRDF6r6lykcfAxPFqosJWlDzCzpcWDsczypqMF-Y120kt7ympEl9Gl474W5L7RD1ktIufHBTK4Df_sVt-jeGc6m-xGubq-dQ5VzZMLk4XZPf1nx6v7VWTqZBFrEqahXAcF1J1CFpV0zIFh2rPerwg_OTvJM0XfMuVX1wj7Rv5MlrPMVng1AzA4OA8S13kw4XPZgoGGSVd2hcksVntZu_EQ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent flex items-end p-3">
                <p className="font-label-md text-label-md text-on-primary font-medium">
                  Over 320 congregants gathered together in grace
                </p>
              </div>
            </div>
          </div>

          {/* Milestone Badges Section */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Milestone Badges
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Celebrating consistency and spiritual commitment
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                1 Unlocked
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Badge 1: Faithful Starter (Unlocked) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-secondary-container to-secondary flex items-center justify-center text-on-secondary shadow-md shrink-0">
                  <span
                    className="material-symbols-outlined text-[30px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    stars
                  </span>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary" />
                  </span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">
                      Faithful Starter
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-[11px] font-semibold">
                      Unlocked
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    4 Services in a Row
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    Earned October 2024 • Steadfast Journey
                  </span>
                </div>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-variant transition-colors"
                  title="View Certificate"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
              </div>

              {/* Badge 2: Quarterly Pillar (Locked) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/40">
                <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-[28px]">lock</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">
                      Quarterly Pillar
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px]">
                      In Progress
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    12 Services in a Row
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pillarProgressPercent}%` }}
                      />
                    </div>
                    <span className="font-label-sm text-label-sm font-semibold text-primary">
                      {servicesLeftForPillar} left
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge 3: Year of Fellowship (Locked) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/40">
                <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-[28px]">workspace_premium</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">
                      Year of Fellowship
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px]">
                      Locked
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    52 Services in a Row
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Full year dedication to the Father&apos;s house
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Affirmation & Share Card */}
          <div className="rounded-xl bg-gradient-to-r from-primary to-primary-container p-space-md text-on-primary flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface-container-lowest/15 flex items-center justify-center text-secondary-fixed-dim">
                <span className="material-symbols-outlined text-[24px]">favorite</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg font-semibold text-on-primary">
                  Celebrate Consistency
                </span>
                <span className="font-body-sm text-body-sm text-primary-fixed-dim">
                  Inspire your prayer cell group today
                </span>
              </div>
            </div>
            <button
              type="button"
              id="encourageGroupBtn"
              onClick={() => {
                setSharedAffirmation(true);
                window.setTimeout(() => setSharedAffirmation(false), 2400);
              }}
              className="px-3 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {sharedAffirmation ? "Shared! ✨" : "Share"}
            </button>
          </div>
        </div>
      </main>

      {/* Stitch Bottom Tab Bar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex justify-around items-center h-16 px-space-xs max-w-[600px] mx-auto">
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-label-sm text-label-sm">Home</span>
          </Link>
          <Link
            aria-current="page"
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors text-primary-container font-semibold"
            href="/streak"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
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
