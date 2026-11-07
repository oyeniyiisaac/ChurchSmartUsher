"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  canMemberAccessPath,
  getMemberLandingPath,
  hasAdminAccess,
  hasPhotoUploadAccess,
  hasUsherAccess,
  isPublicRoute,
} from "@/auth/permissions";

const PORTAL_NAV_ME_QUERY = gql`
  query PortalNavMe {
    me {
      id
      fullName
      phone
      role
      department
      activities
    }
  }
`;

interface PortalNavMeData {
  me: {
    id: string;
    fullName: string;
    phone: string;
    role: "MEMBER" | "USHER" | "ADMIN";
    department: string;
    activities: string[];
  } | null;
}

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  matchPrefix?: string[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard Overview",
    shortLabel: "Overview",
    icon: "dashboard",
    matchPrefix: ["/admin"],
  },
  {
    href: "/members",
    label: "Members Directory",
    shortLabel: "Members",
    icon: "groups",
    matchPrefix: ["/members"],
  },
  {
    href: "/services",
    label: "Services & Live QR",
    shortLabel: "Services",
    icon: "event_Repeat",
    matchPrefix: ["/services"],
  },
  {
    href: "/departments",
    label: "Departments & Units",
    shortLabel: "Units",
    icon: "account_tree",
    matchPrefix: ["/departments"],
  },
  {
    href: "/reports",
    label: "Attendance & Analytics",
    shortLabel: "Reports",
    icon: "analytics",
    matchPrefix: ["/reports"],
  },
  {
    href: "/admin/photos",
    label: "Photo Moderation Hub",
    shortLabel: "Photos",
    icon: "photo_library",
    matchPrefix: ["/admin/photos"],
  },
  {
    href: "/settings",
    label: "Settings & Permissions",
    shortLabel: "Settings",
    icon: "settings",
    matchPrefix: ["/settings"],
  },
];

const MEMBER_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Member Home",
    shortLabel: "Home",
    icon: "home",
  },
  {
    href: "/streak",
    label: "Consistency Streak",
    shortLabel: "Streak",
    icon: "local_fire_department",
  },
  {
    href: "/photos",
    label: "Service Photos",
    shortLabel: "Photos",
    icon: "photo_library",
  },
  {
    href: "/profile",
    label: "My Profile",
    shortLabel: "Profile",
    icon: "person",
  },
];

const USHER_NAV_ITEMS: NavItem[] = [
  {
    href: "/usher",
    label: "Usher QR Kiosk",
    shortLabel: "Show QR",
    icon: "qr_code_2",
  },
  {
    href: "/usher/live",
    label: "Live Attendance List",
    shortLabel: "Live List",
    icon: "fact_check",
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  if (href === "/usher") {
    return pathname === "/usher";
  }
  if (href === "/photos") {
    return (
      pathname === "/photos" ||
      (pathname.startsWith("/photos/") && !pathname.startsWith("/admin/photos"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ResponsivePortalNav(): ReactNode {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const { data, loading } = useQuery<PortalNavMeData>(PORTAL_NAV_ME_QUERY, {
    fetchPolicy: "network-only",
  });

  const me = data?.me ?? null;
  const isAdmin = hasAdminAccess(me);
  const isUsher = hasUsherAccess(me);
  const canUploadPhotos = hasPhotoUploadAccess(me);
  const publicRoute = isPublicRoute(pathname);
  const isAuthorized = canMemberAccessPath(me, pathname);

  const isRestrictedAdminOrUsherRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/usher") ||
    pathname === "/design-system";

  useEffect(() => {
    if (loading || publicRoute) return;

    if (!me) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAuthorized) {
      const target = getMemberLandingPath(me);
      const timer = window.setTimeout(() => {
        router.replace(target);
      }, 1500);
      return () => window.clearTimeout(timer);
    }
  }, [loading, publicRoute, me, isAuthorized, pathname, router]);

  if (publicRoute && !pathname.startsWith("/checkin")) {
    return null;
  }

  // Block unauthorized access to restricted routes immediately
  if (!publicRoute && loading && isRestrictedAdminOrUsherRoute) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#fbf9f4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-[#c3c6d4]/40 flex items-center justify-center p-2 mb-4">
          <img
            src="/rccg-logo.png"
            alt="RCCG JESUS HOUSE, OGBOMOSHO"
            className="w-full h-full object-contain"
          />
        </div>
        <p className="font-['Newsreader'] font-bold text-lg text-[#00236f]">
          Verifying Role &amp; Unit Clearance...
        </p>
        <p className="text-xs text-[#434752] mt-1">RCCG JESUS HOUSE, OGBOMOSHO Security Guard</p>
      </div>
    );
  }

  if (!publicRoute && !loading && !me) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#fbf9f4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-[#c3c6d4]/40 flex items-center justify-center p-2.5 mb-4">
          <img
            src="/rccg-logo.png"
            alt="RCCG JESUS HOUSE, OGBOMOSHO"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="font-['Newsreader'] font-bold text-2xl text-[#00236f]">Sign In Required</h2>
        <p className="text-sm text-[#434752] max-w-md mt-2">
          Please sign in with your registered member account to access RCCG JESUS HOUSE, OGBOMOSHO.
        </p>
        <Link
          href={`/login?returnTo=${encodeURIComponent(pathname)}`}
          className="mt-5 px-6 py-3 rounded-xl bg-[#00236f] text-white text-sm font-semibold shadow-md"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (!publicRoute && !loading && me && !isAuthorized) {
    const safeDestination = getMemberLandingPath(me);
    return (
      <div className="fixed inset-0 z-[100] bg-[#fbf9f4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] text-[#93000a] flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-[34px]">gpp_bad</span>
        </div>
        <h2 className="font-['Newsreader'] font-bold text-2xl text-[#1b1c19]">
          Restricted Access — Authorized Unit Only
        </h2>
        <p className="text-sm text-[#434752] max-w-md mt-2 leading-relaxed">
          Your account (<strong>{me.fullName}</strong> · Role: <strong>{me.role}</strong> · Unit:{" "}
          <strong>{me.department || "General Member"}</strong>) does not have clearance for{" "}
          <code className="px-1.5 py-0.5 rounded bg-[#efeeea] text-xs">{pathname}</code>. Only{" "}
          <strong>Ushers</strong> can access the Usher Portal, only the <strong>Media Unit</strong>{" "}
          can upload service photos at <code>/admin/photos</code>, and only <strong>Admins</strong>{" "}
          can access the Admin Console.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Link
            href={safeDestination}
            className="px-5 py-2.5 rounded-xl bg-[#00236f] text-white text-xs font-bold shadow-sm"
          >
            Return to My Portal
          </Link>
          {canUploadPhotos && (
            <Link
              href="/admin/photos"
              className="px-5 py-2.5 rounded-xl bg-[#fbda9b] text-[#261900] text-xs font-bold shadow-sm"
            >
              Open Media Photo Upload Hub
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  const isMemberOrUsherRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/streak") ||
    pathname.startsWith("/photos") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/usher") ||
    pathname.startsWith("/checkin");

  const visibleAdminItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : canUploadPhotos
      ? ADMIN_NAV_ITEMS.filter((item) => item.href === "/admin/photos")
      : [];

  return (
    <>
      {/* 1. Desktop Floating Portal Switcher & Navigation Pill for Member / Usher / Check-in Pages */}
      {isMemberOrUsherRoute && me && (
        <div className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#ffffff]/95 backdrop-blur-xl border border-[#c3c6d4]/50 shadow-[0_12px_32px_-4px_rgba(27,28,25,0.14)]">
          {MEMBER_NAV_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#00236f] text-white shadow-sm"
                    : "text-[#434752] hover:bg-[#efeeea] hover:text-[#1b1c19]"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}

          {(isUsher || canUploadPhotos || isAdmin) && (
            <div className="h-5 w-px bg-[#c3c6d4]/60 mx-1" />
          )}

          {isUsher &&
            USHER_NAV_ITEMS.map((item) => {
              const active = isRouteActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#6f531d] text-white shadow-sm"
                      : "text-[#6f531d] bg-[#fbda9b]/35 hover:bg-[#fbda9b]/60"
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  <span>{item.shortLabel}</span>
                </Link>
              );
            })}

          {canUploadPhotos && !isAdmin && (
            <Link
              href="/admin/photos"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#254b82] bg-[#d8e2ff]/50 hover:bg-[#d8e2ff] transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">add_a_photo</span>
              <span>Media Upload</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#254b82] bg-[#d8e2ff]/50 hover:bg-[#d8e2ff] transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
              <span>Admin</span>
            </Link>
          )}
        </div>
      )}

      {/* 2. Mobile & Tablet Navigation Bar + Drawer Trigger for Admin Console Routes (< lg) */}
      {isAdminRoute && me && (
        <>
          <nav
            aria-label="Mobile Admin Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] pb-safe bg-[#ffffff]/95 backdrop-blur-xl border-t border-[#c3c6d4]/40 shadow-[0_-4px_20px_rgba(27,28,25,0.08)]"
          >
            <div className="flex items-center justify-around h-16 px-2 max-w-xl mx-auto">
              {(isAdmin
                ? [ADMIN_NAV_ITEMS[0], ADMIN_NAV_ITEMS[1], ADMIN_NAV_ITEMS[2], ADMIN_NAV_ITEMS[4]]
                : [
                    MEMBER_NAV_ITEMS[0],
                    MEMBER_NAV_ITEMS[2],
                    ADMIN_NAV_ITEMS[5],
                    MEMBER_NAV_ITEMS[3],
                  ]
              ).map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                      active
                        ? "text-[#254b82] font-bold"
                        : "text-[#434752] hover:text-[#1b1c19] font-medium"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon === "event_Repeat" ? "event_available" : item.icon}
                    </span>
                    <span className="text-[11px] leading-tight">{item.shortLabel}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open full navigation menu"
                className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg text-[#6f531d] font-semibold hover:bg-[#f5f3ee] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">menu</span>
                <span className="text-[11px] leading-tight">More</span>
              </button>
            </div>
          </nav>

          {/* Slide-over Mobile/Tablet Navigation Drawer */}
          {drawerOpen && (
            <div className="lg:hidden fixed inset-0 z-[70] flex">
              <div
                className="fixed inset-0 bg-[#1b1c19]/50 backdrop-blur-xs"
                onClick={() => setDrawerOpen(false)}
              />
              <aside className="relative w-80 max-w-[85vw] bg-[#fbf9f4] h-full shadow-2xl flex flex-col justify-between z-10 overflow-y-auto">
                <div>
                  <div className="p-5 flex items-center justify-between border-b border-[#c3c6d4]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm">
                        <img
                          src="/rccg-logo.png"
                          alt="RCCG JESUS HOUSE, OGBOMOSHO"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-['Newsreader'] font-bold text-base text-[#254b82] leading-tight">
                          RCCG JESUS HOUSE
                        </p>
                        <p className="text-[11px] text-[#6f531d] font-medium mt-0.5">OGBOMOSHO</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Close navigation menu"
                      className="w-9 h-9 rounded-lg bg-[#efeeea] flex items-center justify-center text-[#434752] hover:text-[#1b1c19] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="p-4">
                    {visibleAdminItems.length > 0 && (
                      <>
                        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                          {isAdmin ? "Admin Console" : "Media Unit Hub"}
                        </p>
                        <div className="flex flex-col gap-1">
                          {visibleAdminItems.map((item) => {
                            const active = isRouteActive(pathname, item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setDrawerOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                                  active
                                    ? "bg-[#254b82] text-white font-semibold shadow-xs"
                                    : "text-[#434752] hover:bg-[#efeeea] font-medium"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {item.icon === "event_Repeat" ? "event_available" : item.icon}
                                </span>
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <p className="px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      {isUsher ? "Usher & Member Portals" : "Member Portal"}
                    </p>
                    <div className="flex flex-col gap-1">
                      {isUsher &&
                        USHER_NAV_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#6f531d] bg-[#fbda9b]/25 hover:bg-[#fbda9b]/45 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      {MEMBER_NAV_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#434752] hover:bg-[#efeeea] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[#c3c6d4]/30 bg-[#f5f3ee]">
                  <Link
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-[#c3c6d4]/50 text-xs font-bold text-[#254b82] shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">switch_account</span>
                    <span>Switch Account / Sign In</span>
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </>
  );
}
