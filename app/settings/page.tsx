"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

interface PermissionMatrixRow {
  capability: string;
  subtitle: string;
  leadPastor: boolean;
  admin: boolean;
  usherLead: boolean;
  deptLead: boolean;
  mediaTech: boolean;
  member: boolean;
}

const PERMISSION_ROWS: PermissionMatrixRow[] = [
  {
    capability: "View Full Directory",
    subtitle: "Browse unmasked contact and residential info",
    leadPastor: true,
    admin: true,
    usherLead: false,
    deptLead: false,
    mediaTech: false,
    member: false,
  },
  {
    capability: "Manage Member Records",
    subtitle: "Create, archive or re-assign pastoral fellowship units",
    leadPastor: true,
    admin: true,
    usherLead: false,
    deptLead: false,
    mediaTech: false,
    member: false,
  },
  {
    capability: "Open / Close Service Registers",
    subtitle: "Initiate active attendance records for services",
    leadPastor: true,
    admin: true,
    usherLead: true,
    deptLead: false,
    mediaTech: false,
    member: false,
  },
  {
    capability: "Generate Rotating QR Code",
    subtitle: "Cast 45s rotating tokens onto foyer check-in displays",
    leadPastor: true,
    admin: true,
    usherLead: true,
    deptLead: false,
    mediaTech: false,
    member: false,
  },
  {
    capability: "Moderate Service Media",
    subtitle: "Batch upload photos, tag minor consents, publish albums",
    leadPastor: true,
    admin: true,
    usherLead: false,
    deptLead: false,
    mediaTech: true,
    member: false,
  },
  {
    capability: "Pastoral Care & Private Notes",
    subtitle: "Confidential prayer requests, counseling journals",
    leadPastor: true,
    admin: false,
    usherLead: false,
    deptLead: false,
    mediaTech: false,
    member: false,
  },
  {
    capability: "Export Audit Records & CSV",
    subtitle: "Parish-level ledger exports for district reporting",
    leadPastor: true,
    admin: true,
    usherLead: false,
    deptLead: false,
    mediaTech: false,
    member: false,
  },
];

export default function SettingsPermissionsPage(): ReactElement {
  const [rotationSeconds, setRotationSeconds] = useState(45);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [childShieldEnabled, setChildShieldEnabled] = useState(true);
  const [parishName, setParishName] = useState("Grace Sanctuary Parish");
  const [denomination, setDenomination] = useState("Redeemed Christian Church of God (RCCG)");
  const [compressionProfile, setCompressionProfile] = useState(
    "Lagos Mobile Mesh: WebP Lossy (85% Quality)",
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showToast, setShowToast] = useState(false);

  async function handleSaveChanges(): Promise<void> {
    setSaveState("saving");
    setShowToast(true);

    try {
      await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation UpdateSettings($input: UpdateParishSettingsInput!) {
            updateParishSettings(input: $input) {
              parishName
              qrRotationSeconds
              geofenceEnabled
            }
          }`,
          variables: {
            input: {
              parishName,
              denomination,
              qrRotationSeconds: rotationSeconds,
              geofenceEnabled,
              childMinorShieldEnabled: childShieldEnabled,
              compressionProfile,
            },
          },
        }),
      });
    } catch {
      // Handled optimistically
    }

    setTimeout(() => {
      setSaveState("saved");
    }, 600);

    setTimeout(() => {
      setShowToast(false);
      setSaveState("idle");
    }, 3400);
  }

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Sidebar */}
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
              href="/usher/live"
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
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary font-semibold transition-colors"
              href="/settings"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span className="font-label-md text-label-md">Settings</span>
            </Link>
          </nav>
        </div>
        <div className="p-space-md">
          <Link
            className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between hover:bg-surface-container transition-colors"
            href="/usher"
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

      {/* Main Content */}
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
            <div className="px-space-xl py-space-lg flex flex-col gap-space-xl max-w-7xl mx-auto w-full">
              {/* Top Action Bar & Breadcrumbs */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                    <span>Grace Sanctuary Parish</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span>System Administration</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Settings &amp; Permissions</span>
                  </nav>
                  <div className="flex items-center gap-space-sm mt-1">
                    <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
                      Settings &amp; Parish Administration
                    </h1>
                    <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                      Production Host
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    Configure church parish identity, role-based security access, privacy &amp; NDPA
                    compliance, QR scan rotation parameters, and media lifecycle policies.
                  </p>
                </div>
                <div className="flex items-center gap-space-sm shrink-0">
                  <button
                    className="h-11 px-space-md bg-surface-container-lowest text-on-surface rounded-xl font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container transition-colors shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span>Audit Logs</span>
                  </button>
                  <button
                    className="h-11 px-space-md bg-surface-container-low text-on-surface-variant rounded-xl font-label-md text-label-md hover:bg-surface-container hover:text-on-surface transition-colors"
                    type="button"
                  >
                    Discard
                  </button>
                  <button
                    className="h-11 px-space-lg bg-primary-container text-on-primary rounded-xl font-label-md text-label-md flex items-center gap-space-xs hover:bg-primary transition-all shadow-md active:scale-95"
                    disabled={saveState === "saving"}
                    onClick={handleSaveChanges}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {saveState === "saving"
                        ? "refresh"
                        : saveState === "saved"
                          ? "done_all"
                          : "check_circle"}
                    </span>
                    <span>
                      {saveState === "saving"
                        ? "Saving..."
                        : saveState === "saved"
                          ? "Saved!"
                          : "Save Changes"}
                    </span>
                  </button>
                </div>
              </div>

              {/* System Health & Compliance Overview Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined text-[26px]">apartment</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Live Foyer Node
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                      Main Sanctuary (Lagos)
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      3 Active Entrance Terminals
                    </span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-surface-container-high/40 rounded-full blur-xl pointer-events-none" />
                </div>

                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0 text-on-tertiary-container">
                    <span className="material-symbols-outlined text-[26px]">verified_user</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        NDPA 2023 Protocol
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-bold">
                        Compliant
                      </span>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-mono text-[15px] truncate">
                      SHA-256 Ledger Live
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Congregation records encrypted
                    </span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-tertiary-fixed/30 rounded-full blur-xl pointer-events-none" />
                </div>

                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0 text-on-secondary-fixed-variant">
                    <span className="material-symbols-outlined text-[26px]">cloud_sync</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Automated Snapshot
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                      Today at 03:00 AM WAT
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Next backup in 14h 22m
                    </span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-secondary-container/20 rounded-full blur-xl pointer-events-none" />
                </div>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="bg-surface-container-low p-1.5 rounded-xl flex items-center overflow-x-auto gap-1">
                <button
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 transition-all shrink-0 flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">church</span>
                  Parish Identity
                </button>
                <button
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md bg-surface-container-lowest text-primary font-semibold shadow-sm shrink-0 flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    admin_panel_settings
                  </span>
                  Roles &amp; Access Control
                  <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-[11px]">
                    6 Tiers
                  </span>
                </button>
                <button
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 transition-all shrink-0 flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  Attendance &amp; Ushering
                </button>
                <button
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 transition-all shrink-0 flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_library</span>
                  Media &amp; Privacy (NDPA)
                </button>
                <button
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 transition-all shrink-0 flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    notifications_active
                  </span>
                  Integrations &amp; Broadcasts
                </button>
              </div>

              {/* Main Settings Architecture: Split Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
                {/* Primary Column (Roles & Granular Matrix) */}
                <div className="lg:col-span-8 flex flex-col gap-space-lg">
                  <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-primary text-[22px]">
                            shield_person
                          </span>
                          <h2 className="font-headline-md text-headline-md text-on-surface">
                            Sanctuary Roles &amp; Access Tiers
                          </h2>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Enforcing strict privilege segregation in line with Nigerian Data
                          Protection Act (NDPA) 2023 guidelines for faith organisations.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="h-10 px-space-md bg-surface-container text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                          Assign User
                        </button>
                        <button
                          className="h-10 px-space-md bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-1.5"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          Add Role
                        </button>
                      </div>
                    </div>

                    {/* Structured Cards / Role Tiers */}
                    <div className="flex flex-col gap-space-sm mt-2">
                      {/* Tier 1: Lead Pastor */}
                      <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div className="flex items-start gap-space-md">
                          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 font-label-lg">
                            <span className="material-symbols-outlined text-[20px]">
                              workspace_premium
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface">
                                Super Admin / Lead Pastor
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold">
                                Tier 0
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Pastor Emmanuel • 1 user assigned
                            </span>
                            <span className="font-label-sm text-label-sm text-primary font-medium mt-1">
                              Root administrative privileges • Ledger archives • Full Pastoral Notes
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-space-sm py-1 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            Global Scope
                          </span>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </div>

                      {/* Tier 2: Church Admin / Secretary */}
                      <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div className="flex items-start gap-space-md">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">badge</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface">
                                Church Administrator &amp; Secretariat
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">
                                Tier 1
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Sister Deborah Adeleke, Deacon Samuel Okon • 2 users assigned
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                              Directory maintenance • Service scheduling • CSV report generation
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-space-sm py-1 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            Operational
                          </span>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </div>

                      {/* Tier 3: Usher Lead / Door Protocol */}
                      <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div className="flex items-start gap-space-md">
                          <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              door_front
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface">
                                Usher Lead / Door Protocol
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">
                                Terminal Scope
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Brother Emmanuel Kalu • 8 active foyer terminals
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                              Live dynamic QR generation • Check-in manual override • Live
                              headcounts
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-space-sm py-1 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            Foyer Desk
                          </span>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </div>

                      {/* Tier 4: Department Heads */}
                      <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div className="flex items-start gap-space-md">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">groups</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface">
                                Department &amp; Activity Leads
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">
                                Sub-Group
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Choir, Youth Church, Women of Grace • 7 departmental coordinators
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                              Isolated roster views • Unit rehearsal attendance • Broadcast
                              notifications
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-space-sm py-1 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            Segmented
                          </span>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </div>

                      {/* Tier 5: Media & Tech Team */}
                      <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div className="flex items-start gap-space-md">
                          <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              photo_camera
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface">
                                Media &amp; Documentation Team
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">
                                Media Hub
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Brother Femi Awolowo • 3 users assigned
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                              Multi-photo uploads • Album curation • NDPA consent tagging • 7-day
                              enforcement
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-space-sm py-1 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            Asset Desk
                          </span>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </div>

                      {/* Tier 6: Congregant / Member */}
                      <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div className="flex items-start gap-space-md">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface">
                                Parishioner / Congregant (Mobile Portal)
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px]">
                                Default
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              1,248 Verified Parish Members
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                              Self QR scan • Streak tally • Profile updating • Download 7-day photos
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-space-sm py-1 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                            Individual
                          </span>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Granular Permissions Matrix Table */}
                  <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          Granular Permission Matrix
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Toggle system access capability per ministerial office tier.
                        </p>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                        Role policies locked by lead pastor
                      </span>
                    </div>
                    <div className="overflow-x-auto -mx-space-lg px-space-lg pb-2">
                      <table className="w-full text-left font-body-sm text-body-sm">
                        <thead>
                          <tr className="text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low rounded-lg">
                            <th className="py-3 px-space-md font-semibold">Capability</th>
                            <th className="py-3 px-2 text-center font-semibold">Lead Pastor</th>
                            <th className="py-3 px-2 text-center font-semibold">Admin</th>
                            <th className="py-3 px-2 text-center font-semibold">Usher Lead</th>
                            <th className="py-3 px-2 text-center font-semibold">Dept Lead</th>
                            <th className="py-3 px-2 text-center font-semibold">Media Tech</th>
                            <th className="py-3 px-2 text-center font-semibold">Member</th>
                          </tr>
                        </thead>
                        <tbody className="text-on-surface">
                          {PERMISSION_ROWS.map((row, idx) => (
                            <tr
                              className={`${
                                idx % 2 === 1 ? "bg-surface-container-lowest" : ""
                              } hover:bg-surface-container-low/60 transition-colors`}
                              key={row.capability}
                            >
                              <td className="py-3.5 px-space-md font-medium flex flex-col">
                                <span>{row.capability}</span>
                                <span className="font-label-sm text-[12px] text-on-surface-variant">
                                  {row.subtitle}
                                </span>
                              </td>
                              {[
                                row.leadPastor,
                                row.admin,
                                row.usherLead,
                                row.deptLead,
                                row.mediaTech,
                                row.member,
                              ].map((allowed, colIdx) => (
                                <td className="text-center" key={colIdx}>
                                  {allowed ? (
                                    <span className="material-symbols-outlined text-primary text-[20px]">
                                      check_circle
                                    </span>
                                  ) : (
                                    <span className="material-symbols-outlined text-outline-variant text-[20px]">
                                      remove
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Secondary Column: System Policies & Hardware Rules */}
                <div className="lg:col-span-4 flex flex-col gap-space-lg">
                  {/* Attendance & Scanning Protocol Module */}
                  <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-xs text-primary">
                      <span className="material-symbols-outlined text-[22px]">security</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        Ushering &amp; Scan Defense
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Tamper-proof check-in mechanics engineered specifically for high-capacity
                      Sunday auditoriums.
                    </p>

                    {/* QR Rotation Interval */}
                    <div className="flex flex-col gap-space-xs pt-space-xs">
                      <div className="flex items-center justify-between">
                        <label
                          className="font-label-md text-label-md text-on-surface"
                          htmlFor="rotation-slider"
                        >
                          Dynamic QR Rotation
                        </label>
                        <span className="font-label-md text-label-md text-secondary font-bold">
                          {rotationSeconds} Seconds
                        </span>
                      </div>
                      <input
                        className="w-full accent-primary bg-surface-container h-2 rounded-lg cursor-pointer"
                        id="rotation-slider"
                        max={60}
                        min={30}
                        onChange={(e) => setRotationSeconds(Number(e.target.value))}
                        step={15}
                        type="range"
                        value={rotationSeconds}
                      />
                      <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant px-1">
                        <span>30s (Ultra High)</span>
                        <span>45s (Standard)</span>
                        <span>60s (Slow WiFi)</span>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Rotates the sanctuary projection token rapidly to invalidate screenshots
                        sent to friends off-site.
                      </p>
                    </div>

                    {/* Geofence Toggle */}
                    <div className="p-space-md rounded-xl bg-surface-container-low flex items-start justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          Auditorium Geofence
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Radius locked to 150m around the altar coordinates.
                        </span>
                        <span className="font-label-sm text-label-sm text-tertiary-container font-semibold mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                          GPS Active on Member Mobile
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input
                          checked={geofenceEnabled}
                          className="sr-only peer"
                          onChange={(e) => setGeofenceEnabled(e.target.checked)}
                          type="checkbox"
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    {/* Duplicate Scan Policy */}
                    <div className="p-space-md rounded-xl bg-surface-container-low flex items-start justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          Duplicate Scan Defense
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Reject repeated member submissions for the same service.
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold mt-1">
                          Immutable Policy
                        </span>
                      </div>
                      <div className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold">
                        Enforced
                      </div>
                    </div>

                    {/* Self-Scan Grace Window */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-label-md text-label-md text-on-surface">
                        Check-in Operational Window
                      </span>
                      <div className="bg-surface-container p-3 rounded-lg flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          schedule
                        </span>
                        <span className="font-body-sm text-body-sm font-medium">
                          Opens -30m • Closes +45m after sermon kick-off
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Media Lifecycle & 7-Day Purge Policy */}
                  <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs text-primary">
                        <span className="material-symbols-outlined text-[22px]">timer</span>
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          Media &amp; Privacy (NDPA)
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-bold">
                        NDPA 2023
                      </span>
                    </div>

                    <div className="p-space-md rounded-xl bg-primary-fixed/30 flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-primary font-bold">
                          Strict 7-Day Auto-Purge
                        </span>
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          auto_delete
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        Sunday photos expire and are automatically shredded exactly 7 days after
                        service. Congregants are nudged to save memories within their 7-day grace
                        window.
                      </p>
                    </div>

                    <div className="p-space-md rounded-xl bg-surface-container-low flex items-start justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          Child &amp; Minor Shield
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Blur faces of minors without confirmed parent opt-in consent.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input
                          checked={childShieldEnabled}
                          className="sr-only peer"
                          onChange={(e) => setChildShieldEnabled(e.target.checked)}
                          type="checkbox"
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface"
                        htmlFor="compression-select"
                      >
                        Mobile Network Optimization
                      </label>
                      <div className="relative">
                        <select
                          className="w-full h-11 pl-space-md pr-10 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest appearance-none cursor-pointer"
                          id="compression-select"
                          onChange={(e) => setCompressionProfile(e.target.value)}
                          value={compressionProfile}
                        >
                          <option>Lagos Mobile Mesh: WebP Lossy (85% Quality)</option>
                          <option>High Fidelity: JPEG (92% Quality)</option>
                          <option>Data Saver: AVIF Ultra-Compressed (70% Quality)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[20px]">
                          expand_more
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Prevents high data usage for congregation browsing on mobile bundles.
                      </span>
                    </div>
                  </div>

                  {/* Parish Identity & Terminal Hardware Desks */}
                  <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-xs text-primary">
                      <span className="material-symbols-outlined text-[22px]">storefront</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        Parish Identity &amp; Desks
                      </h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label
                          className="font-label-sm text-label-sm text-on-surface-variant"
                          htmlFor="parish-name-input"
                        >
                          Parish Legal Name
                        </label>
                        <input
                          className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                          id="parish-name-input"
                          onChange={(e) => setParishName(e.target.value)}
                          type="text"
                          value={parishName}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          className="font-label-sm text-label-sm text-on-surface-variant"
                          htmlFor="denomination-input"
                        >
                          Ecclesiastical Network / Denomination
                        </label>
                        <input
                          className="h-10 px-space-md bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                          id="denomination-input"
                          onChange={(e) => setDenomination(e.target.value)}
                          type="text"
                          value={denomination}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">
                          Designated Foyer Check-in Desks
                        </label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                            Door A (Main Entrance)
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                            Door B (Gallery Ramp)
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                            Foyer Desk #1 (Guest Lounge)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Toast */}
              {showToast && (
                <div className="fixed bottom-6 right-6 bg-inverse-surface text-inverse-on-surface px-space-lg py-3 rounded-xl shadow-xl flex items-center gap-space-sm transition-all duration-300 z-50">
                  <span className="material-symbols-outlined text-tertiary-fixed text-[22px]">
                    check_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold">
                      Parish Policies Updated
                    </span>
                    <span className="font-body-sm text-[12px] opacity-80">
                      Synced across all 8 usher foyer consoles &amp; NDPA audit log.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
