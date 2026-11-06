"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import type { ReactNode } from "react";

const ADMIN_OVERVIEW_QUERY = gql`
  query AdminOverview {
    me {
      id
      fullName
      phone
      role
    }
    adminOnlyCheck
  }
`;

interface AdminOverviewData {
  me: {
    id: string;
    fullName: string;
    phone: string;
    role: "MEMBER" | "USHER" | "ADMIN";
  } | null;
  adminOnlyCheck: string;
}

const DEPARTMENTS_BREAKDOWN = [
  { name: "Women of Grace", count: "88 / 95", pct: 93, bar: "bg-primary-container" },
  { name: "Sanctuary Choir", count: "42 / 45", pct: 93, bar: "bg-primary" },
  { name: "Ushering & Protocol", count: "28 / 30", pct: 93, bar: "bg-secondary" },
  { name: "Sunday School Teachers", count: "22 / 24", pct: 92, bar: "bg-primary-container" },
  { name: "Media & Technical", count: "16 / 18", pct: 89, bar: "bg-primary" },
  { name: "Youth Fellowship", count: "74 / 85", pct: 87, bar: "bg-secondary-container" },
  { name: "Men's Fellowship", count: "65 / 80", pct: 81, bar: "bg-outline" },
] as const;

const ROSTER_ROWS = [
  {
    initials: "IA",
    avatarClass: "bg-primary text-on-primary",
    name: "Isaac Adeleke",
    code: "CC-2024-0104",
    phone: "+234 802 334 1122",
    dept: "Sanctuary Choir",
    streak: "12 wks 🏆",
    lastAttended: "Today, 8:42 AM",
  },
  {
    initials: "CO",
    avatarClass: "bg-secondary text-on-secondary",
    name: "Chioma Okonkwo",
    code: "CC-2024-0219",
    phone: "+234 813 908 4455",
    dept: "Ushering Lead",
    streak: "7 wks 🔥",
    lastAttended: "Today, 8:15 AM",
  },
  {
    initials: "FA",
    avatarClass: "bg-primary-fixed text-on-primary-fixed",
    name: "Femi Awolowo",
    code: "CC-2024-0390",
    phone: "+234 701 556 7788",
    dept: "Media & Sound",
    streak: "9 wks 🔥",
    lastAttended: "Today, 8:05 AM",
  },
] as const;

export default function AdminPage(): ReactNode {
  const { data, error } = useQuery<AdminOverviewData>(ADMIN_OVERVIEW_QUERY, {
    fetchPolicy: "network-only",
  });

  const adminName = data?.me?.fullName ?? "Pastor Emmanuel";

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Stitch Desktop Sidebar (admin_dashboard_overview) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex-col justify-between">
        <div className="flex flex-col">
          <div className="px-space-lg pt-space-lg pb-space-md flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[22px]">church</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight truncate">
                ChurchConnect
              </span>
              <span className="font-label-sm text-label-sm text-secondary truncate">
                Grace Sanctuary Parish - Lagos
              </span>
            </div>
          </div>

          <div className="px-space-lg py-space-xs">
            <div className="h-px w-full bg-surface-container" />
          </div>

          <nav className="px-space-md py-space-sm flex flex-col gap-space-xs">
            <Link
              aria-current="page"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors bg-primary-container text-on-primary font-semibold"
              href="/admin"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
              <span className="font-label-md text-label-md">Dashboard</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/members"
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              <span className="font-label-md text-label-md">Members</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/services"
            >
              <span className="material-symbols-outlined text-[20px]">event_available</span>
              <span className="font-label-md text-label-md">Services</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/departments"
            >
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
              <span className="font-label-md text-label-md">Departments &amp; Activities</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/admin"
            >
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
              <span className="font-label-md text-label-md">Attendance</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/reports"
            >
              <span className="material-symbols-outlined text-[20px]">query_stats</span>
              <span className="font-label-md text-label-md">Reports</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/admin/photos"
            >
              <span className="material-symbols-outlined text-[20px]">photo_library</span>
              <span className="font-label-md text-label-md">Photos</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span className="font-label-md text-label-md">Member View</span>
            </Link>
          </nav>
        </div>

        <div className="p-space-md">
          <Link
            href="/usher"
            className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between hover:bg-surface-container transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Usher Portal Link
              </span>
              <span className="font-body-sm text-body-sm text-primary font-medium">
                Sunday Desk Ready
              </span>
            </div>
            <span className="material-symbols-outlined text-secondary text-[20px]">
              qr_code_scanner
            </span>
          </Link>
        </div>
      </aside>

      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
          <div className="flex items-center gap-space-md max-w-md w-full">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                search
              </span>
              <input
                className="w-full h-10 pl-10 pr-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors"
                placeholder="Search members, units, records..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-space-md shrink-0">
            <div className="hidden md:flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-label-sm text-label-sm">Live: Sunday First Service</span>
            </div>
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight">
                  {adminName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  {data?.me?.role ?? "Admin Lead"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 pb-24 lg:pb-8 bg-background w-full min-h-screen">
          <div className="p-4 sm:p-6 lg:p-space-xl flex flex-col gap-space-xl max-w-7xl mx-auto w-full">
            {error && (
              <div
                className="rounded-xl bg-error-container text-on-error-container px-space-md py-space-sm font-label-sm text-label-sm flex items-center justify-between"
                role="alert"
              >
                <span>
                  Admin Guard Status: {error.message} (Sign in as Admin 08000000001 to authorize
                  `adminOnlyCheck`)
                </span>
                <Link href="/login" className="underline font-bold">
                  Sign In as Admin
                </Link>
              </div>
            )}

            {data?.adminOnlyCheck && (
              <div
                className="rounded-xl bg-tertiary-fixed/50 text-on-tertiary-fixed-variant px-space-md py-space-sm font-label-sm text-label-sm"
                role="status"
              >
                {data.adminOnlyCheck}
              </div>
            )}

            {/* Header Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Sanctuary Overview &amp; Attendance Pulse
                  </span>
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                    <span className="font-label-sm text-label-sm font-semibold">
                      Sunday First Service · In Progress (Door A &amp; B Open)
                    </span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[18px] text-outline">
                    calendar_today
                  </span>
                  <span>Sunday · 10:15 AM (Africa/Lagos)</span>
                  <span className="text-outline">/</span>
                  <span className="text-secondary font-medium">
                    Grace Sanctuary Parish · Main Auditorium
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <button
                  className="inline-flex items-center gap-space-xs px-space-md h-12 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-high transition-colors font-label-md text-label-md cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    download
                  </span>
                  <span>Export Weekly Summary</span>
                </button>
                <Link
                  href="/usher"
                  className="inline-flex items-center gap-space-xs px-space-md h-12 rounded-lg bg-secondary text-on-secondary shadow-sm hover:bg-on-secondary-container transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  <span>Open Door Scanner</span>
                </Link>
                <button
                  className="inline-flex items-center gap-space-xs px-space-md h-12 rounded-lg bg-primary text-on-primary shadow-md hover:bg-primary-container transition-colors font-label-md text-label-md cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>+ New Service</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Total Registered Members
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">groups</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-display-lg text-display-lg text-primary tracking-tight">
                    1,248
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                    +18 this month
                  </span>
                </div>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span>Active Roster Ratio</span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    98.2% Active
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Last Service Attendance
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-display-lg text-display-lg text-primary tracking-tight">
                    312
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                    +12 vs prior
                  </span>
                </div>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span>Sanctuary Capacity</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    87% Filled (360 cap)
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    4-Week Average Attendance
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[22px]">query_stats</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-display-lg text-display-lg text-primary tracking-tight">
                    294
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                    +4.8% growth
                  </span>
                </div>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span>Sunday Average</span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    Per Sunday Cycle
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    New Members This Month
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[22px]">person_add</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-display-lg text-display-lg text-primary tracking-tight">
                    34
                  </span>
                  <span className="font-label-sm text-label-sm bg-tertiary-container text-on-tertiary px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                    1st Time Guests
                  </span>
                </div>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span>Believers Baptism</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    +14% Conversion Rate
                  </span>
                </div>
              </div>
            </div>

            {/* Trend & Department Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                      Weekly Sanctuary Metric
                    </span>
                    <h3 className="font-headline-md text-headline-md text-primary">
                      Attendance Trend (Sep 1 – Nov 17)
                    </h3>
                  </div>
                  <div className="inline-flex rounded-lg bg-surface-container-low p-1 gap-1">
                    <button
                      className="px-space-sm py-1 rounded-md bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-sm"
                      type="button"
                    >
                      Sunday Services
                    </button>
                    <button
                      className="px-space-sm py-1 rounded-md text-on-surface-variant font-label-sm text-label-sm"
                      type="button"
                    >
                      Midweek Study
                    </button>
                    <button
                      className="px-space-sm py-1 rounded-md text-on-surface-variant font-label-sm text-label-sm"
                      type="button"
                    >
                      Combined
                    </button>
                  </div>
                </div>
                <div className="relative w-full h-64 pt-4">
                  <svg
                    className="w-full h-full overflow-visible"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 680 200"
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#dce1ff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line
                      stroke="#eaedff"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      x1="40"
                      x2="660"
                      y1="20"
                      y2="20"
                    />
                    <line
                      stroke="#eaedff"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      x1="40"
                      x2="660"
                      y1="60"
                      y2="60"
                    />
                    <line
                      stroke="#eaedff"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      x1="40"
                      x2="660"
                      y1="100"
                      y2="100"
                    />
                    <line
                      stroke="#eaedff"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      x1="40"
                      x2="660"
                      y1="140"
                      y2="140"
                    />
                    <line stroke="#eaedff" strokeWidth="1" x1="40" x2="660" y1="180" y2="180" />
                    <path
                      d="M 50,140 Q 105,125 160,118 T 270,110 T 380,85 T 490,95 T 600,60 T 650,42 L 650,180 L 50,180 Z"
                      fill="url(#areaGradient)"
                    />
                    <path
                      d="M 50,140 Q 105,125 160,118 T 270,110 T 380,85 T 490,95 T 600,60 T 650,42"
                      fill="none"
                      stroke="#1e3a8a"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute right-0 top-0 bg-primary text-on-primary px-3 py-1.5 rounded-lg shadow-md flex flex-col items-center pointer-events-none">
                    <span className="font-label-sm text-[11px] leading-tight text-primary-fixed">
                      Nov 17 (Today)
                    </span>
                    <span className="font-headline-sm text-headline-sm leading-tight">
                      312 Attendees
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                      Workforce Engagement
                    </span>
                    <h3 className="font-headline-md text-headline-md text-primary">
                      Department Breakdown
                    </h3>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant">
                    7 Units Active
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm pt-2">
                  {DEPARTMENTS_BREAKDOWN.map((dept) => (
                    <div key={dept.name} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-label-sm text-label-sm">
                        <span className="text-on-surface font-semibold">{dept.name}</span>
                        <span className="text-primary font-bold">
                          {dept.count}{" "}
                          <span className="text-on-surface-variant font-normal">({dept.pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full ${dept.bar} rounded-full`}
                          style={{ width: `${dept.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Roster Table */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">
                    Recent Member Records &amp; Attendance Roster
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live audit trail synchronized from Sunday entrance scanners and manual deacon
                    desk entries.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                      <th className="py-space-sm px-space-md rounded-l-lg">Member</th>
                      <th className="py-space-sm px-space-md">Phone / WhatsApp</th>
                      <th className="py-space-sm px-space-md">Department &amp; Unit</th>
                      <th className="py-space-sm px-space-md">Current Streak</th>
                      <th className="py-space-sm px-space-md">Last Attended</th>
                      <th className="py-space-sm px-space-md rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {ROSTER_ROWS.map((row) => (
                      <tr
                        key={row.code}
                        className="hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div
                              className={`w-10 h-10 rounded-full ${row.avatarClass} flex items-center justify-center font-bold text-sm`}
                            >
                              {row.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface font-semibold">
                                {row.name}
                              </span>
                              <span className="font-label-sm text-label-sm text-outline">
                                {row.code}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md text-on-surface">{row.phone}</td>
                        <td className="py-space-md px-space-md">
                          <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                            {row.dept}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold font-label-sm text-label-sm">
                            {row.streak}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-on-surface">
                          {row.lastAttended}
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-tertiary-container font-semibold font-label-sm text-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                            Present Today
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
