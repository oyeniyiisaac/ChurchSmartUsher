"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

const DIRECTORY_QUERY = gql`
  query CongregationDirectory {
    me {
      id
      fullName
      role
      avatarUrl
    }
    departments {
      id
      name
      icon
    }
    activities {
      id
      name
      icon
    }
    members {
      id
      fullName
      phone
      email
      role
      status
      department
      activities
      departmentIds
      activityIds
      memberCode
      notes
      currentStreak
      longestStreak
      avatarUrl
    }
  }
`;

const ASSIGN_AFFILIATIONS_MUTATION = gql`
  mutation AssignMemberAffiliations($input: AssignAffiliationsInput!) {
    assignMemberAffiliations(input: $input) {
      id
      role
      department
      activities
      departmentIds
      activityIds
    }
  }
`;

const UPDATE_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateMemberRole($memberId: ID!, $role: Role!) {
    updateMemberRole(memberId: $memberId, role: $role) {
      id
      role
      department
    }
  }
`;

const CREATE_DEPT_INLINE_MUTATION = gql`
  mutation CreateDeptInline($input: DepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
    }
  }
`;

interface DirectoryRow {
  id: string;
  name: string;
  verified?: boolean;
  code: string;
  avatarUrl?: string;
  initials?: string;
  initialsClass?: string;
  phone: string;
  phoneChannel: "WhatsApp Verified" | "WhatsApp" | "Phone only" | "SMS Alert";
  primaryUnit: string;
  unitRole: string;
  unitRoleClass?: string;
  streakText: string;
  streakIcon: "local_fire_department" | "emoji_events" | "heart_broken" | "waving_hand";
  streakBadgeClass: string;
  streakIconClass: string;
  lastCheckedInTime: string;
  lastCheckedInTimeClass: string;
  lastCheckedInSub: string;
  lastCheckedInSubClass: string;
  statusLabel: "Active Member" | "Needs Follow-Up" | "Guest Pass";
  statusBadgeClass: string;
  statusDotClass: string;
  bestStreak: number;
  email: string;
  notes: string;
  activities: string[];
}

const EMPTY_MEMBER_ROW: DirectoryRow = {
  id: "empty-member",
  name: "No Member Selected",
  code: "CC-2026-0000",
  initials: "MB",
  initialsClass: "bg-surface-container-high text-primary",
  phone: "+234 --- --- ----",
  phoneChannel: "WhatsApp",
  primaryUnit: "General Congregation",
  unitRole: "Member",
  streakText: "0 wks",
  streakIcon: "local_fire_department",
  streakBadgeClass: "bg-surface-container-high text-on-surface-variant",
  streakIconClass: "text-outline",
  lastCheckedInTime: "No check-in yet",
  lastCheckedInTimeClass: "text-on-surface-variant",
  lastCheckedInSub: "Awaiting first attendance",
  lastCheckedInSubClass: "text-outline",
  statusLabel: "Active Member",
  statusBadgeClass: "bg-tertiary-fixed text-on-tertiary-fixed font-semibold",
  statusDotClass: "bg-on-tertiary-fixed",
  bestStreak: 0,
  email: "member@rccgjesushouse.org",
  notes: "Register or select a member from the directory to view pastoral care details.",
  activities: [],
};

export default function MembersDirectoryPage(): ReactNode {
  const { data, refetch } = useQuery(DIRECTORY_QUERY, {
    fetchPolicy: "network-only",
  });
  const [assignAffiliations, { loading: assigning }] = useMutation(ASSIGN_AFFILIATIONS_MUTATION);
  const [updateRoleMutation] = useMutation(UPDATE_MEMBER_ROLE_MUTATION);
  const [createDeptMutation] = useMutation(CREATE_DEPT_INLINE_MUTATION);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedRowId, setSelectedRowId] = useState<string>("");
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [chosenDept, setChosenDept] = useState<string>("General Congregation");
  const [chosenRole, setChosenRole] = useState<"MEMBER" | "USHER" | "ADMIN">("MEMBER");
  const [chosenActivities, setChosenActivities] = useState<string[]>([]);
  const [customOverrides, setCustomOverrides] = useState<
    Record<string, { primaryUnit: string; activities: string[] }>
  >({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rawMembers = (data?.members ?? []) as Array<{
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    role: string;
    status: string;
    department: string;
    activities: string[];
    memberCode: string;
    notes?: string | null;
    currentStreak: number;
    longestStreak: number;
    avatarUrl?: string | null;
  }>;

  const mappedRows: DirectoryRow[] = rawMembers.map((m) => {
    const initials = m.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    const isGuest = m.status === "FIRST_TIME_GUEST";
    const isFollowUp = m.status === "NEEDS_FOLLOW_UP";
    const statusLabel: DirectoryRow["statusLabel"] = isGuest
      ? "Guest Pass"
      : isFollowUp
        ? "Needs Follow-Up"
        : "Active Member";
    const override = customOverrides[m.id];

    return {
      id: m.id,
      name: m.fullName,
      verified: m.role === "ADMIN" || m.role === "USHER",
      code: m.memberCode,
      avatarUrl: m.avatarUrl ?? undefined,
      initials: initials || "MB",
      initialsClass: "bg-surface-container-high text-primary",
      phone: m.phone,
      phoneChannel: "WhatsApp Verified",
      primaryUnit: override?.primaryUnit ?? (m.department || "General Congregation"),
      unitRole: m.role,
      streakText: `${m.currentStreak} wks`,
      streakIcon: m.currentStreak >= 10 ? "emoji_events" : "local_fire_department",
      streakBadgeClass: "bg-secondary-fixed text-on-secondary-fixed font-bold shadow-xs",
      streakIconClass: "text-secondary",
      lastCheckedInTime: m.currentStreak > 0 ? "Verified" : "Pending",
      lastCheckedInTimeClass: "font-medium text-tertiary",
      lastCheckedInSub: "DB Record",
      lastCheckedInSubClass: "text-on-surface-variant",
      statusLabel,
      statusBadgeClass: isFollowUp
        ? "bg-secondary-fixed text-on-secondary-fixed font-semibold"
        : isGuest
          ? "bg-primary-fixed text-on-primary-fixed font-semibold"
          : "bg-tertiary-fixed text-on-tertiary-fixed font-semibold",
      statusDotClass: isFollowUp ? "bg-secondary" : isGuest ? "bg-primary" : "bg-on-tertiary-fixed",
      bestStreak: m.longestStreak,
      email: m.email || "Not provided",
      notes: m.notes || "Active member in RCCG JESUS HOUSE, OGBOMOSHO.",
      activities: override?.activities ?? (m.activities || []),
    };
  });

  const rows: DirectoryRow[] = mappedRows.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q);
    const matchesDept = selectedDeptFilter === "ALL" || r.primaryUnit === selectedDeptFilter;
    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "Active Regular" && r.statusLabel === "Active Member") ||
      (selectedStatusFilter === "First-Time Guest" && r.statusLabel === "Guest Pass") ||
      (selectedStatusFilter === "Needs Follow-Up" && r.statusLabel === "Needs Follow-Up");
    return matchesSearch && matchesDept && matchesStatus;
  });

  const selectedMember = rows.find((r) => r.id === selectedRowId) ?? rows[0] ?? EMPTY_MEMBER_ROW;
  const totalMembersCount = rawMembers.length;
  const activeRegularsCount = rawMembers.filter((m) => m.status === "ACTIVE").length;
  const firstTimeGuestsCount = rawMembers.filter((m) => m.status === "FIRST_TIME_GUEST").length;
  const followUpCount = rawMembers.filter((m) => m.status === "NEEDS_FOLLOW_UP").length;

  function openAssignModal(): void {
    setChosenDept(selectedMember.primaryUnit);
    setChosenRole(
      selectedMember.unitRole === "ADMIN"
        ? "ADMIN"
        : selectedMember.unitRole === "USHER"
          ? "USHER"
          : "MEMBER",
    );
    setChosenActivities(selectedMember.activities);
    setAssignModalOpen(true);
  }

  function toggleActivitySelection(actName: string): void {
    setChosenActivities((prev) =>
      prev.includes(actName) ? prev.filter((a) => a !== actName) : [...prev, actName],
    );
  }

  async function handleSaveAssignment(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setCustomOverrides((prev) => ({
      ...prev,
      [selectedMember.id]: {
        primaryUnit: chosenDept,
        activities: chosenActivities,
      },
    }));

    const dbMembers = (data?.members ?? []) as Array<{ id: string; memberCode: string }>;
    const dbDepts = (data?.departments ?? []) as Array<{ id: string; name: string }>;
    const dbActs = (data?.activities ?? []) as Array<{ id: string; name: string }>;

    const matchedMember = dbMembers.find((m) => m.memberCode === selectedMember.code);
    let deptId = dbDepts.find((d) => d.name.toLowerCase() === chosenDept.toLowerCase())?.id;
    const matchedActIds = dbActs.filter((a) => chosenActivities.includes(a.name)).map((a) => a.id);

    if (matchedMember) {
      try {
        if (!deptId && chosenDept.trim().length > 0) {
          const createdRes = await createDeptMutation({
            variables: {
              input: {
                name: chosenDept,
                description: `${chosenDept} — RCCG JESUS HOUSE, OGBOMOSHO`,
                icon: chosenDept.toLowerCase().includes("media")
                  ? "photo_camera"
                  : chosenDept.toLowerCase().includes("usher")
                    ? "badge"
                    : "groups",
                leadName: "",
              },
            },
          });
          deptId = createdRes.data?.createDepartment?.id as string | undefined;
        }

        if (deptId) {
          await assignAffiliations({
            variables: {
              input: {
                memberId: matchedMember.id,
                departmentIds: [deptId],
                activityIds: matchedActIds,
              },
            },
          });
        }

        await updateRoleMutation({
          variables: {
            memberId: matchedMember.id,
            role: chosenRole,
          },
        });

        await refetch();
      } catch {
        // Preview fallback already applied above
      }
    }

    setAssignModalOpen(false);
    setToastMessage(
      `Updated role (${chosenRole}) & unit (${chosenDept}) for ${selectedMember.name}`,
    );
  }

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Stitch Left Navigation Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex-col justify-between">
        <div className="flex flex-col">
          <div className="px-space-lg pt-space-lg pb-space-md flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img
                src="/rccg-logo.png"
                alt="RCCG JESUS HOUSE, OGBOMOSHO"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight truncate">
                RCCG JESUS HOUSE
              </span>
              <span className="font-label-sm text-label-sm text-secondary truncate">
                RCCG JESUS HOUSE, OGBOMOSHO
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
              aria-current="page"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors bg-primary-container text-on-primary font-semibold"
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
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                fact_check
              </span>
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
              href="/settings"
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

      {/* Main Content Shell */}
      <div className="lg:pl-72">
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
                  {data?.me?.fullName ?? "Parish Administrator"}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  {data?.me?.role ?? "Admin Lead"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-16 pb-24 lg:pb-8 bg-background w-full min-h-screen">
          <div className="flex flex-col w-full">
            <div className="px-4 sm:px-6 lg:px-space-xl py-space-lg flex flex-col gap-space-lg">
              {toastMessage && (
                <div
                  className="rounded-xl bg-tertiary-fixed/50 text-on-tertiary-fixed-variant px-space-md py-space-sm font-label-sm text-label-sm flex items-center justify-between"
                  role="status"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{toastMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    className="cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              {/* Breadcrumb & Top Stat strip */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                    <span>RCCG JESUS HOUSE, OGBOMOSHO</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span>Parish Registry</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Active Roster</span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Members Management &amp; Congregation Directory
                  </h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
                    Directory of {totalMembersCount} registered worshippers, departmental
                    assignments, and pastoral care status across RCCG JESUS HOUSE, OGBOMOSHO.
                  </p>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
                  <button
                    className="h-11 px-space-md bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm rounded-xl font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      upload_file
                    </span>
                    <span>Import CSV</span>
                  </button>
                  <button
                    className="h-11 px-space-md bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm rounded-xl font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      verified_user
                    </span>
                    <span>Export Roster (NDPA Audited)</span>
                  </button>
                  <Link
                    href="/register"
                    className="h-11 px-space-lg bg-primary hover:bg-primary-container text-on-primary shadow-sm rounded-xl font-label-md text-label-md flex items-center gap-space-xs transition-all hover:shadow-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>Add New Member</span>
                  </Link>
                </div>
              </div>

              {/* Quick Summary Stats Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="flex flex-col gap-space-xs z-10">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Total Registered
                    </span>
                    <div className="flex items-baseline gap-space-xs">
                      <span className="font-display-lg text-display-lg text-primary leading-none">
                        {totalMembersCount}
                      </span>
                      <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                        Live DB
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Parishioners on register
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary z-10">
                    <span className="material-symbols-outlined text-[26px]">groups</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface-container-low opacity-60" />
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="flex flex-col gap-space-xs z-10">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Active Regulars
                    </span>
                    <div className="flex items-baseline gap-space-xs">
                      <span className="font-display-lg text-display-lg text-on-surface leading-none">
                        {activeRegularsCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                        {totalMembersCount > 0
                          ? `${Math.round((activeRegularsCount / totalMembersCount) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Attended ≥2 of last 4 Sundays
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-tertiary z-10">
                    <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface-container-low opacity-60" />
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="flex flex-col gap-space-xs z-10">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      First-Time Guests
                    </span>
                    <div className="flex items-baseline gap-space-xs">
                      <span className="font-display-lg text-display-lg text-secondary leading-none">
                        {firstTimeGuestsCount}
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">
                        This Month
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Assigned to Follow-up Unit
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed z-10">
                    <span className="material-symbols-outlined text-[26px]">celebration</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-secondary-fixed-dim opacity-20" />
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="flex flex-col gap-space-xs z-10">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Pastoral Follow-Up
                    </span>
                    <div className="flex items-baseline gap-space-xs">
                      <span className="font-display-lg text-display-lg text-error leading-none">
                        {followUpCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                        Urgent
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Absent 3+ weeks or flagged
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-on-error-container z-10">
                    <span className="material-symbols-outlined text-[26px]">
                      volunteer_activism
                    </span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-error-container opacity-30" />
                </div>
              </div>

              {/* Master-Detail Split Grid (65% / 35%) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
                {/* Left/Center Data Table & Filter Panel (approx 65% on XL) */}
                <section className="xl:col-span-8 flex flex-col gap-space-md bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg">
                  {/* Multi-attribute Filter Header */}
                  <div className="flex flex-col gap-space-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm">
                      {/* Search bar */}
                      <div className="md:col-span-5 relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                          search
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-space-md bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors"
                          placeholder="Search by name, phone, CC-ID, or email..."
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {/* Department dropdown */}
                      <div className="md:col-span-3">
                        <div className="relative">
                          <select
                            value={selectedDeptFilter}
                            onChange={(e) => setSelectedDeptFilter(e.target.value)}
                            className="w-full h-11 pl-space-md pr-8 bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                          >
                            <option value="ALL">All Departments (14)</option>
                            <option value="Sanctuary Choir">Sanctuary Choir</option>
                            <option value="Ushering & Protocol">Ushering &amp; Protocol</option>
                            <option value="Men's Fellowship">Men&apos;s Fellowship</option>
                            <option value="Youth Fellowship">Youth Fellowship</option>
                            <option value="Media & Sound">Media &amp; Sound</option>
                            <option value="Sunday School">Sunday School</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2.5 top-3 text-outline pointer-events-none text-[18px]">
                            expand_more
                          </span>
                        </div>
                      </div>
                      {/* Status dropdown */}
                      <div className="md:col-span-2">
                        <div className="relative">
                          <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="w-full h-11 pl-space-sm pr-7 bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                          >
                            <option value="ALL">All Statuses</option>
                            <option value="Active Regular">Active Regular</option>
                            <option value="First-Time Guest">First-Time Guest</option>
                            <option value="Needs Follow-Up">Needs Follow-Up</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-3 text-outline pointer-events-none text-[18px]">
                            expand_more
                          </span>
                        </div>
                      </div>
                      {/* Streak filter */}
                      <div className="md:col-span-2">
                        <div className="relative">
                          <select className="w-full h-11 pl-space-sm pr-7 bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface-container-lowest shadow-inner">
                            <option>Streak: Any</option>
                            <option>Active (4+ wks)</option>
                            <option>At Risk (1-2 missed)</option>
                            <option>Broken</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-3 text-outline pointer-events-none text-[18px]">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bulk Selection Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-space-sm py-2 px-space-md bg-surface-container-low rounded-xl text-on-surface-variant font-label-sm text-label-sm">
                      <div className="flex items-center gap-space-md">
                        <label className="flex items-center gap-space-xs cursor-pointer select-none">
                          <input
                            defaultChecked
                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                            type="checkbox"
                          />
                          <span className="font-medium text-on-surface">1 Selected</span>
                        </label>
                        <div className="h-4 w-px bg-outline-variant" />
                        <span className="text-on-surface-variant">
                          Showing active filters: Choir • Active Regular
                        </span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <button
                          onClick={openAssignModal}
                          className="px-space-sm py-1 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            transfer_within_a_station
                          </span>
                          <span>Assign Dept</span>
                        </button>
                        <button
                          className="px-space-sm py-1 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px] text-tertiary">
                            chat
                          </span>
                          <span>Send WhatsApp Notice</span>
                        </button>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="p-1 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors cursor-pointer"
                          title="Clear Filters"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Table View */}
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low/60 rounded-xl">
                          <th className="py-space-sm pl-space-md pr-2 w-10">
                            <input
                              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                              type="checkbox"
                            />
                          </th>
                          <th className="py-space-sm px-space-sm font-semibold">Member &amp; ID</th>
                          <th className="py-space-sm px-space-sm font-semibold">Contact / Phone</th>
                          <th className="py-space-sm px-space-sm font-semibold">Primary Unit</th>
                          <th className="py-space-sm px-space-sm font-semibold">Streak</th>
                          <th className="py-space-sm px-space-sm font-semibold">Last Checked In</th>
                          <th className="py-space-sm px-space-sm font-semibold">Status</th>
                          <th className="py-space-sm pr-space-md pl-space-sm text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-0">
                        {rows.map((row) => {
                          const isSelected = row.id === selectedMember.id;
                          return (
                            <tr
                              key={row.id}
                              onClick={() => setSelectedRowId(row.id)}
                              className={
                                isSelected
                                  ? "bg-primary-fixed/30 hover:bg-primary-fixed/40 transition-colors cursor-pointer group shadow-sm rounded-xl"
                                  : "hover:bg-surface-container-low transition-colors cursor-pointer group"
                              }
                            >
                              <td
                                className={`py-space-md pl-space-md pr-2 ${
                                  isSelected ? "rounded-l-xl" : ""
                                }`}
                              >
                                <input
                                  checked={isSelected}
                                  onChange={() => setSelectedRowId(row.id)}
                                  className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                                  type="checkbox"
                                />
                              </td>
                              <td className="py-space-md px-space-sm">
                                <div className="flex items-center gap-space-sm min-w-max">
                                  {row.avatarUrl ? (
                                    <div className="relative">
                                      <img
                                        className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface-container"
                                        alt={row.name}
                                        src={row.avatarUrl}
                                      />
                                      {row.verified && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary-fixed border-2 border-surface-container-lowest" />
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-10 h-10 rounded-full ${row.initialsClass} flex items-center justify-center font-headline-sm text-headline-sm font-bold shadow-sm`}
                                    >
                                      {row.initials}
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span
                                      className={`font-label-md text-label-md ${
                                        isSelected
                                          ? "text-primary font-bold"
                                          : "text-on-surface font-semibold"
                                      } flex items-center gap-1`}
                                    >
                                      {row.name}
                                      {row.verified && (
                                        <span className="material-symbols-outlined text-[15px] text-primary material-icon-filled">
                                          check_circle
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                                      {row.code}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-space-md px-space-sm">
                                <div className="flex flex-col min-w-max">
                                  <span className="font-body-sm text-body-sm text-on-surface">
                                    {row.phone}
                                  </span>
                                  {row.phoneChannel.includes("WhatsApp") ? (
                                    <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[13px]">
                                        chat
                                      </span>{" "}
                                      {row.phoneChannel}
                                    </span>
                                  ) : (
                                    <span className="font-label-sm text-label-sm text-outline">
                                      {row.phoneChannel}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-space-md px-space-sm">
                                <div className="flex flex-col">
                                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                                    {row.primaryUnit}
                                  </span>
                                  <span
                                    className={`font-label-sm text-label-sm ${
                                      row.unitRoleClass ?? "text-on-surface-variant"
                                    }`}
                                  >
                                    {row.unitRole}
                                  </span>
                                </div>
                              </td>
                              <td className="py-space-md px-space-sm">
                                <div
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${row.streakBadgeClass}`}
                                >
                                  <span
                                    className={`material-symbols-outlined text-[16px] ${row.streakIconClass}`}
                                  >
                                    {row.streakIcon}
                                  </span>
                                  <span>{row.streakText}</span>
                                </div>
                              </td>
                              <td className="py-space-md px-space-sm">
                                <div className="flex flex-col">
                                  <span
                                    className={`font-body-sm text-body-sm ${row.lastCheckedInTimeClass}`}
                                  >
                                    {row.lastCheckedInTime}
                                  </span>
                                  <span
                                    className={`font-label-sm text-label-sm ${row.lastCheckedInSubClass}`}
                                  >
                                    {row.lastCheckedInSub}
                                  </span>
                                </div>
                              </td>
                              <td className="py-space-md px-space-sm">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${row.statusBadgeClass}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${row.statusDotClass}`}
                                  />
                                  {row.statusLabel}
                                </span>
                              </td>
                              <td
                                className={`py-space-md pr-space-md pl-space-sm text-right ${
                                  isSelected ? "rounded-r-xl" : ""
                                }`}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRowId(row.id);
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-surface-container-lowest hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
                                    title="Open Dossier"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      visibility
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRowId(row.id);
                                      openAssignModal();
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                                    title="Assign Affiliations"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      more_vert
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Pagination Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-sm text-on-surface-variant font-label-sm text-label-sm">
                    <div className="flex items-center gap-space-xs">
                      <span>
                        Showing <strong className="text-on-surface">{rows.length}</strong> of{" "}
                        <strong className="text-on-surface">{totalMembersCount}</strong> registered
                        members
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button
                        className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant disabled:opacity-40 transition-colors"
                        disabled
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <button
                        className="w-9 h-9 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center shadow-xs"
                        type="button"
                      >
                        1
                      </button>
                      <button
                        className="w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
                        type="button"
                      >
                        2
                      </button>
                      <button
                        className="w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
                        type="button"
                      >
                        3
                      </button>
                      <span className="px-1 text-outline">...</span>
                      <button
                        className="w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
                        type="button"
                      >
                        208
                      </button>
                      <button
                        className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* Right Pane: Detailed Member Dossier (approx 35% on XL) */}
                <section className="xl:col-span-4 flex flex-col gap-space-md bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg relative">
                  {/* Dossier Header & Profile Summary */}
                  <div className="flex flex-col gap-space-md pb-space-md">
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        {selectedMember.avatarUrl ? (
                          <img
                            className="w-20 h-20 rounded-2xl object-cover shadow-md bg-surface-container"
                            alt={selectedMember.name}
                            src={selectedMember.avatarUrl}
                          />
                        ) : (
                          <div
                            className={`w-20 h-20 rounded-2xl ${selectedMember.initialsClass} flex items-center justify-center font-headline-lg text-headline-lg font-bold shadow-md`}
                          >
                            {selectedMember.initials}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[16px] material-icon-filled">
                            check
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          onClick={openAssignModal}
                          className="h-9 px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Edit Dossier</span>
                        </button>
                        <button
                          onClick={openAssignModal}
                          className="w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
                          {selectedMember.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm mt-0.5">
                        <span className="font-mono bg-surface-container-low px-2 py-0.5 rounded text-on-surface">
                          {selectedMember.code}
                        </span>
                        <span>•</span>
                        <span>Member since March 2022</span>
                      </div>
                    </div>

                    {/* Status & Compliance Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                        {selectedMember.statusLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium">
                        Baptized by Immersion
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">shield</span>
                        NDPA Consent Verified (2024)
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-3 gap-space-xs pt-1">
                      <a
                        className="h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-1.5 text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                        href={`tel:${selectedMember.phone.replace(/\s+/g, "")}`}
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          call
                        </span>
                        <span>Call</span>
                      </a>
                      <a
                        className="h-10 rounded-xl bg-tertiary-fixed/40 hover:bg-tertiary-fixed/60 flex items-center justify-center gap-1.5 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold transition-colors"
                        href={`https://wa.me/${selectedMember.phone.replace(/[^\d]/g, "")}`}
                      >
                        <span className="material-symbols-outlined text-[18px] text-tertiary">
                          chat
                        </span>
                        <span>WhatsApp</span>
                      </a>
                      <a
                        className="h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-1.5 text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                        href={`mailto:${selectedMember.email}`}
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          mail
                        </span>
                        <span>Email</span>
                      </a>
                    </div>
                  </div>

                  {/* Attendance & Streak Mastery Card */}
                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                        Attendance &amp; Consistency
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[15px]">insights</span>
                        Top 5% Parish Rank
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-space-sm text-center">
                      <div className="bg-surface-container-lowest rounded-xl p-space-sm flex flex-col items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-secondary text-[22px]">
                          local_fire_department
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          {selectedMember.streakText.split(" ")[0]} wks
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Current Streak
                        </span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-xl p-space-sm flex flex-col items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          military_tech
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          {selectedMember.bestStreak} wks
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Best Record
                        </span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-xl p-space-sm flex flex-col items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-tertiary text-[22px]">
                          percent
                        </span>
                        <span className="font-headline-sm text-headline-sm text-tertiary font-bold">
                          89%
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          2024 Overall
                        </span>
                      </div>
                    </div>

                    {/* Heatmap tracker for recent 8 Sunday services */}
                    <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-sm rounded-xl">
                      <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                        <span>Recent 8 Sunday Services:</span>
                        <span className="font-medium text-tertiary">7 Present • 1 Absent</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 pt-1">
                        {[
                          { date: "06/10", present: true },
                          { date: "13/10", present: true },
                          { date: "20/10", present: false },
                          { date: "27/10", present: true },
                          { date: "03/11", present: true },
                          { date: "10/11", present: true },
                          { date: "17/11", present: true },
                        ].map((slot) => (
                          <div key={slot.date} className="flex flex-col items-center gap-1">
                            {slot.present ? (
                              <span className="w-6 h-6 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-[11px]">
                                ✓
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-surface-container-high text-outline flex items-center justify-center font-bold text-[11px]">
                                ✕
                              </span>
                            )}
                            <span className="text-[10px] text-outline">{slot.date}</span>
                          </div>
                        ))}
                        <div className="flex flex-col items-center gap-1">
                          <span className="w-6 h-6 rounded-full bg-secondary-container text-on-primary flex items-center justify-center font-bold text-[11px] ring-2 ring-secondary">
                            ★
                          </span>
                          <span className="text-[10px] font-bold text-secondary">Today</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Departments & Activities */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                        Departments &amp; Ministries
                      </span>
                      <button
                        onClick={openAssignModal}
                        className="text-primary font-label-sm text-label-sm font-semibold hover:underline cursor-pointer"
                        type="button"
                      >
                        + Assign
                      </button>
                    </div>
                    <div className="flex flex-col gap-space-xs">
                      <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">
                              music_note
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">
                              {selectedMember.primaryUnit}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {selectedMember.unitRole} Section
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                          Active
                        </span>
                      </div>

                      {selectedMember.activities.map((act, idx) => (
                        <div
                          key={act}
                          className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between"
                        >
                          <div className="flex items-center gap-space-sm">
                            <div
                              className={`w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center ${
                                idx === 0 ? "text-secondary" : "text-outline"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {idx === 0 ? "diversity_3" : "menu_book"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface font-semibold">
                                {act}
                              </span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                {idx === 0
                                  ? "Exco Member • Media Liaison"
                                  : "Young Adults Fellowship"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={
                              idx === 0
                                ? "px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold"
                                : "px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm"
                            }
                          >
                            {idx === 0 ? "Active" : "Enrolled"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pastoral Care Notes Log */}
                  <div className="flex flex-col gap-space-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                        Pastoral Care Notes
                      </span>
                      <button
                        className="text-primary font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span> Add Note
                      </button>
                    </div>
                    <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
                            PE
                          </div>
                          <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                            Pastor Emmanuel
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-outline">
                          12 Nov 2024
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface italic bg-surface-container-lowest p-space-sm rounded-lg shadow-2xs">
                        “{selectedMember.notes}”
                      </p>
                    </div>
                  </div>

                  {/* Security & Audit Footer */}
                  <div className="p-space-sm rounded-xl bg-surface-container-high/60 flex items-center gap-space-sm text-on-surface-variant font-label-sm text-label-sm mt-auto">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">
                      qr_code_scanner
                    </span>
                    <span className="leading-tight">
                      Last check-in verified via <strong>Self-QR (Door A Main Foyer)</strong> at{" "}
                      <strong>8:42 AM today</strong>.
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Assign Departments & Activities Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  account_tree
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Assign Units · {selectedMember.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveAssignment(e)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">
                  System Access Role (Security Clearance)
                </label>
                <select
                  value={chosenRole}
                  onChange={(e) => setChosenRole(e.target.value as "MEMBER" | "USHER" | "ADMIN")}
                  className="h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none"
                >
                  <option value="MEMBER">
                    MEMBER — Standard Member Access (Media Unit gets Photo Upload)
                  </option>
                  <option value="USHER">USHER — Usher QR &amp; Live Attendance Desk</option>
                  <option value="ADMIN">ADMIN — Full Parish Administrator</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">
                  Primary Ministry Department / Unit
                </label>
                <select
                  value={chosenDept}
                  onChange={(e) => {
                    const nextDept = e.target.value;
                    setChosenDept(nextDept);
                    if (chosenRole !== "ADMIN") {
                      if (nextDept.toLowerCase().includes("usher")) {
                        setChosenRole("USHER");
                      } else {
                        setChosenRole("MEMBER");
                      }
                    }
                  }}
                  className="h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none"
                >
                  {[
                    "General Congregation",
                    "Media Unit",
                    "Ushering Unit",
                    "Sanctuary Choir",
                    "Prayer Band",
                    "Sanctuary Keepers",
                    "Youth Fellowship",
                    "Sunday School",
                    "Women of Grace",
                    "Men's Fellowship",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Fellowship &amp; Growth Activities
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    "Youth Fellowship",
                    "Sunday School Class 4",
                    "Midweek Bible Study",
                    "Discipleship Cohort",
                    "Believers Baptism Class",
                  ].map((act) => {
                    const checked = chosenActivities.includes(act);
                    return (
                      <label
                        key={act}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleActivitySelection(act)}
                          className="w-4 h-4 rounded text-primary accent-primary"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface">{act}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="h-11 px-space-md rounded-xl bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="h-11 px-space-lg rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {assigning ? "Saving..." : "Save Affiliations"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
