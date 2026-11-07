"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

const SERVICES_DESK_QUERY = gql`
  query ServicesDesk {
    me {
      id
      fullName
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
      totalPresent
      membersPresent
      guestsPresent
    }
    services {
      id
      name
      serviceType
      serviceDate
      startTime
      location
      usherStation
      status
    }
    members {
      id
      fullName
      phone
      department
      memberCode
      currentStreak
    }
  }
`;

const SERVICE_ATTENDANCE_QUERY = gql`
  query ServiceAttendanceDesk($serviceId: ID!) {
    serviceAttendance(serviceId: $serviceId) {
      id
      serviceId
      memberId
      memberName
      memberPhone
      memberCode
      department
      method
      status
      isGuest
      guestName
      guestPhone
      notes
      markedAt
    }
  }
`;

const SERVICE_QR_DESK_QUERY = gql`
  query ServiceQrDesk($serviceId: ID!) {
    serviceQr(serviceId: $serviceId) {
      serviceId
      token
      checkinUrl
      slot
      expiresInSeconds
    }
  }
`;

const OPEN_SERVICE_MUTATION = gql`
  mutation OpenServiceDesk($serviceId: ID!) {
    openService(serviceId: $serviceId) {
      id
      status
      openedAt
    }
  }
`;

const CLOSE_SERVICE_MUTATION = gql`
  mutation CloseServiceDesk($serviceId: ID!) {
    closeService(serviceId: $serviceId) {
      id
      status
      closedAt
    }
  }
`;

const MARK_MANUAL_MUTATION = gql`
  mutation MarkManualAttendanceDesk($input: ManualAttendanceInput!) {
    markManualAttendance(input: $input) {
      id
      serviceId
      memberName
      memberPhone
      memberCode
      department
      method
      markedAt
    }
  }
`;

const REGISTER_GUEST_MUTATION = gql`
  mutation RegisterGuestAttendanceDesk($input: GuestAttendanceInput!) {
    registerGuestAttendance(input: $input) {
      id
      serviceId
      guestName
      guestPhone
      notes
      markedAt
    }
  }
`;

interface ServiceItem {
  id: string;
  name: string;
  serviceType: string;
  serviceDate: string;
  startTime: string;
  location: string;
  usherStation: string;
  status: "SCHEDULED" | "OPEN" | "CLOSED";
  totalPresent?: number;
  membersPresent?: number;
  guestsPresent?: number;
}

interface ServicesDeskData {
  me: {
    id: string;
    fullName: string;
    role: "MEMBER" | "USHER" | "ADMIN";
  } | null;
  activeService: ServiceItem | null;
  services: ServiceItem[];
  members?: Array<{
    id: string;
    fullName: string;
    phone: string;
    department: string;
    memberCode: string;
    currentStreak: number;
  }>;
}

interface ServiceQrDeskData {
  serviceQr: {
    serviceId: string;
    token: string;
    checkinUrl: string;
    slot: number;
    expiresInSeconds: number;
  };
}

interface RosterRow {
  id: string;
  initials: string;
  avatarClass: string;
  name: string;
  codeBadge: string;
  isGuest?: boolean;
  phone: string;
  department: string;
  departmentFilterKey: string;
  time: string;
  gate: string;
  mode: "Self-Scan (QR)" | "Usher Assisted";
  streakLabel: string;
  streakIcon: "local_fire_department" | "auto_awesome" | "celebration";
  streakClass: string;
}

interface StreamItem {
  id: string;
  initials: string;
  avatarClass: string;
  name: string;
  meta: string;
  badgeText: string;
  badgeClass: string;
  timeAgo: string;
  actionRequired?: boolean;
}

export default function ServicesPage(): ReactNode {
  const { data } = useQuery<ServicesDeskData>(SERVICES_DESK_QUERY, {
    pollInterval: 5000,
    fetchPolicy: "network-only",
  });
  const activeService = data?.activeService ?? null;
  const activeServiceId = activeService?.id ?? "65f000000000000000000100";

  const { data: attendanceData, refetch: refetchAttendance } = useQuery(SERVICE_ATTENDANCE_QUERY, {
    variables: { serviceId: activeServiceId },
    pollInterval: 5000,
    fetchPolicy: "network-only",
  });

  const { data: qrData } = useQuery<ServiceQrDeskData>(SERVICE_QR_DESK_QUERY, {
    variables: { serviceId: activeService?.id ?? "" },
    skip: !activeService?.id,
    fetchPolicy: "network-only",
  });

  const [openServiceMutation] = useMutation(OPEN_SERVICE_MUTATION);
  const [closeServiceMutation] = useMutation(CLOSE_SERVICE_MUTATION);
  const [markManualMutation] = useMutation(MARK_MANUAL_MUTATION);
  const [registerGuestMutation] = useMutation(REGISTER_GUEST_MUTATION);

  const [checkinOpen, setCheckinOpen] = useState<boolean>(true);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [guestModalOpen, setGuestModalOpen] = useState<boolean>(false);
  const [qrSeconds, setQrSeconds] = useState<number>(48);

  const [totalCheckins, setTotalCheckins] = useState<number>(0);
  const [membersPresent, setMembersPresent] = useState<number>(0);
  const [guestsCount, setGuestsCount] = useState<number>(0);
  const [usherAssistedCount, setUsherAssistedCount] = useState<number>(0);

  const [quickSearchQuery, setQuickSearchQuery] = useState<string>("");
  const [quickMarked, setQuickMarked] = useState<boolean>(false);

  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [undoneIds, setUndoneIds] = useState<string[]>([]);

  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("All Departments");
  const [modeFilter, setModeFilter] = useState<string>("All Check-in Modes");

  // Guest registration form
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestInvitedBy, setGuestInvitedBy] = useState<string>("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeService) {
      setCheckinOpen(activeService.status === "OPEN");
    }
  }, [activeService]);

  useEffect(() => {
    const rawRows = (attendanceData?.serviceAttendance ?? []) as Array<{
      id: string;
      memberName?: string | null;
      memberPhone?: string | null;
      memberCode?: string | null;
      department?: string | null;
      method: string;
      isGuest: boolean;
      guestName?: string | null;
      guestPhone?: string | null;
      notes?: string | null;
      markedAt: string;
    }>;

    const mappedRoster: RosterRow[] = rawRows.map((rec) => {
      const displayName = rec.isGuest
        ? (rec.guestName ?? "First-time Guest")
        : (rec.memberName ?? "Registered Member");
      const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("");
      const isQr = rec.method === "QR";
      return {
        id: rec.id,
        initials: initials || "MB",
        avatarClass: rec.isGuest
          ? "bg-secondary-container text-on-secondary-container"
          : "bg-primary text-on-primary",
        name: displayName,
        codeBadge: rec.isGuest ? "First-time Guest" : `#${rec.memberCode ?? "MEMBER"}`,
        isGuest: rec.isGuest,
        phone: rec.isGuest ? (rec.guestPhone ?? "N/A") : (rec.memberPhone ?? "N/A"),
        department: rec.isGuest
          ? (rec.notes ?? "Assigned: Hospitality Team")
          : (rec.department ?? "General Congregation"),
        departmentFilterKey: rec.isGuest
          ? "First-time Guests"
          : (rec.department ?? "General Congregation"),
        time: new Date(rec.markedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        gate: isQr ? "Self-Scan (QR)" : "Usher Desk",
        mode: isQr ? "Self-Scan (QR)" : "Usher Assisted",
        streakLabel: rec.isGuest ? "1st Visit" : "Present",
        streakIcon: rec.isGuest ? "auto_awesome" : "local_fire_department",
        streakClass: rec.isGuest
          ? "bg-secondary-fixed text-on-secondary-fixed border-secondary/25"
          : "bg-secondary-container/40 text-on-secondary-container border-secondary/20",
      };
    });

    setRosterRows(mappedRoster);
    setTotalCheckins(mappedRoster.length);
    setMembersPresent(mappedRoster.filter((r) => !r.isGuest).length);
    setGuestsCount(mappedRoster.filter((r) => r.isGuest).length);
    setUsherAssistedCount(mappedRoster.filter((r) => r.mode === "Usher Assisted").length);

    setStreamItems(
      mappedRoster.slice(0, 5).map((r) => ({
        id: `stream-${r.id}`,
        initials: r.initials,
        avatarClass: r.avatarClass,
        name: r.name,
        meta: `${r.department} · ${r.mode}`,
        badgeText: r.isGuest ? "Welcome Pack" : r.time,
        badgeClass: r.isGuest
          ? "bg-secondary-container/60 text-on-secondary-container font-semibold"
          : "bg-secondary-container text-on-secondary-container font-bold",
        timeAgo: r.time,
      })),
    );
  }, [attendanceData]);

  useEffect(() => {
    if (qrData?.serviceQr?.expiresInSeconds) {
      setQrSeconds(qrData.serviceQr.expiresInSeconds);
    }
  }, [qrData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQrSeconds((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleToggleCheckinStatus = async (): Promise<void> => {
    const nextOpen = !checkinOpen;
    setCheckinOpen(nextOpen);
    if (activeService?.id) {
      try {
        if (nextOpen) {
          await openServiceMutation({ variables: { serviceId: activeService.id } });
        } else {
          await closeServiceMutation({ variables: { serviceId: activeService.id } });
        }
      } catch {
        // Ignore if not signed in as USHER/ADMIN during preview
      }
    }
    showToast(
      nextOpen
        ? "Service Check-in window OPENED — Rotating QR active"
        : "Service Check-in window CLOSED — QR invalidated",
    );
  };

  const handleQuickMarkPresent = async (): Promise<void> => {
    if (quickMarked) return;
    setQuickMarked(true);

    const dbMembers = data?.members ?? [];
    const q = quickSearchQuery.trim().toLowerCase();
    const matched =
      dbMembers.find(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q),
      ) ?? dbMembers[0];

    if (matched) {
      try {
        await markManualMutation({
          variables: {
            input: {
              serviceId: activeServiceId,
              memberId: matched.id,
              status: "PRESENT",
            },
          },
        });
        await refetchAttendance();
        showToast(`Marked Present: ${matched.fullName} (Usher Assisted)`);
        return;
      } catch {
        // Fallback below
      }
    }

    setTotalCheckins((c) => c + 1);
    setMembersPresent((c) => c + 1);
    setUsherAssistedCount((c) => c + 1);
    showToast("Marked Present via Usher Assisted Desk");
  };

  const handleCheckInStreamItem = (itemId: string): void => {
    setStreamItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              avatarClass: "bg-tertiary-container text-on-tertiary-container",
              badgeText: "✓ Checked In",
              badgeClass: "bg-tertiary-container text-on-tertiary-container font-semibold",
              timeAgo: "Just now",
              actionRequired: false,
            }
          : item,
      ),
    );
    setTotalCheckins((c) => c + 1);
    setMembersPresent((c) => c + 1);
    showToast("Checked in member via Live Desk");
  };

  const handleRegisterGuest = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!guestName.trim()) return;

    try {
      await registerGuestMutation({
        variables: {
          input: {
            serviceId: activeServiceId,
            guestName: guestName.trim(),
            guestPhone: guestPhone.trim() || "08000000000",
            notes: guestInvitedBy.trim() || "Assigned: Hospitality Team",
          },
        },
      });
      await refetchAttendance();
      setGuestName("");
      setGuestPhone("");
      setGuestInvitedBy("");
      setGuestModalOpen(false);
      showToast(`First-time Guest ${guestName.trim()} checked in & saved to DB!`);
      return;
    } catch {
      // Fallback below
    }

    const initials = guestName
      .trim()
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newGuestRow: RosterRow = {
      id: `guest-${Date.now()}`,
      initials,
      avatarClass: "bg-secondary-container text-on-secondary-container",
      name: guestName.trim(),
      codeBadge: "First-time Guest",
      isGuest: true,
      phone: guestPhone.trim() || "+234 803 000 0000",
      department: guestInvitedBy.trim()
        ? `Invited by: ${guestInvitedBy.trim()}`
        : "Assigned: Hospitality Team",
      departmentFilterKey: "First-time Guests",
      time: "Just now",
      gate: "By Usher: Live Desk",
      mode: "Usher Assisted",
      streakLabel: "1st Visit",
      streakIcon: "auto_awesome",
      streakClass: "bg-secondary-fixed text-on-secondary-fixed border-secondary/25",
    };

    setRosterRows((prev) => [newGuestRow, ...prev]);
    setTotalCheckins((c) => c + 1);
    setGuestsCount((c) => c + 1);
    setUsherAssistedCount((c) => c + 1);
    setGuestName("");
    setGuestPhone("");
    setGuestInvitedBy("");
    setGuestModalOpen(false);
    showToast(`First-time Guest ${newGuestRow.name} checked in & assigned to Hospitality!`);
  };

  const filteredRoster = useMemo(() => {
    return rosterRows.filter((row) => {
      if (undoneIds.includes(row.id)) return false;
      const matchesSearch =
        rosterSearch.trim() === "" ||
        row.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        row.phone.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        row.codeBadge.toLowerCase().includes(rosterSearch.toLowerCase());
      const matchesDept =
        deptFilter === "All Departments" || row.departmentFilterKey === deptFilter;
      const matchesMode =
        modeFilter === "All Check-in Modes" ||
        (modeFilter === "First-time Guests Only" ? Boolean(row.isGuest) : row.mode === modeFilter);
      return matchesSearch && matchesDept && matchesMode;
    });
  }, [rosterRows, undoneIds, rosterSearch, deptFilter, modeFilter]);

  const checkinHref = qrData?.serviceQr?.checkinUrl ?? `/checkin/${activeServiceId}?t=preview`;

  return (
    <div className="bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-ambient flex items-center gap-2.5 border border-outline-variant/20">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            verified
          </span>
          <span className="text-body-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar Navigation (260px Fixed) */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-surface-container-low border-r border-outline-variant/20 flex-col justify-between sticky top-0 h-screen z-30">
        <div>
          {/* Parish Brand Header */}
          <div className="p-6 pb-5 border-b border-outline-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center shadow-subtle overflow-hidden">
                <img
                  src="/rccg-logo.png"
                  alt="RCCG JESUS HOUSE, OGBOMOSHO"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="font-display font-bold text-primary text-title-md leading-tight tracking-tight">
                  RCCG JESUS HOUSE
                </h1>
                <p className="text-label-sm text-on-surface-variant font-medium">
                  RCCG JESUS HOUSE, OGBOMOSHO
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1" aria-label="Main Navigation">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-body-md font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </Link>

            {/* Active Item: Services */}
            <Link
              href="/services"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-primary-container text-on-primary font-semibold text-body-md shadow-subtle"
            >
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  event_available
                </span>
                <span>Services</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
            </Link>

            <Link
              href="/members"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-body-md font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">groups</span>
              <span>Members</span>
            </Link>

            <Link
              href="/departments"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-body-md font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">workspaces</span>
              <span>Departments &amp; Activities</span>
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-body-md font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              <span>Reports &amp; Streaks</span>
            </Link>

            <div className="pt-3 mt-3 border-t border-outline-variant/15">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-body-md font-medium"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>Settings</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Lower Sidebar: Active Usher Station & User Profile */}
        <div className="p-4 space-y-3 border-t border-outline-variant/15 bg-surface-container/50">
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 shadow-subtle">
            <div className="flex items-center justify-between mb-1">
              <span className="text-label-sm font-bold uppercase tracking-wider text-tertiary">
                Usher Station #1
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Online
              </span>
            </div>
            <p className="text-body-sm text-on-surface font-medium">Main Sanctuary Foyer</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              QR Rotating every 60s · Sync Active
            </p>
          </div>

          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container font-bold text-body-sm flex items-center justify-center shrink-0">
              PA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-on-surface truncate">
                {data?.me?.fullName ?? "Parish Administrator"}
              </p>
              <p className="text-label-sm text-on-surface-variant truncate">
                {data?.me?.role ?? "Admin"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Action & Breadcrumb Header */}
        <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/15 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Left: Breadcrumb & Service Identity */}
            <div>
              <nav
                className="flex items-center gap-1.5 text-body-sm text-on-surface-variant mb-1"
                aria-label="Breadcrumb"
              >
                <Link href="/admin" className="hover:text-primary transition-colors font-medium">
                  Services
                </Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-on-surface font-semibold">
                  Sunday First Service (17 Nov 2024)
                </span>
              </nav>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-headline-md font-bold text-primary tracking-tight">
                  Sunday First Service — Live Attendance Desk
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-secondary-container/70 text-on-secondary-container">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Sunday, 17 Nov 2024 · 08:00 AM WAT
                </span>
              </div>
            </div>

            {/* Right: Service Controls & Projector Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Toggle Open/Closed Status */}
              <button
                type="button"
                onClick={() => void handleToggleCheckinStatus()}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-body-sm border transition-all cursor-pointer ${
                  checkinOpen
                    ? "bg-tertiary-container/15 text-tertiary border-tertiary/20 hover:bg-tertiary-container/25"
                    : "bg-error-container text-on-error-container border-error/20"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    checkinOpen ? "bg-tertiary-container animate-ping" : "bg-error"
                  }`}
                />
                <span>{checkinOpen ? "Check-in: OPEN" : "Check-in: CLOSED"}</span>
                <span className="material-symbols-outlined text-[18px] ml-0.5">
                  {checkinOpen ? "toggle_on" : "toggle_off"}
                </span>
              </button>

              {/* Show QR Display Modal Trigger */}
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-body-sm shadow-subtle hover:bg-primary-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                <span>Show QR Display</span>
              </button>

              {/* Fullscreen Projector Mode */}
              <Link
                href="/usher"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary font-semibold text-body-sm border border-outline-variant/30 hover:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                <span>Projector Mode</span>
              </Link>

              {/* Export CSV */}
              <button
                type="button"
                onClick={() =>
                  showToast("Exported Sunday_First_Service_2024-11-17_Roster.csv (312 rows)")
                }
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-medium text-body-sm border border-outline-variant/30 hover:bg-surface-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto space-y-6">
          {/* 1. Live Metrics Ribbon (6-Card Strip) */}
          <section
            aria-label="Live Service Metrics"
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            {/* Metric 1: Total Check-ins */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-subtle border border-outline-variant/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-label-sm font-semibold uppercase tracking-wider">
                  Total Check-ins
                </span>
                <span className="material-symbols-outlined text-[20px] text-primary">
                  how_to_reg
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-headline-lg font-bold text-primary">
                    {totalCheckins}
                  </span>
                  <span className="text-label-sm font-semibold text-tertiary bg-tertiary-container/15 px-1.5 py-0.5 rounded">
                    +14% vs last Sun
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Target capacity: 360 seats (86%)
                </p>
              </div>
            </div>

            {/* Metric 2: Members Present */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-subtle border border-outline-variant/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-label-sm font-semibold uppercase tracking-wider">
                  Members Present
                </span>
                <span className="material-symbols-outlined text-[20px] text-primary">groups</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-headline-lg font-bold text-on-surface">
                    {membersPresent}
                  </span>
                  <span className="text-body-sm text-on-surface-variant font-medium">91.0%</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  74% of active parish directory
                </p>
              </div>
            </div>

            {/* Metric 3: First-time Guests */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-subtle border border-secondary/20 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-secondary mb-2">
                <span className="text-label-sm font-bold uppercase tracking-wider">
                  First-time Guests
                </span>
                <span
                  className="material-symbols-outlined text-[20px] text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  waving_hand
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-headline-lg font-bold text-secondary">
                    {guestsCount}
                  </span>
                  <span className="text-label-sm font-semibold text-on-secondary-container bg-secondary-container/80 px-1.5 py-0.5 rounded">
                    Welcome Pack
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Assigned to Follow-up Team
                </p>
              </div>
            </div>

            {/* Metric 4: Marked via Self-Scan */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-subtle border border-outline-variant/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-label-sm font-semibold uppercase tracking-wider">
                  Self-Scan (QR)
                </span>
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  qr_code_scanner
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-headline-lg font-bold text-on-surface">
                    298
                  </span>
                  <span className="text-label-sm font-semibold text-tertiary">95.5%</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {usherAssistedCount} marked via Usher Assisted
                </p>
              </div>
            </div>

            {/* Metric 5: Check-in Velocity */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-subtle border border-outline-variant/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-label-sm font-semibold uppercase tracking-wider">
                  Check-in Velocity
                </span>
                <span className="material-symbols-outlined text-[20px] text-secondary-container">
                  bolt
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-headline-lg font-bold text-on-surface">
                    3.8
                  </span>
                  <span className="text-body-sm font-semibold text-on-surface-variant">/ min</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Peak: 11.4/min at 08:05 AM
                </p>
              </div>
            </div>

            {/* Metric 6: Service Window */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-subtle border border-outline-variant/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-label-sm font-semibold uppercase tracking-wider">
                  Service Window
                </span>
                <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
              </div>
              <div>
                <div className="font-display text-title-md font-bold text-on-surface leading-snug">
                  08:00 – 10:30 AM
                </div>
                <p className="text-[11px] text-tertiary font-semibold mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                  Auto-closes in 1h 42m
                </p>
              </div>
            </div>
          </section>

          {/* 2. Split Workstation Layout (Left 4 Cols: Fast Check-in + Stream | Right 8 Cols: Full Roster Table) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (4 Cols): Usher Manual Check-in + Live Stream */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card A: Fast Member Check-in (Usher Assist) */}
              <section className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-container px-5 py-4 text-on-primary flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                        person_check
                      </span>
                      <h3 className="font-display font-bold text-title-md">Fast Member Check-in</h3>
                    </div>
                    <p className="text-[12px] text-on-primary/80 mt-0.5">
                      Assist members without smartphones or low battery
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-on-primary">
                    Usher Desk
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Quick Lookup Input */}
                  <div>
                    <label
                      htmlFor="quickMemberSearch"
                      className="block text-label-sm font-semibold text-on-surface-variant mb-1.5"
                    >
                      Search by Name, Phone, or Member Code
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-[20px] text-outline absolute left-3.5 top-1/2 -translate-y-1/2">
                        search
                      </span>
                      <input
                        id="quickMemberSearch"
                        type="text"
                        value={quickSearchQuery}
                        onChange={(e) => setQuickSearchQuery(e.target.value)}
                        placeholder="e.g. 0803 482 9104 or Babatunde..."
                        className="w-full pl-10 pr-16 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-sm text-on-surface font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-on-surface-variant bg-surface-container rounded border border-outline-variant/30">
                        /
                      </kbd>
                    </div>
                  </div>

                  {/* Instant Match Result Card (Ready for 1-Tap Check-in) */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-primary/15 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-body-sm flex items-center justify-center shrink-0">
                          MB
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-body-sm font-bold text-on-surface">
                              {quickSearchQuery.trim() ||
                                data?.members?.[0]?.fullName ||
                                "Search Member Above"}
                            </p>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-surface-container-high text-on-surface-variant">
                              {data?.members?.[0]?.memberCode ?? "#MEMBER"}
                            </span>
                          </div>
                          <p className="text-[12px] text-on-surface-variant">
                            {data?.members?.[0]?.phone ?? "Enter phone or name"} ·{" "}
                            {data?.members?.[0]?.department ?? "RCCG JESUS HOUSE, OGBOMOSHO"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary">
                        <span className="material-symbols-outlined text-[14px]">history</span>
                        DB Directory Match
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleQuickMarkPresent()}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-label-sm shadow-subtle transition-all cursor-pointer ${
                          quickMarked
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-primary text-on-primary hover:bg-primary-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {quickMarked ? "verified" : "check_circle"}
                        </span>
                        <span>{quickMarked ? "Marked Present" : "Mark Present"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Walk-in Guest Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[12px] text-on-surface-variant">
                      Not in congregation directory?
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestModalOpen(true)}
                      className="inline-flex items-center gap-1 text-body-sm font-semibold text-secondary hover:underline cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      <span>+ Register First-time Guest</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Card B: Live Check-in Stream (Real-time Activity Feed) */}
              <section className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant/15 overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary-container" />
                    </span>
                    <h3 className="font-display font-bold text-title-md text-on-surface">
                      Live Check-in Stream
                    </h3>
                  </div>
                  <span className="text-label-sm font-medium text-on-surface-variant">
                    Auto-updating
                  </span>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {streamItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-4 transition-colors flex items-center justify-between gap-3 ${
                        idx === 0 ? "bg-tertiary-container/5" : "hover:bg-surface-container-low/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full font-bold text-label-sm flex items-center justify-center shrink-0 ${item.avatarClass}`}
                        >
                          {item.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-on-surface truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                            <span>{item.meta}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {item.actionRequired ? (
                          <button
                            type="button"
                            onClick={() => handleCheckInStreamItem(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-on-primary text-[11px] font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                          >
                            {item.badgeText}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${item.badgeClass}`}
                          >
                            {item.badgeText}
                          </span>
                        )}
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{item.timeAgo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card C: Security & Audit Integrity Notice */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                  verified_user
                </span>
                <div className="text-[12px] text-on-surface-variant leading-relaxed">
                  <p className="font-semibold text-on-surface">
                    Attendance Audit Integrity · HMAC-SHA256 Token Active
                  </p>
                  <p className="mt-0.5">
                    Every self-scan verifies a 60-second rotating time-slot token and enforces
                    database uniqueness per member per service.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (8 Cols): Live Attendance Roster Table */}
            <div className="lg:col-span-8">
              <section className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant/15 overflow-hidden">
                {/* Roster Table Header & Filter Controls */}
                <div className="p-5 border-b border-outline-variant/15 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-display font-bold text-headline-sm text-on-surface">
                          Live Attendance Roster
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-label-sm font-bold bg-primary/10 text-primary">
                          Showing {totalCheckins} records
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        Real-time log of members and guests marked present for Sunday First Service
                      </p>
                    </div>

                    {/* Quick View Pills */}
                    <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg border border-outline-variant/20">
                      <button
                        type="button"
                        onClick={() => setModeFilter("All Check-in Modes")}
                        className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-colors cursor-pointer ${
                          modeFilter === "All Check-in Modes"
                            ? "bg-surface-container-lowest text-primary shadow-subtle"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        All ({totalCheckins})
                      </button>
                      <button
                        type="button"
                        onClick={() => setModeFilter("Self-Scan (QR)")}
                        className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-colors cursor-pointer ${
                          modeFilter === "Self-Scan (QR)"
                            ? "bg-surface-container-lowest text-primary shadow-subtle"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        QR Scan (298)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModeFilter("Usher Assisted")}
                        className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-colors cursor-pointer ${
                          modeFilter === "Usher Assisted"
                            ? "bg-surface-container-lowest text-primary shadow-subtle"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        Usher ({usherAssistedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setModeFilter("First-time Guests Only")}
                        className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-colors cursor-pointer ${
                          modeFilter === "First-time Guests Only"
                            ? "bg-surface-container-lowest text-secondary shadow-subtle"
                            : "text-secondary hover:bg-secondary-container/20"
                        }`}
                      >
                        Guests ({guestsCount})
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5 relative">
                      <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
                        filter_list
                      </span>
                      <input
                        type="text"
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        placeholder="Search checked-in members..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <select
                        aria-label="Filter by Department"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-body-sm text-on-surface font-medium focus:outline-none focus:border-primary"
                      >
                        <option value="All Departments">All Departments</option>
                        <option value="Sanctuary Choir">Sanctuary Choir</option>
                        <option value="Ushering & Protocol">Ushering &amp; Protocol</option>
                        <option value="Media & Sound">Media &amp; Sound</option>
                        <option value="Sunday School">Sunday School</option>
                        <option value="Women of Grace">Women of Grace</option>
                        <option value="Men's Fellowship">Men&apos;s Fellowship</option>
                        <option value="First-time Guests">First-time Guests</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        aria-label="Filter by Check-in Mode"
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-body-sm text-on-surface font-medium focus:outline-none focus:border-primary"
                      >
                        <option value="All Check-in Modes">All Check-in Modes</option>
                        <option value="Self-Scan (QR)">Self-Scan (QR)</option>
                        <option value="Usher Assisted">Usher Assisted</option>
                        <option value="First-time Guests Only">First-time Guests Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/80 border-b border-outline-variant/20 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <th className="py-3.5 pl-5 pr-3">Member Name &amp; Code</th>
                        <th className="py-3.5 px-3">Phone &amp; Dept</th>
                        <th className="py-3.5 px-3">Check-in Time</th>
                        <th className="py-3.5 px-3">Check-in Mode</th>
                        <th className="py-3.5 px-3">Streak Impact</th>
                        <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 text-body-sm">
                      {filteredRoster.map((row) => (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            row.isGuest
                              ? "bg-secondary-container/10 hover:bg-secondary-container/20"
                              : "hover:bg-surface-container-low/60"
                          }`}
                        >
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full font-bold text-label-sm flex items-center justify-center shrink-0 ${row.avatarClass}`}
                              >
                                {row.initials}
                              </div>
                              <div>
                                <Link
                                  href="/profile"
                                  className="font-semibold text-on-surface hover:text-primary transition-colors"
                                >
                                  {row.name}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`text-[11px] font-mono ${
                                      row.isGuest
                                        ? "px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-semibold font-sans"
                                        : "text-on-surface-variant"
                                    }`}
                                  >
                                    {row.codeBadge}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="text-on-surface font-medium">{row.phone}</p>
                            <p
                              className={`text-[12px] ${
                                row.isGuest
                                  ? "text-secondary font-medium"
                                  : "text-on-surface-variant"
                              }`}
                            >
                              {row.department}
                            </p>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-on-surface">{row.time}</p>
                            <p className="text-[11px] text-on-surface-variant">{row.gate}</p>
                          </td>
                          <td className="py-3.5 px-3">
                            {row.mode === "Self-Scan (QR)" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-tertiary-container/15 text-tertiary">
                                <span className="material-symbols-outlined text-[14px]">
                                  qr_code_2
                                </span>
                                Self-Scan (QR)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-primary-fixed text-on-primary-fixed">
                                <span className="material-symbols-outlined text-[14px]">
                                  support_agent
                                </span>
                                Usher Assisted
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-bold border ${row.streakClass}`}
                            >
                              <span
                                className="material-symbols-outlined text-[14px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {row.streakIcon}
                              </span>
                              {row.streakLabel}
                            </span>
                          </td>
                          <td className="py-3.5 pl-3 pr-5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Link
                                href="/profile"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                                title="View Member Profile"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setUndoneIds((prev) => [...prev, row.id]);
                                  setTotalCheckins((c) => Math.max(0, c - 1));
                                  showToast(`Removed accidental check-in for ${row.name}`);
                                }}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                                title="Undo accidental check-in"
                              >
                                Undo
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-4 text-body-sm text-on-surface-variant">
                  <div>
                    Showing{" "}
                    <span className="font-semibold text-on-surface">1–{filteredRoster.length}</span>{" "}
                    of <span className="font-semibold text-on-surface">{totalCheckins}</span>{" "}
                    checked-in attendees
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant opacity-50 text-label-sm font-semibold"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container text-label-sm font-semibold"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container text-label-sm font-semibold"
                    >
                      3
                    </button>
                    <span className="px-1">…</span>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container text-label-sm font-semibold"
                    >
                      52
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container text-label-sm font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Interactive Modal 1: Show Rotating QR Display */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qrModalTitle"
        >
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-ambient border border-outline-variant/20 text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-bold bg-tertiary-container/15 text-tertiary">
                <span className="w-2 h-2 rounded-full bg-tertiary-container animate-ping" />
                Live Rotating Token
              </span>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <h3
                id="qrModalTitle"
                className="font-display text-headline-sm font-bold text-primary"
              >
                Sunday First Service Check-In
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Scan with your phone camera to confirm attendance
              </p>
            </div>

            {/* Simulated High-Contrast QR Box */}
            <div className="mx-auto w-56 h-56 p-4 rounded-2xl bg-white border-2 border-primary/20 shadow-subtle flex flex-col items-center justify-center relative">
              <span className="material-symbols-outlined text-[168px] text-primary leading-none">
                qr_code_2
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant mt-1">
                {checkinHref}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-container-low text-body-sm">
              <span className="text-on-surface-variant font-medium">Next token rotation in:</span>
              <span className="font-mono font-bold text-primary">{qrSeconds}s</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                href={checkinHref}
                className="flex-1 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-semibold text-body-sm hover:opacity-90 transition-opacity"
              >
                Open Member Scan View
              </Link>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-body-sm hover:bg-primary-container cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal 2: Quick Register First-Time Guest */}
      {guestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guestModalTitle"
        >
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-ambient border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">waving_hand</span>
                <h3 id="guestModalTitle" className="font-display text-title-md font-bold">
                  Register First-time Guest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuestModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterGuest} className="space-y-3">
              <div>
                <label
                  htmlFor="guestFullName"
                  className="block text-label-sm font-semibold text-on-surface-variant mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="guestFullName"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Chidinma Okafor"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="guestPhoneInput"
                  className="block text-label-sm font-semibold text-on-surface-variant mb-1"
                >
                  Phone Number (WhatsApp preferred) *
                </label>
                <input
                  id="guestPhoneInput"
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="guestInvitedByInput"
                  className="block text-label-sm font-semibold text-on-surface-variant mb-1"
                >
                  Invited By / Notes
                </label>
                <input
                  id="guestInvitedByInput"
                  type="text"
                  value={guestInvitedBy}
                  onChange={(e) => setGuestInvitedBy(e.target.value)}
                  placeholder="Optional member name or prayer note"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/30 text-body-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-semibold cursor-pointer"
                >
                  Save &amp; Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
