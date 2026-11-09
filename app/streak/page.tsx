"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const MY_STREAK_QUERY = gql`
  query MyStreakPage {
    me {
      id
      fullName
      avatarUrl
      role
    }
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
    servicePhotos {
      id
      title
      imageUrl
    }
  }
`;

interface StreakBadgeItem {
  code: string;
  title: string;
  threshold: number;
  unlocked: boolean;
  progressCount: number;
  subtitle: string;
}

interface StreakCalendarItem {
  serviceId: string;
  label: string;
  subtitle: string;
  status: "ATTENDED" | "UPCOMING" | "MISSED" | string;
}

interface StreakPageData {
  me: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
  myStreak?: {
    currentStreak: number;
    longestStreak: number;
    totalInYear: number;
    monthCompletedLabel: string;
    badges: StreakBadgeItem[];
    calendarEntries: StreakCalendarItem[];
  } | null;
  servicePhotos: Array<{
    id: string;
    title: string;
    imageUrl: string;
  }>;
}

export default function StreakPage(): ReactNode {
  const { data, loading, refetch } = useQuery<StreakPageData>(MY_STREAK_QUERY, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });

  const [savedReminders, setSavedReminders] = useState<Record<string, boolean>>({});
  const [sharedAffirmation, setSharedAffirmation] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<StreakBadgeItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  function triggerToast(msg: string): void {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }

  async function handleRefresh(): Promise<void> {
    setIsRefreshing(true);
    try {
      await refetch();
      triggerToast("Attendance streak & calendar updated successfully.");
    } catch {
      triggerToast("Refreshed.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleSetReminder(entry: StreakCalendarItem): void {
    setSavedReminders((prev) => ({ ...prev, [entry.serviceId]: true }));
    triggerToast(`Reminder set for ${entry.label}! You will be prompted before sanctuary worship.`);
  }

  function handleShareAffirmation(): void {
    const text = `Faithful in worship! I'm on a ${currentStreak}-Sunday streak at RCCG JESUS HOUSE, OGBOMOSHO. "Let us not neglect meeting together..." — Hebrews 10:25`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      triggerToast("Worship streak affirmation copied to clipboard!");
    } else {
      triggerToast("Worship streak affirmation ready to share!");
    }
    setSharedAffirmation(true);
    setTimeout(() => setSharedAffirmation(false), 2400);
  }

  const currentStreak: number = data?.myStreak?.currentStreak ?? 0;
  const longestStreak: number = data?.myStreak?.longestStreak ?? 0;
  const totalInYear: number = data?.myStreak?.totalInYear ?? 0;
  const monthCompletedLabel: string = data?.myStreak?.monthCompletedLabel ?? "0 of 4";
  const calendarEntries = data?.myStreak?.calendarEntries ?? [];
  const badges = data?.myStreak?.badges ?? [];
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const heroPhotoUrl = data?.servicePhotos?.[0]?.imageUrl || "/rccg-logo.png";

  const pillarProgressPercent = Math.min(100, Number(((currentStreak / 12) * 100).toFixed(1)));
  const servicesLeftForPillar = Math.max(0, 12 - currentStreak);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Top Header (7._streak_screen) */}
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
                Streak
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Refresh streak data"
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-all active:scale-95 ${
                isRefreshing ? "animate-spin text-primary" : ""
              }`}
              title="Sync & refresh streak"
            >
              <span className="material-symbols-outlined text-[22px]">sync</span>
            </button>
            <button
              aria-label="Notifications"
              type="button"
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
            <Link
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center"
              href={data?.me ? "/profile" : "/login"}
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-surface-container"
                src={data?.me?.avatarUrl || "/rccg-logo.png"}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 gap-space-lg">
          {/* Guest Sign-In Notice Banner */}
          {!data?.me && (
            <div className="mt-4 rounded-2xl bg-primary/10 border border-primary/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">
                    Sign In to Track Your Personal Streak
                  </h3>
                  <p className="font-body-sm text-sm text-on-surface-variant mt-0.5 max-w-xl leading-relaxed">
                    Log in with your phone number to record your Sunday check-ins, unlock spiritual
                    milestones, and keep your worship journey alive at RCCG JESUS HOUSE, OGBOMOSHO.
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary/90 transition-all shrink-0 shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Sub-header & Community Welcome Message */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
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
                RCCG JESUS HOUSE, OGBOMOSHO
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-headline-lg-mobile md:text-3xl text-headline-lg-mobile text-on-surface">
                Fellowship Consistency &amp; Streak
              </h1>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin text-primary" : ""}`}
                >
                  refresh
                </span>
                <span>Sync</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Gathering with brothers and sisters in worship, steadfast in faith.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Big Streak Highlight Card */}
              <div className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary shadow-xl p-space-lg flex flex-col gap-space-md">
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
                    <span className="font-label-md text-label-md tracking-wide text-primary-fixed-dim uppercase font-semibold">
                      Current Rhythm
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/15 text-primary-fixed text-label-sm font-label-sm font-medium">
                    Weekly Sanctuary
                  </span>
                </div>

                <div className="relative z-10 flex items-baseline gap-3 my-1">
                  <span className="font-display-lg text-[68px] leading-none font-bold text-on-primary tracking-tight">
                    {currentStreak}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-secondary-fixed-dim leading-snug font-semibold">
                      {currentStreak === 1 ? "Sunday in a Row" : "Sundays in a Row"}
                    </span>
                    <span className="font-body-sm text-body-sm text-primary-fixed-dim">
                      {currentStreak === 0
                        ? "Check in this Sunday to begin your rhythm!"
                        : `Next milestone at ${currentStreak + 1} services`}
                    </span>
                  </div>
                </div>

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

                <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t-0 bg-surface-container-lowest/10 rounded-lg p-2.5">
                  <div className="flex flex-col items-center text-center">
                    <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                      Longest
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-primary">
                      {longestStreak}
                    </span>
                    <span className="font-label-sm text-[11px] text-primary-fixed-dim">
                      Consecutive
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                      This Year
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-secondary-fixed-dim">
                      {totalInYear}
                    </span>
                    <span className="font-label-sm text-[11px] text-primary-fixed-dim">
                      Total Services
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                      Recent Month
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-primary">
                      {monthCompletedLabel}
                    </span>
                    <span className="font-label-sm text-[11px] text-primary-fixed-dim">
                      Completed
                    </span>
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
                      &ldquo;Let us not neglect meeting together, as some are in the habit of doing,
                      but encouraging one another...&rdquo;
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
                    Every service is a fresh opportunity in fellowship. Keep your spiritual lamp
                    burning!
                  </span>
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
                      RCCG JESUS HOUSE, OGBOMOSHO
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary">church</span>
                </div>
                <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-low">
                  <img
                    alt="Sanctuary worship atmosphere"
                    className="w-full h-full object-cover"
                    src={heroPhotoUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent flex items-end p-3">
                    <p className="font-label-md text-label-md text-on-primary font-medium">
                      RCCG JESUS HOUSE, OGBOMOSHO Fellowship
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Calendar Card (Database Services Log) */}
              <div className="rounded-xl bg-surface-container-lowest p-space-md sm:p-6 shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      calendar_month
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Services Attendance Log
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                    {monthCompletedLabel} Finished
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {calendarEntries.length > 0 ? (
                    calendarEntries.map((entry) => {
                      const isAttended = entry.status === "ATTENDED";
                      const isUpcoming = entry.status === "UPCOMING";
                      const isSaved = !!savedReminders[entry.serviceId];

                      return (
                        <div
                          key={entry.serviceId}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                                isAttended
                                  ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                  : isUpcoming
                                    ? "bg-primary-container/30 text-primary"
                                    : "bg-surface-container-highest text-on-surface-variant"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px] font-bold">
                                {isAttended ? "check" : isUpcoming ? "schedule" : "event_busy"}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                                  {entry.label}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold ${
                                    isAttended
                                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                      : isUpcoming
                                        ? "bg-primary/15 text-primary"
                                        : "bg-outline-variant/30 text-on-surface-variant"
                                  }`}
                                >
                                  {entry.status}
                                </span>
                              </div>
                              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                {entry.subtitle}
                              </span>
                            </div>
                          </div>

                          {isUpcoming ? (
                            <button
                              type="button"
                              onClick={() => handleSetReminder(entry)}
                              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-95 active:scale-95 transition-all shrink-0 cursor-pointer font-medium ${
                                isSaved
                                  ? "bg-tertiary text-on-tertiary"
                                  : "bg-primary text-on-primary"
                              }`}
                            >
                              {isSaved ? "Saved ✓" : "Remind"}
                            </button>
                          ) : isAttended ? (
                            <span
                              className="material-symbols-outlined text-tertiary text-[22px] shrink-0"
                              title="Attended"
                            >
                              verified
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 opacity-60">
                              remove
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-lg bg-surface-container-low text-center text-on-surface-variant font-body-sm text-body-sm">
                      No Sunday services recorded in the database yet.
                    </div>
                  )}
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center justify-between pt-2 px-1 text-on-surface-variant gap-2">
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed" />
                    <span>Attended (Verified)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>Upcoming Service</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                    <span>Missed</span>
                  </div>
                </div>
              </div>

              {/* Milestone Badges Section */}
              <div className="rounded-xl bg-surface-container-lowest p-space-md sm:p-6 shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Milestone Badges
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Celebrating consistency and spiritual commitment
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                    {unlockedBadgesCount} / {badges.length || 3} Unlocked
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {badges.map((badge) => {
                    const isUnlocked = badge.unlocked;
                    const percent = Math.min(100, (badge.progressCount / badge.threshold) * 100);

                    return (
                      <div
                        key={badge.code}
                        onClick={() => setSelectedBadge(badge)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                          isUnlocked
                            ? "bg-secondary-fixed/30 border border-secondary/20 hover:bg-secondary-fixed/40"
                            : "bg-surface-container-high/40 hover:bg-surface-container-high/70"
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            isUnlocked
                              ? "bg-gradient-to-br from-secondary-container to-secondary text-on-secondary"
                              : "bg-surface-container-highest text-on-surface-variant"
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[28px]"
                            style={{ fontVariationSettings: isUnlocked ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {isUnlocked
                              ? "stars"
                              : badge.threshold >= 52
                                ? "workspace_premium"
                                : "lock"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">
                              {badge.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold ${
                                isUnlocked
                                  ? "bg-secondary text-on-secondary"
                                  : "bg-surface-container-highest text-on-surface-variant"
                              }`}
                            >
                              {isUnlocked
                                ? "Unlocked ✓"
                                : `${Math.max(0, badge.threshold - currentStreak)} left`}
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {badge.threshold} Services in a Row
                          </span>
                          {!isUnlocked && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="font-label-sm text-[11px] font-semibold text-primary">
                                {badge.progressCount}/{badge.threshold}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  onClick={handleShareAffirmation}
                  className="px-3.5 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {sharedAffirmation ? "Copied! ✨" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-md ${
                  selectedBadge.unlocked
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[36px]"
                  style={{
                    fontVariationSettings: selectedBadge.unlocked ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {selectedBadge.unlocked ? "stars" : "workspace_premium"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  {selectedBadge.title}
                </h3>
                <span className="text-secondary font-label-sm text-xs font-semibold uppercase tracking-wider">
                  Target: {selectedBadge.threshold} Consecutive Sunday Services
                </span>
                <p className="font-body-sm text-sm text-on-surface-variant mt-2">
                  {selectedBadge.subtitle}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-1.5">
                <div className="flex justify-between font-label-sm text-xs">
                  <span className="text-on-surface-variant">Your Current Streak</span>
                  <span className="font-bold text-on-surface">
                    {currentStreak} / {selectedBadge.threshold}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (currentStreak / selectedBadge.threshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full h-11 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface text-sm font-medium shadow-lg animate-fade-in flex items-center gap-2 max-w-[90vw]">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              check_circle
            </span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Stitch Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
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
