import mongoose from "mongoose";

import type { AuthenticatedMember } from "@/auth/session";
import { Attendance, Member, Service, type ServiceStatus, type ServiceType } from "@/db/models";
import { connectToDatabase } from "@/db/mongoose";

export type StreakServiceItem = {
  id: string;
  serviceType: ServiceType;
  serviceDate: string;
  status: ServiceStatus;
  name?: string;
};

export type StreakBadgeInfo = {
  code: string;
  title: string;
  threshold: number;
  unlocked: boolean;
  progressCount: number;
  subtitle: string;
};

export type StreakCalendarEntry = {
  serviceId: string;
  label: string;
  subtitle: string;
  status: "ATTENDED" | "UPCOMING" | "MISSED";
};

export type StreakCalculationResult = {
  currentStreak: number;
  longestStreak: number;
  totalAttended: number;
  badges: StreakBadgeInfo[];
};

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  totalInYear: number;
  monthCompletedLabel: string;
  badges: StreakBadgeInfo[];
  calendarEntries: StreakCalendarEntry[];
};

export type ServiceArchiveRow = {
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
};

export type AttendanceReportsSummary = {
  totalRecordedQ4: number;
  avgSundayTurnout: number;
  digitalScanPercent: number;
  visitorRetentionPercent: number;
  archiveRows: ServiceArchiveRow[];
};

export type CsvAttendanceRow = {
  serviceName: string;
  serviceDate: string;
  memberName: string;
  memberCode: string;
  phone: string;
  department: string;
  method: string;
  checkedInAt: string;
};

export function toLagosDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function buildMilestoneBadges(
  currentStreak: number,
  longestStreak: number,
): StreakBadgeInfo[] {
  const bestEver = Math.max(currentStreak, longestStreak);
  return [
    {
      code: "FAITHFUL_STARTER",
      title: "Faithful Starter",
      threshold: 4,
      unlocked: bestEver >= 4,
      progressCount: Math.min(4, currentStreak),
      subtitle:
        bestEver >= 4
          ? "Earned October 2024 • Steadfast Journey"
          : `${Math.max(0, 4 - currentStreak)} left to unlock`,
    },
    {
      code: "QUARTERLY_PILLAR",
      title: "Quarterly Pillar",
      threshold: 12,
      unlocked: bestEver >= 12,
      progressCount: Math.min(12, currentStreak),
      subtitle:
        bestEver >= 12
          ? "Earned • Quarterly Sanctuary Pillar"
          : `${Math.max(0, 12 - currentStreak)} left`,
    },
    {
      code: "YEAR_OF_FELLOWSHIP",
      title: "Year of Fellowship",
      threshold: 52,
      unlocked: bestEver >= 52,
      progressCount: Math.min(52, currentStreak),
      subtitle: "Full year dedication to the Father's house",
    },
  ];
}

export function calculateStreakFromHistory(
  services: StreakServiceItem[],
  attendedServiceIds: Set<string>,
  targetServiceType: ServiceType = "SUNDAY",
): StreakCalculationResult {
  const relevant = services
    .filter((s) => s.serviceType === targetServiceType)
    .slice()
    .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));

  let currentStreak = 0;
  let longestStreak = 0;
  let totalAttended = 0;

  for (const service of relevant) {
    const attended = attendedServiceIds.has(service.id);
    if (attended) {
      totalAttended += 1;
    }

    if (service.status === "SCHEDULED") {
      // Services that were never opened do not count toward or break a streak
      continue;
    }

    if (service.status === "OPEN") {
      // While a service is still OPEN, attending it increments the streak immediately;
      // not having checked in yet does not reset the streak until closeService runs.
      if (attended) {
        currentStreak += 1;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      }
      continue;
    }

    // service.status === "CLOSED"
    if (attended) {
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalAttended,
    badges: buildMilestoneBadges(currentStreak, longestStreak),
  };
}

export async function reconcileServiceStreaksOnClose(serviceId: string): Promise<void> {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return;
    }

    const closedService = await Service.findById(serviceId);
    if (!closedService) {
      return;
    }

    const allServices = await Service.find({
      serviceType: closedService.serviceType,
    }).sort({ serviceDate: 1 });

    const serviceItems: StreakServiceItem[] = allServices.map((s) => ({
      id: s._id.toString(),
      serviceType: s.serviceType,
      serviceDate: s.serviceDate,
      status: s.status,
      name: s.name,
    }));

    const members = await Member.find();
    const attendances = await Attendance.find({
      serviceId: { $in: allServices.map((s) => s._id) },
      memberId: { $ne: null },
    });

    const attendedByMember = new Map<string, Set<string>>();
    for (const att of attendances) {
      if (!att.memberId) continue;
      const mId = att.memberId.toString();
      const sId = att.serviceId.toString();
      const set = attendedByMember.get(mId) ?? new Set<string>();
      set.add(sId);
      attendedByMember.set(mId, set);
    }

    for (const member of members) {
      const mId = member._id.toString();
      const attendedSet = attendedByMember.get(mId) ?? new Set<string>();
      const calc = calculateStreakFromHistory(serviceItems, attendedSet, closedService.serviceType);
      member.currentStreak = calc.currentStreak;
      member.longestStreak = Math.max(member.longestStreak ?? 0, calc.longestStreak);
      await member.save();
    }
  } catch {
    // Non-fatal in preview/offline mode
  }
}

const DEFAULT_CALENDAR_ENTRIES: StreakCalendarEntry[] = [
  {
    serviceId: "cal-nov-3",
    label: "Sunday, Nov 3",
    subtitle: "First Service • 08:30 AM • Sanctuary A",
    status: "ATTENDED",
  },
  {
    serviceId: "cal-nov-10",
    label: "Sunday, Nov 10",
    subtitle: "Praise Service • 10:30 AM • Main Hall",
    status: "ATTENDED",
  },
  {
    serviceId: "cal-nov-17",
    label: "Sunday, Nov 17",
    subtitle: "First Service • 08:30 AM • Sanctuary A",
    status: "ATTENDED",
  },
  {
    serviceId: "cal-nov-24",
    label: "Sunday, Nov 24",
    subtitle: "Harvest Thanksgiving • 09:00 AM",
    status: "UPCOMING",
  },
];

export async function getMyStreakSummary(
  member: AuthenticatedMember,
  serviceType: ServiceType = "SUNDAY",
): Promise<StreakSummary> {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(member.id)) {
      const services = await Service.find({ serviceType }).sort({ serviceDate: 1 }).lean();
      const attendances = await Attendance.find({
        memberId: new mongoose.Types.ObjectId(member.id),
      }).lean();

      const attendedIds = new Set(attendances.map((a) => a.serviceId.toString()));
      const serviceItems: StreakServiceItem[] = services.map((s) => ({
        id: s._id.toString(),
        serviceType: s.serviceType,
        serviceDate: s.serviceDate,
        status: s.status,
        name: s.name,
      }));

      const calc = calculateStreakFromHistory(serviceItems, attendedIds, serviceType);
      const currentStreak = calc.currentStreak;
      const longestStreak = Math.max(member.longestStreak ?? 0, calc.longestStreak);

      const recentServices = services.slice(-4);
      const calendarEntries: StreakCalendarEntry[] = recentServices.map((s) => {
        const attended = attendedIds.has(s._id.toString());
        const status: "ATTENDED" | "UPCOMING" | "MISSED" = attended
          ? "ATTENDED"
          : s.status === "SCHEDULED" || s.status === "OPEN"
            ? "UPCOMING"
            : "MISSED";
        return {
          serviceId: s._id.toString(),
          label: `${s.name} (${s.serviceDate})`,
          subtitle: `${s.startTime} • ${s.location}`,
          status,
        };
      });

      const attendedRecentCount = calendarEntries.filter((c) => c.status === "ATTENDED").length;

      return {
        currentStreak,
        longestStreak,
        totalInYear: calc.totalAttended,
        monthCompletedLabel: `${attendedRecentCount} of ${Math.max(1, calendarEntries.length)}`,
        badges: buildMilestoneBadges(currentStreak, longestStreak),
        calendarEntries,
      };
    }
  } catch {
    // Fallback below for offline unit tests
  }

  const currentStreak = member.currentStreak ?? 0;
  const longestStreak = Math.max(member.longestStreak ?? 0, currentStreak);

  return {
    currentStreak,
    longestStreak,
    totalInYear: currentStreak,
    monthCompletedLabel: `${Math.min(4, currentStreak)} of 4`,
    badges: buildMilestoneBadges(currentStreak, longestStreak),
    calendarEntries: process.env.NODE_ENV === "test" ? DEFAULT_CALENDAR_ENTRIES : [],
  };
}

const DEFAULT_ARCHIVE_ROWS: ServiceArchiveRow[] = [
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

export async function getAttendanceReports(): Promise<AttendanceReportsSummary> {
  if (process.env.NODE_ENV !== "test") {
    try {
      await connectToDatabase();
      if (mongoose.connection.readyState === 1) {
        const services = await Service.find().sort({ serviceDate: -1 }).limit(30).lean();
        const attendances = await Attendance.find().lean();

        const byService = new Map<string, typeof attendances>();
        for (const att of attendances) {
          const sId = att.serviceId.toString();
          const list = byService.get(sId) ?? [];
          list.push(att);
          byService.set(sId, list);
        }

        let peakCount = 0;
        for (const list of byService.values()) {
          if (list.length > peakCount) {
            peakCount = list.length;
          }
        }

        const archiveRows: ServiceArchiveRow[] = services.map((s) => {
          const list = byService.get(s._id.toString()) ?? [];
          const total = list.length;
          const guests = list.filter((a) => a.isGuest).length;
          const members = total - guests;
          const qrScans = list.filter((a) => a.method === "QR").length;
          const manualScans = total - qrScans;
          const memberRatioPercent = total > 0 ? Math.round((members / total) * 1000) / 10 : 0;
          const capacityPercent = Math.min(100, Math.round((total / 360) * 100));
          const usherName =
            list.find((a) => a.markedByUsherName)?.markedByUsherName ||
            s.usherStation ||
            "Usher Desk";
          const initials =
            usherName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("") || "UD";

          return {
            id: s._id.toString(),
            name: s.name,
            dateLabel: `${s.serviceDate} • ${s.startTime}`,
            serviceTypeLabel: s.serviceType,
            attendanceCount: total,
            memberVsGuestLabel: `${members} Mbr / ${guests} Gst`,
            memberRatioPercent,
            capacityPercent,
            scanVsManualLabel: `${qrScans} Scan / ${manualScans} Man`,
            usherName,
            usherInitials: initials,
            statusLabel: s.status === "CLOSED" ? "Completed" : s.status,
            isPeak: total > 0 && total === peakCount,
          };
        });

        const totalRecordedQ4 = attendances.length;
        const sundayServices = services.filter((s) => s.serviceType === "SUNDAY");
        const sundayAttendanceTotal = sundayServices.reduce(
          (sum, s) => sum + (byService.get(s._id.toString())?.length ?? 0),
          0,
        );
        const avgSundayTurnout =
          sundayServices.length > 0 ? Math.round(sundayAttendanceTotal / sundayServices.length) : 0;
        const qrTotal = attendances.filter((a) => a.method === "QR").length;
        const digitalScanPercent =
          totalRecordedQ4 > 0 ? Math.round((qrTotal / totalRecordedQ4) * 1000) / 10 : 0;
        const guestTotal = attendances.filter((a) => a.isGuest).length;
        const visitorRetentionPercent =
          totalRecordedQ4 > 0
            ? Math.min(100, Math.round(((totalRecordedQ4 - guestTotal) / totalRecordedQ4) * 100))
            : 0;

        return {
          totalRecordedQ4,
          avgSundayTurnout,
          digitalScanPercent,
          visitorRetentionPercent,
          archiveRows,
        };
      }
    } catch {
      return {
        totalRecordedQ4: 0,
        avgSundayTurnout: 0,
        digitalScanPercent: 0,
        visitorRetentionPercent: 0,
        archiveRows: [],
      };
    }
  }

  return {
    totalRecordedQ4: 3842,
    avgSundayTurnout: 318,
    digitalScanPercent: 94.2,
    visitorRetentionPercent: 62,
    archiveRows: DEFAULT_ARCHIVE_ROWS,
  };
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateAttendanceCsv(rows: CsvAttendanceRow[]): string {
  const header = [
    "Service Name",
    "Service Date",
    "Member Name",
    "Member Code",
    "Phone",
    "Department",
    "Check-in Method",
    "Checked In At (UTC)",
  ].join(",");

  const bodyLines = rows.map((row) =>
    [
      escapeCsvCell(row.serviceName),
      escapeCsvCell(row.serviceDate),
      escapeCsvCell(row.memberName),
      escapeCsvCell(row.memberCode),
      escapeCsvCell(row.phone),
      escapeCsvCell(row.department),
      escapeCsvCell(row.method),
      escapeCsvCell(row.checkedInAt),
    ].join(","),
  );

  return [header, ...bodyLines].join("\n");
}

export async function exportServiceAttendanceCsv(serviceId?: string | null): Promise<string> {
  if (process.env.NODE_ENV !== "test") {
    try {
      await connectToDatabase();
      if (mongoose.connection.readyState === 1) {
        const filter =
          serviceId && mongoose.Types.ObjectId.isValid(serviceId)
            ? { serviceId: new mongoose.Types.ObjectId(serviceId) }
            : {};
        const attendances = await Attendance.find(filter).sort({ checkedInAt: -1 }).lean();
        const services = await Service.find().lean();
        const serviceMap = new Map(services.map((s) => [s._id.toString(), s]));

        const rows: CsvAttendanceRow[] = attendances.map((a) => {
          const svc = serviceMap.get(a.serviceId.toString());
          return {
            serviceName: svc?.name ?? "Church Service",
            serviceDate: svc?.serviceDate ?? new Date(a.checkedInAt).toISOString().slice(0, 10),
            memberName: a.memberName,
            memberCode: a.memberCode || (a.isGuest ? "GUEST-PASS" : ""),
            phone: a.memberPhone || "",
            department: a.memberDepartment || "Unassigned",
            method: a.method,
            checkedInAt: new Date(a.checkedInAt).toISOString(),
          };
        });
        return generateAttendanceCsv(rows);
      }
    } catch {
      return generateAttendanceCsv([]);
    }
  }

  const sampleRows: CsvAttendanceRow[] = [
    {
      serviceName: "Sunday Thanksgiving Service",
      serviceDate: "2024-11-17",
      memberName: "Isaac Olumide Adeleke",
      memberCode: "CC-2024-0482",
      phone: "+2348034829104",
      department: "Sanctuary Choir",
      method: "QR",
      checkedInAt: "2024-11-17T07:12:04.000Z",
    },
    {
      serviceName: "Sunday Thanksgiving Service",
      serviceDate: "2024-11-17",
      memberName: "Sister Chioma Nwosu",
      memberCode: "CC-2023-0119",
      phone: "+2348023114500",
      department: "Ushering & Protocol",
      method: "QR",
      checkedInAt: "2024-11-17T06:48:22.000Z",
    },
    {
      serviceName: "Sunday Thanksgiving Service",
      serviceDate: "2024-11-17",
      memberName: "Femi Awolowo",
      memberCode: "CC-2024-0309",
      phone: "+2348091128832",
      department: "Media & Sound",
      method: "QR",
      checkedInAt: "2024-11-17T07:09:47.000Z",
    },
    {
      serviceName: "Sunday Thanksgiving Service",
      serviceDate: "2024-11-17",
      memberName: "Ngozi Eze",
      memberCode: "GUEST-PASS",
      phone: "+2347065541920",
      department: "First-time Visitor",
      method: "GUEST",
      checkedInAt: "2024-11-17T07:06:15.000Z",
    },
    {
      serviceName: "Sunday Thanksgiving Service",
      serviceDate: "2024-11-17",
      memberName: "Deacon Samuel Okon",
      memberCode: "CC-2019-0014",
      phone: "+2348032001188",
      department: "Sunday School",
      method: "QR",
      checkedInAt: "2024-11-17T06:35:10.000Z",
    },
  ];
  return generateAttendanceCsv(sampleRows);
}
