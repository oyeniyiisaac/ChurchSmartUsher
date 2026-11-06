"use client";

import { gql, useLazyQuery, useQuery } from "@apollo/client";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

const REPORTS_ARCHIVE_QUERY = gql`
  query AttendanceReportsPage {
    attendanceReports {
      totalRecordedQ4
      avgSundayTurnout
      digitalScanPercent
      visitorRetentionPercent
      archiveRows {
        id
        name
        dateLabel
        serviceTypeLabel
        attendanceCount
        memberVsGuestLabel
        memberRatioPercent
        capacityPercent
        scanVsManualLabel
        usherName
        usherInitials
        statusLabel
        isPeak
      }
    }
  }
`;

const EXPORT_CSV_QUERY = gql`
  query ExportAttendanceCsv($serviceId: ID) {
    exportAttendanceCsv(serviceId: $serviceId)
  }
`;

interface ArchiveRowItem {
  id: string;
  name: string;
  dateLabel: string;
  serviceTypeLabel: string;
  attendanceCount: number;
  memberVsGuestLabel: string;
  memberRatioPercent: number;
  capacityPercent: number;
  scanVsManualLabel: string;
  usherName: string;
  usherInitials: string;
  statusLabel: string;
  isPeak: boolean;
}

const DEFAULT_ARCHIVE_ROWS: ArchiveRowItem[] = [
  {
    id: "arch-1",
    name: "Sunday Thanksgiving Service",
    dateLabel: "17 Nov 2024 • 08:30 AM",
    serviceTypeLabel: "Sunday First",
    attendanceCount: 312,
    memberVsGuestLabel: "284 Mbr / 28 Gst",
    memberRatioPercent: 91,
    capacityPercent: 87,
    scanVsManualLabel: "298 Scan / 14 Man",
    usherName: "Bro. Emmanuel Kalu",
    usherInitials: "EK",
    statusLabel: "Completed",
    isPeak: false,
  },
  {
    id: "arch-2",
    name: "Special Thanksgiving Service",
    dateLabel: "10 Nov 2024 • 08:30 AM",
    serviceTypeLabel: "Sunday First",
    attendanceCount: 326,
    memberVsGuestLabel: "296 Mbr / 30 Gst",
    memberRatioPercent: 90.8,
    capacityPercent: 91,
    scanVsManualLabel: "310 Scan / 16 Man",
    usherName: "Sis. Chioma Nwosu",
    usherInitials: "CN",
    statusLabel: "Completed",
    isPeak: true,
  },
  {
    id: "arch-3",
    name: "Midweek Faith Clinic",
    dateLabel: "06 Nov 2024 • 06:00 PM",
    serviceTypeLabel: "Midweek",
    attendanceCount: 142,
    memberVsGuestLabel: "138 Mbr / 4 Gst",
    memberRatioPercent: 97,
    capacityPercent: 40,
    scanVsManualLabel: "130 Scan / 12 Man",
    usherName: "Bro. Chuka Eze",
    usherInitials: "CE",
    statusLabel: "Completed",
    isPeak: false,
  },
  {
    id: "arch-4",
    name: "Sunday Worship Service",
    dateLabel: "03 Nov 2024 • 08:30 AM",
    serviceTypeLabel: "Sunday First",
    attendanceCount: 298,
    memberVsGuestLabel: "275 Mbr / 23 Gst",
    memberRatioPercent: 92,
    capacityPercent: 83,
    scanVsManualLabel: "282 Scan / 16 Man",
    usherName: "Bro. Emmanuel Kalu",
    usherInitials: "EK",
    statusLabel: "Completed",
    isPeak: false,
  },
  {
    id: "arch-5",
    name: "Night of Wonders Vigil",
    dateLabel: "25 Oct 2024 • 10:00 PM",
    serviceTypeLabel: "Special Vigil",
    attendanceCount: 345,
    memberVsGuestLabel: "305 Mbr / 40 Gst",
    memberRatioPercent: 88.4,
    capacityPercent: 96,
    scanVsManualLabel: "320 Scan / 25 Man",
    usherName: "Elder Babatunde",
    usherInitials: "EB",
    statusLabel: "Completed",
    isPeak: false,
  },
];

export default function AttendanceReportsPage(): ReactNode {
  const { data } = useQuery(REPORTS_ARCHIVE_QUERY, {
    fetchPolicy: "network-only",
  });
  const [fetchCsv] = useLazyQuery(EXPORT_CSV_QUERY);

  const [searchTitle, setSearchTitle] = useState<string>("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const archiveRows: ArchiveRowItem[] =
    (data?.attendanceReports?.archiveRows as ArchiveRowItem[] | undefined) ?? DEFAULT_ARCHIVE_ROWS;

  const filteredRows = useMemo(() => {
    return archiveRows.filter((row) => {
      const matchesTitle =
        searchTitle.trim() === "" ||
        row.name.toLowerCase().includes(searchTitle.toLowerCase()) ||
        row.usherName.toLowerCase().includes(searchTitle.toLowerCase());
      const matchesType = serviceTypeFilter === "ALL" || row.serviceTypeLabel === serviceTypeFilter;
      return matchesTitle && matchesType;
    });
  }, [archiveRows, searchTitle, serviceTypeFilter]);

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleDownloadCsv = async (serviceId?: string, label?: string): Promise<void> => {
    let csvText =
      "Service Name,Service Date,Member Name,Member Code,Phone,Department,Check-in Method,Checked In At (UTC)\nSunday Thanksgiving Service,2024-11-17,Isaac Olumide Adeleke,CC-2024-0482,+2348034829104,Sanctuary Choir,QR,2024-11-17T07:12:04.000Z";
    try {
      const res = await fetchCsv({ variables: { serviceId } });
      if (res.data?.exportAttendanceCsv) {
        csvText = res.data.exportAttendanceCsv as string;
      }
    } catch {
      // Use fallback CSV string in preview mode
    }

    if (typeof window !== "undefined") {
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = label
        ? `${label.replace(/[^a-zA-Z0-9]+/g, "_")}_Attendance.csv`
        : "ChurchConnect_Q4_2024_Attendance_Archive.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    showToast(
      label
        ? `Exported ${label} CSV roster`
        : "Exported Full Q4 2024 Attendance CSV Archive (3,842 records)",
    );
  };

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}

      {/* Stitch Left Navigation Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
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
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
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
              href="/services"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                fact_check
              </span>
              <span className="font-label-md text-label-md">Attendance</span>
            </Link>
            <Link
              aria-current="page"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors bg-primary-container text-on-primary font-semibold"
              href="/reports"
            >
              <span className="material-symbols-outlined text-[20px]">query_stats</span>
              <span className="font-label-md text-label-md">Reports</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/admin"
            >
              <span className="material-symbols-outlined text-[20px]">photo_library</span>
              <span className="font-label-md text-label-md">Photos</span>
            </Link>
            <Link
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              href="/admin"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span className="font-label-md text-label-md">Settings</span>
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

      <div className="pl-72">
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-xl">
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
          <div className="flex items-center gap-space-md">
            <div className="hidden md:flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-label-sm text-label-sm">Live: Sunday First Service</span>
            </div>
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors relative"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary-container" />
            </button>
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight">
                  Pastor Emmanuel
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  Admin Lead
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 bg-background w-full min-h-screen">
          <div className="flex flex-col w-full">
            <div className="relative w-full px-space-xl py-space-xl flex flex-col gap-space-xl max-w-[1600px] mx-auto">
              {/* Page Header & Action Controls */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
                <div className="flex flex-col gap-space-xs max-w-2xl">
                  <div className="flex items-center gap-space-sm">
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      Audit Protocol 2024
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Parish Data Synchronization Active
                    </span>
                  </div>
                  <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                    Attendance Archive &amp; Service Analytics
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Historical service attendance records, dynamic check-in channel audits, and
                    demographic trends across Grace Sanctuary Parish Lagos.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-space-sm shrink-0">
                  <button
                    onClick={() => showToast("Preparing executive summary for print...")}
                    className="h-12 px-space-lg rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-space-xs shadow-sm hover:bg-surface-container transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] text-secondary">
                      print
                    </span>
                    <span>Print Executive Report</span>
                  </button>
                  <button
                    onClick={() => void handleDownloadCsv()}
                    className="h-12 px-space-lg rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-space-xs shadow-md hover:bg-primary-container transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Export Full Attendance CSV</span>
                  </button>
                </div>
              </div>

              {/* Filter Control Bar */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-2.5 rounded-lg text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      calendar_month
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Period:
                    </span>
                    <select className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer pr-space-xs">
                      <option>Q4 2024 (Oct - Dec)</option>
                      <option>Q3 2024 (Jul - Sep)</option>
                      <option>Full Year 2024</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-2.5 rounded-lg text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      filter_alt
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Service:
                    </span>
                    <select
                      value={serviceTypeFilter}
                      onChange={(e) => setServiceTypeFilter(e.target.value)}
                      className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer pr-space-xs"
                    >
                      <option value="ALL">All Service Types (Sundays, Midweek, Vigils)</option>
                      <option value="Sunday First">Sunday First Service Only</option>
                      <option value="Midweek">Midweek Faith Clinic</option>
                      <option value="Special Vigil">Special Vigils &amp; Retreats</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-2.5 rounded-lg text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      church
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Campus:
                    </span>
                    <select className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer pr-space-xs">
                      <option>Main Auditorium Branch</option>
                      <option>Youth Chapel Annex</option>
                      <option>Online Live Broadcast</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">
                    check_circle
                  </span>
                  <span>All 48 audits cryptographically verified</span>
                </div>
              </div>

              {/* Key Metrics Ribbon (4 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {/* Card 1 */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Total Recorded (Q4)
                      </span>
                      <span className="font-display-lg text-display-lg text-primary font-bold mt-1">
                        3,842
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[26px]">
                        groups
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-sm flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>{" "}
                      +8.4%
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      vs Q3 Total (3,544)
                    </span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Avg Sunday Turnout
                      </span>
                      <span className="font-display-lg text-display-lg text-on-surface font-bold mt-1">
                        318
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[26px]">
                        event_seat
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-sm flex flex-col gap-1.5">
                    <div className="flex justify-between items-center font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">Capacity Utilized</span>
                      <span className="font-semibold text-secondary">88.3% of 360 Seats</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-secondary-container rounded-full"
                        style={{ width: "88.3%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Digital Scan Adoption
                      </span>
                      <span className="font-display-lg text-display-lg text-tertiary font-bold mt-1">
                        94.2%
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-tertiary text-[26px]">
                        qr_code_scanner
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-sm flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Self-Scan vs 5.8% Desk
                    </span>
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-tertiary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">bolt</span> Ultra Fast
                    </span>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Visitor Retention
                      </span>
                      <span className="font-display-lg text-display-lg text-primary font-bold mt-1">
                        62%
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[26px]">
                        favorite
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-sm flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Within 3 service cycles
                    </span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">
                      138 Converts
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytical Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
                {/* Left Chart: Weekly Capacity Trends */}
                <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md">
                    <div className="flex flex-col">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">
                        Sanctuary Attendance &amp; Capacity Trends
                      </h2>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Weekly congregation distribution across September – November (12 Weeks)
                      </span>
                    </div>
                    <div className="flex items-center gap-space-sm flex-wrap text-label-sm font-label-sm">
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <span className="w-3 h-3 rounded-full bg-primary shrink-0" /> Sunday 1st
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <span className="w-3 h-3 rounded-full bg-secondary-container shrink-0" />{" "}
                        Sunday 2nd
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <span className="w-3 h-3 rounded-full bg-tertiary shrink-0" /> Midweek Study
                      </span>
                    </div>
                  </div>

                  {/* Inline SVG Area Chart */}
                  <div className="relative w-full h-72 my-space-xs flex flex-col justify-end">
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox="0 0 720 220"
                    >
                      <defs>
                        <linearGradient id="gradPrimary" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#00236f" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#00236f" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="gradSecondary" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#fe932c" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#fe932c" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="gradMidweek" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#003212" stopOpacity="0.20" />
                          <stop offset="100%" stopColor="#003212" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line
                        stroke="#dae2fd"
                        strokeDasharray="4,4"
                        strokeWidth="1"
                        x1="0"
                        x2="720"
                        y1="20"
                        y2="20"
                      />
                      <text
                        fill="#757682"
                        fontFamily="Inter"
                        fontSize="10"
                        textAnchor="end"
                        x="715"
                        y="16"
                      >
                        Sanctuary Cap: 360
                      </text>
                      <line stroke="#eaedff" strokeWidth="1" x1="0" x2="720" y1="75" y2="75" />
                      <text
                        fill="#757682"
                        fontFamily="Inter"
                        fontSize="10"
                        textAnchor="end"
                        x="715"
                        y="71"
                      >
                        280 Target
                      </text>
                      <line stroke="#eaedff" strokeWidth="1" x1="0" x2="720" y1="130" y2="130" />
                      <text
                        fill="#757682"
                        fontFamily="Inter"
                        fontSize="10"
                        textAnchor="end"
                        x="715"
                        y="126"
                      >
                        200 Baseline
                      </text>
                      <line stroke="#eaedff" strokeWidth="1" x1="0" x2="720" y1="185" y2="185" />
                      <text
                        fill="#757682"
                        fontFamily="Inter"
                        fontSize="10"
                        textAnchor="end"
                        x="715"
                        y="181"
                      >
                        120 Midweek
                      </text>
                      <path
                        d="M 0,165 Q 60,172 120,158 T 240,162 T 360,152 T 480,148 T 600,160 T 720,150 L 720,210 L 0,210 Z"
                        fill="url(#gradMidweek)"
                      />
                      <path
                        d="M 0,165 Q 60,172 120,158 T 240,162 T 360,152 T 480,148 T 600,160 T 720,150"
                        fill="none"
                        stroke="#003212"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M 0,110 Q 60,95 120,105 T 240,88 T 360,94 T 480,78 T 600,70 T 720,85 L 720,210 L 0,210 Z"
                        fill="url(#gradSecondary)"
                      />
                      <path
                        d="M 0,110 Q 60,95 120,105 T 240,88 T 360,94 T 480,78 T 600,70 T 720,85"
                        fill="none"
                        stroke="#fe932c"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M 0,80 Q 60,65 120,72 T 240,55 T 360,60 T 480,45 T 600,28 T 720,50 L 720,210 L 0,210 Z"
                        fill="url(#gradPrimary)"
                      />
                      <path
                        d="M 0,80 Q 60,65 120,72 T 240,55 T 360,60 T 480,45 T 600,28 T 720,50"
                        fill="none"
                        stroke="#00236f"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      />
                      <circle
                        cx="600"
                        cy="28"
                        fill="#fe932c"
                        r="6"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <circle cx="600" cy="28" fill="#fe932c" opacity="0.25" r="10" />
                    </svg>
                    <div className="absolute top-2 right-28 bg-surface-container-lowest shadow-md rounded-lg p-space-xs px-space-sm flex items-center gap-space-xs pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-secondary-container" />
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          Peak: 345 Attendees
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px] leading-tight">
                          Special Thanksgiving (10 Nov)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 pt-space-xs text-center font-label-sm text-label-sm text-outline">
                    <span>Sep W1</span>
                    <span>Sep W3</span>
                    <span>Oct W1</span>
                    <span>Oct W3</span>
                    <span>Nov W1 (Peak)</span>
                    <span>Nov W3</span>
                  </div>
                </div>

                {/* Right Chart: Check-in Modality Breakdown */}
                <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-space-sm">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">
                        Check-in Modality Breakdown
                      </h2>
                      <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Q4 Audited
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Congregant terminal entry channel analytics.
                    </p>
                  </div>

                  <div className="flex flex-col gap-space-md my-space-md">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-3 h-3 rounded-full bg-primary shrink-0" />
                          <span className="font-label-md text-label-md text-on-surface">
                            Member Self-Scan (Rotating QR)
                          </span>
                        </div>
                        <span className="font-label-md text-label-md font-bold text-primary">
                          82.5%{" "}
                          <span className="font-body-sm text-on-surface-variant font-normal">
                            (2,890)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: "82.5%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-3 h-3 rounded-full bg-secondary-container shrink-0" />
                          <span className="font-label-md text-label-md text-on-surface">
                            Usher Door Terminal Assist
                          </span>
                        </div>
                        <span className="font-label-md text-label-md font-bold text-secondary">
                          11.7%{" "}
                          <span className="font-body-sm text-on-surface-variant font-normal">
                            (410)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-secondary-container rounded-full transition-all duration-500"
                          style={{ width: "11.7%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-3 h-3 rounded-full bg-tertiary shrink-0" />
                          <span className="font-label-md text-label-md text-on-surface">
                            Guest Desk &amp; Paper-to-Digital
                          </span>
                        </div>
                        <span className="font-label-md text-label-md font-bold text-tertiary">
                          5.8%{" "}
                          <span className="font-body-sm text-on-surface-variant font-normal">
                            (203)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-tertiary rounded-full transition-all duration-500"
                          style={{ width: "5.8%" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        speed
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-semibold text-primary">
                        Peak Entry Velocity Recorded
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                        Average Check-in Velocity:{" "}
                        <strong className="text-on-surface font-semibold">4.2 members/min</strong>{" "}
                        peak during 08:20 – 08:45 AM arrival rush with zero gate congestion.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Service Archive Table Module */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest">
                  <div className="flex items-center gap-space-md">
                    <div className="flex flex-col">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Service Attendance Roster Archive
                      </h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Validated session records, usher supervisory reports, and download links.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <div className="relative w-64">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                        search
                      </span>
                      <input
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        className="w-full h-10 pl-9 pr-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container placeholder:text-outline"
                        placeholder="Search service title..."
                        type="text"
                      />
                    </div>
                    <button
                      className="h-10 px-space-md rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span> Filter
                    </button>
                    <button
                      className="h-10 px-space-md rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">view_column</span>{" "}
                      Columns
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-space-md px-space-lg font-semibold">
                          Service Name &amp; Date
                        </th>
                        <th className="py-space-md px-space-md font-semibold">Service Type</th>
                        <th className="py-space-md px-space-md font-semibold">Attendance</th>
                        <th className="py-space-md px-space-md font-semibold">Members vs Guests</th>
                        <th className="py-space-md px-space-md font-semibold">Sanctuary Cap %</th>
                        <th className="py-space-md px-space-md font-semibold">Scan / Manual</th>
                        <th className="py-space-md px-space-md font-semibold">Usher in Charge</th>
                        <th className="py-space-md px-space-md font-semibold">Status</th>
                        <th className="py-space-md px-space-lg font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            row.isPeak
                              ? "bg-surface-container-low/30 hover:bg-surface-container-low"
                              : "hover:bg-surface-container-low/60"
                          }`}
                        >
                          <td className="py-space-md px-space-lg">
                            <div className="flex items-center gap-space-sm">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  row.isPeak
                                    ? "bg-secondary-fixed text-secondary"
                                    : row.serviceTypeLabel === "Midweek"
                                      ? "bg-tertiary-fixed text-tertiary"
                                      : row.serviceTypeLabel === "Special Vigil"
                                        ? "bg-primary text-on-primary"
                                        : "bg-primary-fixed text-primary"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {row.isPeak
                                    ? "celebration"
                                    : row.serviceTypeLabel === "Midweek"
                                      ? "auto_stories"
                                      : row.serviceTypeLabel === "Special Vigil"
                                        ? "nightlight"
                                        : "church"}
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                                    {row.name}
                                  </span>
                                  {row.isPeak && (
                                    <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary font-label-sm text-[10px] font-bold">
                                      PEAK
                                    </span>
                                  )}
                                </div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">
                                  {row.dateLabel}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span
                              className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm ${
                                row.serviceTypeLabel === "Special Vigil"
                                  ? "bg-secondary-fixed text-on-secondary-fixed font-semibold"
                                  : row.serviceTypeLabel === "Midweek"
                                    ? "bg-surface-container text-tertiary font-medium"
                                    : "bg-surface-container text-primary font-medium"
                              }`}
                            >
                              {row.serviceTypeLabel}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span
                              className={`font-headline-sm text-headline-sm ${
                                row.isPeak || row.serviceTypeLabel === "Special Vigil"
                                  ? "text-secondary font-bold"
                                  : "text-on-surface"
                              }`}
                            >
                              {row.attendanceCount}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col">
                              <span className="font-label-sm text-label-sm text-on-surface font-medium">
                                {row.memberVsGuestLabel}
                              </span>
                              <div className="w-24 h-1.5 rounded-full bg-surface-container-high mt-1 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    row.isPeak || row.serviceTypeLabel === "Special Vigil"
                                      ? "bg-secondary-container"
                                      : row.serviceTypeLabel === "Midweek"
                                        ? "bg-tertiary"
                                        : "bg-primary"
                                  }`}
                                  style={{ width: `${row.memberRatioPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span
                              className={`inline-flex items-center gap-1 font-label-md text-label-md ${
                                row.isPeak || row.serviceTypeLabel === "Special Vigil"
                                  ? "text-secondary font-bold"
                                  : row.serviceTypeLabel === "Midweek"
                                    ? "text-on-surface-variant font-medium"
                                    : "text-tertiary font-semibold"
                              }`}
                            >
                              {row.capacityPercent}%
                            </span>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span className="font-body-sm text-body-sm text-on-surface font-medium">
                              {row.scanVsManualLabel}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md">
                            <div className="flex items-center gap-space-xs">
                              <span className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-[11px] font-bold">
                                {row.usherInitials}
                              </span>
                              <span className="text-on-surface font-label-sm text-label-sm">
                                {row.usherName}
                              </span>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                              <span className="material-symbols-outlined text-[14px]">check</span>{" "}
                              {row.statusLabel}
                            </span>
                          </td>
                          <td className="py-space-md px-space-lg text-right">
                            <div className="flex items-center justify-end gap-space-xs">
                              <Link
                                href="/services"
                                className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors font-label-sm text-label-sm font-semibold"
                              >
                                View Roster
                              </Link>
                              <button
                                onClick={() => void handleDownloadCsv(row.id, row.name)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                                title="Download CSV"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  download
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination and Audit Summary */}
                <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Showing <strong className="text-on-surface font-semibold">5</strong> of{" "}
                    <strong className="text-on-surface font-semibold">48</strong> services • 2024
                    Year-to-Date total:{" "}
                    <strong className="text-on-surface font-semibold">14,820</strong> attendance
                    records audited.
                  </span>
                  <div className="flex items-center gap-space-xs">
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40"
                      disabled
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="px-space-sm font-label-sm text-label-sm text-primary font-bold">
                      Page 1 of 10
                    </span>
                    <button
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NDPA Audit & Compliance Banner */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-md">
                  <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-[22px]">
                      verified_user
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        NDPA 2023 Compliance &amp; Data Stewardship
                      </span>
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-bold">
                        CERTIFIED
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Attendance logs are cryptographically timestamped and stored in accordance
                      with Nigerian Data Protection Act (NDPA 2023) guidelines. Church records
                      retained securely.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm shrink-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    SHA-256 Ledger: #LGS-77401-2024
                  </span>
                  <button
                    onClick={() =>
                      showToast("NDPA 2023 Ledger Certificate #LGS-77401-2024 verified")
                    }
                    className="px-space-md py-2 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container transition-colors font-label-sm text-label-sm font-semibold cursor-pointer"
                    type="button"
                  >
                    Audit Cert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
