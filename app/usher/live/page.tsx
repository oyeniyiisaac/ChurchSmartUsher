"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

const USHER_LIVE_QUERY = gql`
  query UsherLiveDesk($serviceId: ID!) {
    activeService {
      id
      name
      usherStation
      status
    }
    serviceAttendance(serviceId: $serviceId) {
      serviceId
      totalCount
      memberCount
      guestCount
      qrCount
      manualCount
      records {
        id
        memberName
        memberPhone
        memberDepartment
        isGuest
        invitedBy
        method
        markedByUsherName
        checkedInAt
      }
    }
  }
`;

const MARK_MANUAL_MUTATION = gql`
  mutation MarkManualUsher($serviceId: ID!, $memberId: ID!, $station: String) {
    markManualPresent(serviceId: $serviceId, memberId: $memberId, station: $station) {
      status
      message
      attendance {
        id
        memberName
        memberDepartment
        method
        checkedInAt
      }
    }
  }
`;

const REGISTER_GUEST_MUTATION = gql`
  mutation RegisterGuestUsher($input: RegisterGuestInput!) {
    registerGuestAttendance(input: $input) {
      id
      memberName
      memberPhone
      invitedBy
      checkedInAt
    }
  }
`;

interface FeedCard {
  id: string;
  name: string;
  department: string;
  usherSubtext?: string;
  guestSubtext?: string;
  timeLabel: string;
  mode: "Self Scan" | "Manual Check" | "Guest Pass";
  justNow?: boolean;
  isGuest?: boolean;
  avatarUrl?: string;
  initials?: string;
}

const INITIAL_FEED: FeedCard[] = [
  {
    id: "feed-isaac",
    name: "Isaac Olumide Adeleke",
    department: "Sanctuary Choir",
    timeLabel: "8:42 AM",
    mode: "Self Scan",
    justNow: true,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM",
  },
  {
    id: "feed-chioma",
    name: "Sister Chioma Okonkwo",
    department: "Ushering Department",
    timeLabel: "8:41 AM · 1m ago",
    mode: "Self Scan",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXLSlzzHv3Kir0FAAjF9fHh7MlKtMxvwm1f2Tkrp5U3uOQfLxY8vQW42GXNRHTJSLAiDfK_Tm9LdUKJVFFnNZuwBv51IgpSkjQUWPUuSTGi5HMDnr7GEYn_DSjhNycuuQln3LdWKwKZveK9LI1HPX6ieQ8fpoAnX2c1uhhWhhR_KupgpZ1LVjj3ySAkGOnkPVCt5eL9BJ_NDxLuuL0IOsFYD6Eb1Z4V1Rycmy1eC0",
  },
  {
    id: "feed-babatunde",
    name: "Elder Babatunde Cole",
    department: "Men's Fellowship",
    usherSubtext: "By Usher Emmanuel",
    timeLabel: "8:40 AM · 2m ago",
    mode: "Manual Check",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXL3GNUFPJ6GPPv89jdyQNATeRaJt_ydZ9wTE_n03p7lzdJOul2zvGE-VTYKeDouPKUTbaVQ_phbXDRQkl7wcL0tt-5aLmT-NEHaQVPWzhirlfuzVaJhVvoQNwj-wYVn7v_SDX26MMjx8yX6275f12jD5i3wXsY4bCWDKfiUlSqMx6ki423RbZyNFp15RVMxcYjkxa_DIjl_4aVnV5_0HN-jiqUu3LZCMFumPQ0Ng",
  },
  {
    id: "feed-ngozi",
    name: "Ngozi Eze",
    department: "First-time Visitor",
    guestSubtext: "Assigned: Hospitality Desk",
    timeLabel: "8:39 AM · 3m ago",
    mode: "Guest Pass",
    isGuest: true,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeqVP4plgrcrxrUHwFPR3N8rAXgtHIllKhFaL9wM13RpV1WGPeO8EmPVWJDOssfklzcbAsP7AEbG6bVyu68Z5p-HxcDQR4VyEu7B-zaCb0JkVCwoMYqclboPf3SRpyhWT02CDs93O1sJ69CepVt1E_kQA798BtH1AAk6dwY3Tj6TOHaIfR_u5VFVzDPfmfl60bXBEnK4s0d5JohBlO6fkajtDJO9LOxrTWSMHAxbk",
  },
  {
    id: "feed-pastor",
    name: "Pastor Olumide Davies",
    department: "Pastoral Team",
    timeLabel: "8:38 AM · 4m ago",
    mode: "Self Scan",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPwUgivxGuoYsRwqP65mD040MRegDekNwS5p5-I-U-vxlGBRuR-tVmj73QVuvNZgzVRhtQGJ2nYoGfjXhdSSbCqMVRv_6RQMxQ55Tixneg7BIb5lkb55z83XiKBYBM-S4kCWGpoRJvpBdGNzRTXVDP2IBKEIh6lLis_halP0ypiAY_admHOFsGg3cSygOES7u3dze113YGlFD82ccbpC5H-WCpBCnt_gDl-i65Xk0",
  },
];

const QUICK_CANDIDATES = [
  {
    id: "65f000000000000000000010",
    name: "Bro. Ayotunde Balogun",
    meta: "0803 451 9022 · Men's Fellowship",
    department: "Men's Fellowship",
  },
  {
    id: "65f000000000000000000011",
    name: "Deaconess Folashade Adeleke",
    meta: "0802 119 7854 · Good Women",
    department: "Women of Grace",
  },
];

export default function UsherLiveAttendancePage(): ReactNode {
  const defaultServiceId = "65f000000000000000000100";

  const { data } = useQuery(USHER_LIVE_QUERY, {
    variables: { serviceId: defaultServiceId },
    pollInterval: 5000,
    fetchPolicy: "network-only",
  });

  const [markManualMutation] = useMutation(MARK_MANUAL_MUTATION);
  const [registerGuestMutation] = useMutation(REGISTER_GUEST_MUTATION);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [markedIds, setMarkedIds] = useState<string[]>([]);
  const [feedItems, setFeedItems] = useState<FeedCard[]>(INITIAL_FEED);

  const [totalCount, setTotalCount] = useState<number>(312);
  const [memberCount, setMemberCount] = useState<number>(284);
  const [guestCount, setGuestCount] = useState<number>(28);
  const [manualCount, setManualCount] = useState<number>(14);

  const [guestModalOpen, setGuestModalOpen] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestInvitedBy, setGuestInvitedBy] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeServiceId: string =
    (data?.activeService?.id as string | undefined) ?? defaultServiceId;

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleManualCheckIn = async (
    candidate: (typeof QUICK_CANDIDATES)[number],
  ): Promise<void> => {
    if (markedIds.includes(candidate.id)) return;
    setMarkedIds((prev) => [...prev, candidate.id]);
    setTotalCount((c) => c + 1);
    setMemberCount((c) => c + 1);
    setManualCount((c) => c + 1);

    try {
      await markManualMutation({
        variables: {
          serviceId: activeServiceId,
          memberId: candidate.id,
          station: "Usher Terminal 02",
        },
      });
    } catch {
      // Offline/preview fallback handled below
    }

    const newCard: FeedCard = {
      id: `manual-${Date.now()}`,
      name: candidate.name,
      department: candidate.department,
      usherSubtext: "By Usher Emmanuel",
      timeLabel: "Just Now",
      mode: "Manual Check",
      justNow: true,
      initials: candidate.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
    setFeedItems((prev) => [newCard, ...prev]);
    showToast(`Marked ${candidate.name} as Present`);
  };

  const handleGuestSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const cleanName = guestName.trim() || "Church Visitor";
    const cleanPhone = guestPhone.trim() || "08031234567";

    try {
      await registerGuestMutation({
        variables: {
          input: {
            serviceId: activeServiceId,
            fullName: cleanName,
            phone: cleanPhone,
            invitedBy: guestInvitedBy.trim() || "Hospitality Desk",
            station: "Usher Terminal 02",
          },
        },
      });
    } catch {
      // Preview fallback below
    }

    const newGuestCard: FeedCard = {
      id: `guest-${Date.now()}`,
      name: cleanName,
      department: "First-time Visitor",
      guestSubtext: guestInvitedBy.trim()
        ? `Invited by: ${guestInvitedBy.trim()}`
        : "Assigned: Hospitality Desk",
      timeLabel: "Just Now",
      mode: "Guest Pass",
      isGuest: true,
      initials: cleanName.charAt(0).toUpperCase(),
    };

    setFeedItems((prev) => [newGuestCard, ...prev]);
    setTotalCount((c) => c + 1);
    setGuestCount((c) => c + 1);
    setGuestName("");
    setGuestPhone("");
    setGuestInvitedBy("");
    setGuestModalOpen(false);
    showToast(`Guest '${cleanName}' added to welcoming list!`);
  };

  const showSearchDrawer = searchQuery.trim().length > 1;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Top Header (12._usher_live_attendance_list) */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Link
              aria-label="Go back"
              href="/usher"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <img
              alt="ChurchConnect Brand Logo"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
            />
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">
              Usher Live
            </h1>
          </div>
          <div className="flex items-center">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface pb-safe">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto">
          {/* Usher Control Top Bar */}
          <div className="px-margin pt-space-md pb-space-sm bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between gap-space-sm mb-space-sm">
              <Link
                href="/usher"
                className="h-12 px-space-md rounded-lg bg-surface-container flex items-center gap-space-xs text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-primary text-[20px]">
                  arrow_back
                </span>
                <span className="font-label-md text-label-md font-semibold text-primary">
                  QR Screen
                </span>
              </Link>
              <div className="flex items-center gap-space-xs px-space-md py-space-xs bg-tertiary-container/15 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-tertiary-container opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-on-tertiary-container" />
                </span>
                <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold uppercase tracking-wider">
                  Live Desk
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="min-w-0 pr-space-xs">
                <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Usher Terminal 02
                </p>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold truncate">
                  Sunday First Service
                </h2>
              </div>
              <div className="text-right shrink-0">
                <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Total Check-ins
                </p>
                <p
                  className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-extrabold"
                  id="total-count-badge"
                >
                  {totalCount}{" "}
                  <span className="font-label-md text-label-md text-on-surface-variant font-normal">
                    Present
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Breakdown Bar */}
          <div className="px-margin py-space-sm bg-surface-container-low">
            <div className="grid grid-cols-3 gap-space-xs">
              <div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                  <span className="font-label-sm text-label-sm">Members</span>
                </div>
                <p className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                  {memberCount}
                </p>
              </div>
              <div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1 text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    person_add
                  </span>
                  <span className="font-label-sm text-label-sm">Guests</span>
                </div>
                <p className="font-headline-sm text-headline-sm text-secondary font-bold mt-1">
                  {guestCount}
                </p>
              </div>
              <div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    how_to_reg
                  </span>
                  <span className="font-label-sm text-label-sm">Manual</span>
                </div>
                <p className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                  {manualCount}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Guest Quick Action Bar */}
          <div className="p-margin space-y-space-sm">
            <div className="flex items-center gap-space-xs">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  id="member-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search member by name or phone (0803...)"
                  className="w-full h-12 pl-11 pr-space-md bg-surface-container-lowest rounded-lg text-on-surface font-body-md text-body-md placeholder:text-outline placeholder:font-body-sm shadow-sm focus:outline-none focus:bg-surface-container-lowest transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => setGuestModalOpen(true)}
                className="h-12 px-space-md bg-secondary text-on-secondary rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs shadow-sm hover:opacity-95 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>+ Add Guest</span>
              </button>
            </div>

            {/* Rapid Search Results Drawer */}
            {showSearchDrawer && (
              <div
                className="bg-surface-container-lowest rounded-xl p-space-sm shadow-md space-y-space-xs"
                id="search-drawer"
              >
                <div className="flex items-center justify-between px-space-xs pb-space-xs">
                  <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Quick Attendance Lookup
                  </p>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    Offline/No Camera Mode
                  </span>
                </div>
                {QUICK_CANDIDATES.map((candidate) => {
                  const isMarked = markedIds.includes(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between gap-space-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                          {candidate.name}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          {candidate.meta}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isMarked}
                        onClick={() => void handleManualCheckIn(candidate)}
                        className={`h-12 px-space-md rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer ${
                          isMarked
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-primary-container text-on-primary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isMarked ? "done" : "check_circle"}
                        </span>
                        <span>{isMarked ? "Checked" : "Mark Present"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incoming Live Stream Feed */}
          <div className="px-margin flex-1 pb-24">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">sensors</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Incoming Feed
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Real-time Usher Stream
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="incoming-feed-list">
              {feedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-space-md rounded-xl shadow-sm flex items-center justify-between gap-space-sm relative overflow-hidden transition-all duration-300 ${
                    item.isGuest ? "bg-secondary-fixed/30" : "bg-surface-container-lowest"
                  }`}
                >
                  {item.justNow && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                  )}
                  <div className="flex items-center gap-space-md min-w-0">
                    {item.avatarUrl ? (
                      <img
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 bg-surface-container"
                        src={item.avatarUrl}
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-headline-sm shrink-0 ${
                          item.isGuest
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-primary-container text-on-primary"
                        }`}
                      >
                        {item.initials ?? item.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <p className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                          {item.name}
                        </p>
                        {item.justNow && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                            Just Now
                          </span>
                        )}
                        {item.isGuest && (
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            star
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-body-sm text-body-sm truncate ${
                          item.isGuest ? "text-secondary font-medium" : "text-on-surface-variant"
                        }`}
                      >
                        {item.department}
                      </p>
                      {item.usherSubtext && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant italic mt-0.5">
                          {item.usherSubtext}
                        </p>
                      )}
                      {item.guestSubtext && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                          {item.guestSubtext}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      {item.timeLabel}
                    </span>
                    {item.mode === "Self Scan" && (
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          qr_code_scanner
                        </span>
                        Self Scan
                      </span>
                    )}
                    {item.mode === "Manual Check" && (
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Manual Check
                      </span>
                    )}
                    {item.mode === "Guest Pass" && (
                      <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          volunteer_activism
                        </span>
                        Guest Pass
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistent Bottom Action Floating Dock */}
          <div className="fixed bottom-0 left-0 right-0 p-margin bg-surface-container-lowest/95 backdrop-blur-md shadow-lg z-40">
            <div className="max-w-[600px] mx-auto flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => showToast("Exporting Service Attendance CSV...")}
                className="h-12 flex-1 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                <span>Export Roster</span>
              </button>
              <Link
                href="/usher"
                className="h-12 flex-1 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs hover:opacity-95 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                <span>Return to QR</span>
              </Link>
            </div>
          </div>

          {/* Guest Registration Modal Sheet */}
          {guestModalOpen && (
            <div
              className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex flex-col justify-end"
              id="guest-modal"
            >
              <form
                onSubmit={(e) => void handleGuestSubmit(e)}
                className="bg-surface-container-lowest rounded-t-2xl p-margin shadow-2xl max-w-[600px] w-full mx-auto space-y-space-md"
              >
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                      <span className="material-symbols-outlined text-[22px]">person_add</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        New Visitor Intake
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Immediate welcome registry
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestModalOpen(false)}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                </div>
                <div className="space-y-space-sm">
                  <div>
                    <label
                      htmlFor="guest-name"
                      className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Mr. Chinedu Eze"
                      className="w-full h-12 px-space-md rounded-lg bg-surface-container text-on-surface font-body-md text-body-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="guest-phone"
                      className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      id="guest-phone"
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="080... or 070..."
                      className="w-full h-12 px-space-md rounded-lg bg-surface-container text-on-surface font-body-md text-body-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="guest-invited-by"
                      className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1"
                    >
                      Invited By / Connection (Optional)
                    </label>
                    <input
                      id="guest-invited-by"
                      type="text"
                      value={guestInvitedBy}
                      onChange={(e) => setGuestInvitedBy(e.target.value)}
                      placeholder="Member name or Social media"
                      className="w-full h-12 px-space-md rounded-lg bg-surface-container text-on-surface font-body-md text-body-md focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-space-sm pt-space-xs">
                  <button
                    type="button"
                    onClick={() => setGuestModalOpen(false)}
                    className="h-12 flex-1 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-12 flex-1 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>Confirm &amp; Print Pass</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-full shadow-lg flex items-center gap-space-xs transition-opacity duration-300 pointer-events-none"
              id="toast"
            >
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">
                check_circle
              </span>
              <span className="font-label-md text-label-md font-semibold" id="toast-message">
                {toastMessage}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
