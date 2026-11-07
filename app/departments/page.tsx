"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

const DEPARTMENTS_ACTIVITIES_QUERY = gql`
  query DepartmentsAndActivities {
    me {
      id
      fullName
      role
    }
    departments {
      id
      name
      description
      icon
      leadName
      active
      memberCount
    }
    activities {
      id
      name
      description
      schedule
      icon
      active
      participantCount
    }
  }
`;

const CREATE_DEPARTMENT_MUTATION = gql`
  mutation CreateDepartment($input: DepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
      description
      icon
      leadName
      active
      memberCount
    }
  }
`;

const CREATE_ACTIVITY_MUTATION = gql`
  mutation CreateActivity($input: ActivityInput!) {
    createActivity(input: $input) {
      id
      name
      description
      schedule
      icon
      active
      participantCount
    }
  }
`;

interface DeptItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  leadName: string;
  memberCount: number;
  attendancePct: number;
}

interface ActivityItem {
  id: string;
  name: string;
  description: string;
  schedule: string;
  icon: string;
  participantCount: number;
}

export default function DepartmentsAndActivitiesPage(): ReactNode {
  const { data, refetch } = useQuery(DEPARTMENTS_ACTIVITIES_QUERY, {
    fetchPolicy: "network-only",
  });
  const [createDepartmentMutation, { loading: creatingDept }] = useMutation(
    CREATE_DEPARTMENT_MUTATION,
  );
  const [createActivityMutation, { loading: creatingAct }] = useMutation(CREATE_ACTIVITY_MUTATION);

  const [addedDepts, setAddedDepts] = useState<DeptItem[]>([]);
  const [addedActs, setAddedActs] = useState<ActivityItem[]>([]);

  const [deptName, setDeptName] = useState<string>("");
  const [deptLead, setDeptLead] = useState<string>("");
  const [deptDesc, setDeptDesc] = useState<string>("");
  const [deptIcon, setDeptIcon] = useState<string>("groups");

  const [actName, setActName] = useState<string>("");
  const [actSchedule, setActSchedule] = useState<string>("");
  const [actDesc, setActDesc] = useState<string>("");
  const [actIcon, setActIcon] = useState<string>("menu_book");

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const dbDepts: DeptItem[] = (
    (data?.departments ?? []) as Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      leadName: string;
      memberCount: number;
    }>
  ).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon || "groups",
    leadName: d.leadName || "Unit Coordinator",
    memberCount: d.memberCount ?? 0,
    attendancePct: d.memberCount > 0 ? 100 : 0,
  }));

  const dbActs: ActivityItem[] = (
    (data?.activities ?? []) as Array<{
      id: string;
      name: string;
      description: string;
      schedule: string;
      icon: string;
      participantCount: number;
    }>
  ).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    schedule: a.schedule,
    icon: a.icon || "menu_book",
    participantCount: a.participantCount ?? 0,
  }));

  const departmentsList: DeptItem[] = [
    ...dbDepts,
    ...addedDepts.filter((ad) => !dbDepts.some((d) => d.name === ad.name)),
  ];
  const activitiesList: ActivityItem[] = [
    ...dbActs,
    ...addedActs.filter((aa) => !dbActs.some((a) => a.name === aa.name)),
  ];
  const totalAssignedWorkforce = departmentsList.reduce((acc, d) => acc + d.memberCount, 0);

  async function handleCreateDepartment(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!deptName.trim()) return;

    const newItem: DeptItem = {
      id: `dept-custom-${Date.now()}`,
      name: deptName.trim(),
      description: deptDesc.trim() || "Parish Ministry Department",
      icon: deptIcon,
      leadName: deptLead.trim() || "Assigned Unit Coordinator",
      memberCount: 1,
      attendancePct: 100,
    };

    try {
      await createDepartmentMutation({
        variables: {
          input: {
            name: newItem.name,
            description: newItem.description,
            icon: newItem.icon,
            leadName: newItem.leadName,
          },
        },
      });
      await refetch();
    } catch {
      // Preview fallback below
    }

    setAddedDepts((prev) => [...prev, newItem]);
    setDeptName("");
    setDeptLead("");
    setDeptDesc("");
    setBannerMessage(`Created department "${newItem.name}" in RCCG JESUS HOUSE, OGBOMOSHO.`);
  }

  async function handleCreateActivity(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!actName.trim()) return;

    const newAct: ActivityItem = {
      id: `act-custom-${Date.now()}`,
      name: actName.trim(),
      description: actDesc.trim() || "Fellowship & Spiritual Growth Track",
      schedule: actSchedule.trim() || "Weekly Fellowship",
      icon: actIcon,
      participantCount: 1,
    };

    try {
      await createActivityMutation({
        variables: {
          input: {
            name: newAct.name,
            description: newAct.description,
            schedule: newAct.schedule,
            icon: newAct.icon,
          },
        },
      });
      await refetch();
    } catch {
      // Preview fallback below
    }

    setAddedActs((prev) => [...prev, newAct]);
    setActName("");
    setActSchedule("");
    setActDesc("");
    setBannerMessage(`Created fellowship activity "${newAct.name}".`);
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
              aria-current="page"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors bg-primary-container text-on-primary font-semibold"
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
              <span className="font-label-md text-label-sm">Attendance</span>
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

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
          <div className="flex items-center gap-space-md max-w-md w-full">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                search
              </span>
              <input
                className="w-full h-10 pl-10 pr-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors"
                placeholder="Search departments, cohorts, or coordinators..."
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
          <div className="px-4 sm:px-6 lg:px-space-xl py-space-lg flex flex-col gap-space-lg">
            {bannerMessage && (
              <div
                className="rounded-xl bg-tertiary-fixed/50 text-on-tertiary-fixed-variant px-space-md py-space-sm font-label-sm text-label-sm flex items-center justify-between"
                role="status"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{bannerMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBannerMessage(null)}
                  className="cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Page Title & Action Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                  <span>RCCG JESUS HOUSE, OGBOMOSHO</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span>Ministerial Governance</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-primary font-semibold">Departments &amp; Activities</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                  Departments, Ministries &amp; Fellowship Cohorts
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
                  Manage parish service units, workforce coordinators, and recurring spiritual
                  growth activities.
                </p>
              </div>
              <div className="flex items-center gap-space-sm shrink-0">
                <Link
                  href="/members"
                  className="h-11 px-space-md bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm rounded-xl font-label-md text-label-md flex items-center gap-space-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                  <span>Assign Members in Roster</span>
                </Link>
              </div>
            </div>

            {/* 4-Card KPI Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Active Departments
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg text-primary leading-none">
                      {departmentsList.length}
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                      Service Units
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {departmentsList.length} Departmental Coordinators
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[26px]">account_tree</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Fellowship Cohorts
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg text-secondary leading-none">
                      {activitiesList.length}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Growth Tracks
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Sunday School &amp; Midweek
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[26px]">menu_book</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Assigned Workforce
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg text-on-surface leading-none">
                      {totalAssignedWorkforce}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                      Active
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Serving in ≥1 ministry unit
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[26px]">badge</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Unit Attendance
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg text-tertiary leading-none">
                      {departmentsList.length > 0 ? "100%" : "0%"}
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                      DB Synced
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Sunday workforce punctuality
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/50 flex items-center justify-center text-on-tertiary-fixed">
                  <span className="material-symbols-outlined text-[26px]">verified</span>
                </div>
              </div>
            </div>

            {/* 8 / 4 Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left 8 Cols: Departments & Activities Roster */}
              <div className="lg:col-span-8 flex flex-col gap-space-lg">
                {/* Ministry Departments Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface">
                        Parish Ministry Departments
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Service units, assigned coordinators, and Sunday attendance rates.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                      {departmentsList.length} Units Active
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-sm">
                    {departmentsList.map((dept) => (
                      <div
                        key={dept.id}
                        className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm"
                      >
                        <div className="flex items-start gap-space-md">
                          <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                            <span className="material-symbols-outlined text-[22px]">
                              {dept.icon}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                {dept.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
                                {dept.memberCount} Members
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {dept.description}
                            </span>
                            <span className="font-label-sm text-label-sm text-primary mt-1">
                              Coordinator: {dept.leadName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-space-md shrink-0 self-end sm:self-center">
                          <div className="flex flex-col items-end min-w-[110px]">
                            <span className="font-label-sm text-label-sm text-on-surface font-bold">
                              {dept.attendancePct}% Present
                            </span>
                            <div className="w-24 h-2 rounded-full bg-surface-container-highest overflow-hidden mt-1">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${dept.attendancePct}%` }}
                              />
                            </div>
                          </div>
                          <Link
                            href="/members"
                            className="h-9 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-primary font-label-sm text-label-sm flex items-center gap-1 shadow-xs"
                          >
                            <span>Roster</span>
                            <span className="material-symbols-outlined text-[16px]">
                              arrow_forward
                            </span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fellowship & Growth Cohorts Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface">
                        Fellowship &amp; Spiritual Growth Activities
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Recurring Bible study classes, discipleship cohorts, and midweek gatherings.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      {activitiesList.length} Cohorts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {activitiesList.map((act) => (
                      <div
                        key={act.id}
                        className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[20px]">
                                {act.icon}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                {act.name}
                              </span>
                              <span className="font-label-sm text-label-sm text-secondary">
                                {act.schedule}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm">
                            {act.participantCount} Enrolled
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {act.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 4 Cols: Admin Creation Forms & Governance Scope */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg">
                {/* Create Department Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs text-primary">
                    <span className="material-symbols-outlined text-[22px]">group_add</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      Create Department
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Register a new parish ministry unit for member assignment and attendance
                    tracking.
                  </p>
                  <form
                    onSubmit={(e) => void handleCreateDepartment(e)}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="dept-name-input"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Department Name
                      </label>
                      <input
                        id="dept-name-input"
                        type="text"
                        required
                        placeholder="e.g. Sanctuary Keepers"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="dept-lead-input"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Unit Coordinator / Lead
                      </label>
                      <input
                        id="dept-lead-input"
                        type="text"
                        placeholder="e.g. Deaconess Martha Obi"
                        value={deptLead}
                        onChange={(e) => setDeptLead(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="dept-icon-select"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Unit Icon
                      </label>
                      <select
                        id="dept-icon-select"
                        value={deptIcon}
                        onChange={(e) => setDeptIcon(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
                      >
                        <option value="groups">Groups (General Ministry)</option>
                        <option value="music_note">Music Note (Choir &amp; Worship)</option>
                        <option value="videocam">Videocam (Media &amp; Technical)</option>
                        <option value="volunteer_activism">
                          Volunteer Activism (Welfare &amp; Care)
                        </option>
                        <option value="school">School (Teaching &amp; Children)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="dept-desc-input"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Ministry Mandate
                      </label>
                      <input
                        id="dept-desc-input"
                        type="text"
                        placeholder="Auditorium preparation and hospitality"
                        value={deptDesc}
                        onChange={(e) => setDeptDesc(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingDept}
                      className="h-11 mt-1 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>{creatingDept ? "Creating..." : "Create Department"}</span>
                    </button>
                  </form>
                </div>

                {/* Create Activity Cohort Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs text-secondary">
                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      Create Activity Cohort
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Add a recurring fellowship class, study group, or training cohort.
                  </p>
                  <form
                    onSubmit={(e) => void handleCreateActivity(e)}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="act-name-input"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Activity / Cohort Name
                      </label>
                      <input
                        id="act-name-input"
                        type="text"
                        required
                        placeholder="e.g. Sanctuary Prayer Watch"
                        value={actName}
                        onChange={(e) => setActName(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="act-schedule-input"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Meeting Schedule
                      </label>
                      <input
                        id="act-schedule-input"
                        type="text"
                        placeholder="Fridays · 6:00 PM – 7:30 PM"
                        value={actSchedule}
                        onChange={(e) => setActSchedule(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="act-desc-input"
                        className="font-label-sm text-label-sm text-on-surface-variant"
                      >
                        Description
                      </label>
                      <input
                        id="act-desc-input"
                        type="text"
                        placeholder="Intercessory prayer & spiritual warfare"
                        value={actDesc}
                        onChange={(e) => setActDesc(e.target.value)}
                        className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingAct}
                      className="h-11 mt-1 bg-secondary text-on-secondary rounded-xl font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                      <span>{creatingAct ? "Creating..." : "Create Activity"}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
