"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

const MY_PROFILE_QUERY = gql`
  query MyProfile {
    me {
      id
      fullName
      phone
      email
      gender
      role
      status
      department
      activities
      memberCode
      emergencyContact
      notes
      currentStreak
      longestStreak
    }
  }
`;

const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      id
      fullName
      phone
      email
      gender
      department
      activities
      memberCode
      emergencyContact
      notes
    }
  }
`;

interface MyProfileQueryData {
  me: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    gender?: string | null;
    role: "MEMBER" | "USHER" | "ADMIN";
    status: string;
    department: string;
    activities: string[];
    memberCode: string;
    emergencyContact?: string | null;
    notes?: string | null;
    currentStreak: number;
    longestStreak: number;
  } | null;
}

const ATTENDANCE_RECORDS = [
  {
    id: "rec-1",
    title: "Sunday First Service",
    dateTime: "Sunday 17 Nov 2024 · 8:42 AM",
    icon: "church",
    iconBoxClass: "bg-surface-container-high text-primary",
    method: "Self QR",
  },
  {
    id: "rec-2",
    title: "Special Thanksgiving",
    dateTime: "Sunday 10 Nov 2024 · 8:35 AM",
    icon: "celebration",
    iconBoxClass: "bg-secondary-fixed text-on-secondary-fixed",
    method: "Self QR",
  },
  {
    id: "rec-3",
    title: "Holy Communion Service",
    dateTime: "Sunday 03 Nov 2024 · 8:50 AM",
    icon: "wine_bar",
    iconBoxClass: "bg-surface-container-high text-primary",
    method: "Self QR",
  },
  {
    id: "rec-4",
    title: "Sunday First Service",
    dateTime: "Sunday 27 Oct 2024 · 9:05 AM",
    icon: "church",
    iconBoxClass: "bg-surface-container-high text-primary",
    method: "Usher Marked",
  },
] as const;

export default function ProfilePage(): ReactNode {
  const { data, refetch } = useQuery<MyProfileQueryData>(MY_PROFILE_QUERY, {
    fetchPolicy: "network-only",
  });
  const [updateProfile, { loading: saving }] = useMutation(UPDATE_MY_PROFILE_MUTATION);

  const member = data?.me ?? null;

  const [localOverride, setLocalOverride] = useState<{
    fullName: string;
    phone: string;
    email: string;
    gender: "Male" | "Female";
    emergencyContact: string;
  } | null>(null);

  const displayFullName = localOverride?.fullName ?? member?.fullName ?? "Isaac Olumide Adeleke";
  const displayPhone = localOverride?.phone ?? member?.phone ?? "+234 803 456 7890";
  const displayEmail = localOverride?.email ?? member?.email ?? "isaac.adeleke@gmail.com";
  const displayMemberCode = member?.memberCode ?? "CC-2024-0482";
  const displayDepartment = member?.department ?? "Sanctuary Choir (Tenor)";
  const displayActivities =
    member?.activities && member.activities.length > 0
      ? member.activities
      : ["Sunday School Class 4", "Midweek Bible Study", "Discipleship Cohort"];

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [formFullName, setFormFullName] = useState<string>(displayFullName);
  const [formPhone, setFormPhone] = useState<string>(displayPhone);
  const [formEmail, setFormEmail] = useState<string>(displayEmail);
  const [formGender, setFormGender] = useState<"Male" | "Female">("Male");
  const [formEmergency, setFormEmergency] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function openEditModal(): void {
    setFormFullName(displayFullName);
    setFormPhone(displayPhone);
    setFormEmail(displayEmail);
    setFormGender(
      (localOverride?.gender ?? (member?.gender as "Male" | "Female" | undefined)) || "Male",
    );
    setFormEmergency(localOverride?.emergencyContact ?? member?.emergencyContact ?? "");
    setErrorMsg(null);
    setEditModalOpen(true);
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setErrorMsg(null);

    if (member) {
      try {
        await updateProfile({
          variables: {
            input: {
              fullName: formFullName,
              phone: formPhone,
              email: formEmail,
              gender: formGender,
              emergencyContact: formEmergency,
            },
          },
        });
        await refetch();
        setEditModalOpen(false);
        setFeedbackMsg("Profile updated and synced with Grace Sanctuary Parish Registry.");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to update profile.");
      }
    } else {
      setLocalOverride({
        fullName: formFullName,
        phone: formPhone,
        email: formEmail,
        gender: formGender,
        emergencyContact: formEmergency,
      });
      setEditModalOpen(false);
      setFeedbackMsg("Profile updated in preview session.");
    }
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Top Header (8._member_profile) */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin max-w-[600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img
              alt="ChurchConnect Brand Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                ChurchConnect
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                Profile
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Notifications"
              type="button"
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
            <Link
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center"
              href="/profile"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin pb-space-xl">
          {feedbackMsg && (
            <div
              className="mt-space-sm rounded-xl bg-tertiary-fixed/50 text-on-tertiary-fixed-variant px-space-md py-space-sm font-label-sm text-label-sm flex items-center justify-between"
              role="status"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{feedbackMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-on-tertiary-fixed-variant hover:opacity-75 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Member Profile Header Card */}
          <section className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center relative overflow-hidden mt-space-sm">
            {/* Decorative Ambient Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-secondary-fixed/40 blur-xl pointer-events-none" />

            {/* Avatar with Verified Badge */}
            <div className="relative mb-space-md">
              <div className="w-24 h-24 rounded-full p-1 bg-surface-container-high shadow-md">
                <img
                  alt={displayFullName}
                  className="w-full h-full rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXdtUknAYU-IO0tTam1ILADXhwrRpQxy57E_ggOmbSBIuQzPo17vxOAgv3mAZYrK2cW3DERhDkJuL78Zz17J7O7PJencrRLOiG5G18aMTUcKE5Vv8v2SJfCBHPdIfV7C8AP-YZOQ_wL1zEu0nMgnXfYh-iR2HCGcqoVm0kYtoVyDHX56Si4SfBe5H-SWTx0P0PQ5htRgdYO7CF45gopcR8eHi3MlrpcoPaNDL8BM"
                />
              </div>
              <div className="absolute bottom-0 right-1 bg-tertiary-container text-on-tertiary-container rounded-full p-1 shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] material-icon-filled">
                  verified
                </span>
              </div>
            </div>

            {/* Member Name & ID Chip */}
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-xs">
              {displayFullName}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant mb-space-md shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
              <span className="font-label-sm text-label-sm font-semibold tracking-wide">
                ID: {displayMemberCode}
              </span>
            </div>

            {/* Status Indicator Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low text-secondary mb-space-md">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-label-md text-label-md font-medium text-on-surface">
                Active Member · Baptized
              </span>
            </div>

            {/* Contact Details */}
            <div className="flex flex-col items-center gap-1 text-on-surface-variant font-body-sm text-body-sm max-w-xs">
              <div className="flex items-center gap-1.5 text-center">
                <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                <span>{displayPhone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-center">
                <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                <span className="truncate">{displayEmail}</span>
              </div>
            </div>

            {/* Edit Profile Action Button */}
            <button
              onClick={openEditModal}
              className="mt-space-lg w-full h-12 bg-primary text-on-primary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              <span>Edit Profile Information</span>
            </button>
          </section>

          {/* Department & Ministry Affiliations */}
          <section className="mt-space-lg flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">groups</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Departments &amp; Roles
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">2 Units</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high text-on-surface shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  music_note
                </span>
                <span className="font-label-md text-label-md font-semibold">
                  {displayDepartment.includes("Choir")
                    ? "Sanctuary Choir (Tenor)"
                    : displayDepartment}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">star</span>
                <span className="font-label-md text-label-md font-semibold">
                  Youth Fellowship Executive
                </span>
              </div>
            </div>
          </section>

          {/* Fellowship Activities & Cohorts */}
          <section className="mt-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  menu_book
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Fellowship &amp; Growth
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {displayActivities.length} Groups
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayActivities.map((actName, idx) => {
                const icons = ["school", "auto_stories", "diversity_3", "water_drop"];
                const icon = icons[idx % icons.length];
                return (
                  <div
                    key={actName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      {icon}
                    </span>
                    <span className="font-label-md text-label-md">{actName}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Attendance History Log */}
          <section className="mt-space-lg flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  event_available
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Attendance Log
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-medium">
                Recent 4 Weeks
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              {ATTENDANCE_RECORDS.map((rec) => (
                <div
                  key={rec.id}
                  className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-start gap-space-sm">
                    <div
                      className={`w-10 h-10 rounded-lg ${rec.iconBoxClass} flex items-center justify-center shrink-0`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{rec.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          {rec.title}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {rec.dateTime}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                      Present
                    </span>
                    <span className="font-label-sm text-label-sm text-outline-variant">
                      {rec.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy & Regulatory Compliance Notice */}
          <section className="mt-space-lg mb-space-sm flex flex-col items-center text-center px-space-md">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-tertiary-container">
                verified_user
              </span>
              <span className="font-label-sm text-label-sm font-medium">NDPA 2023 Compliant</span>
            </div>
            <p className="font-body-sm text-body-sm text-outline mt-0.5">
              Data managed securely by Grace Sanctuary Parish
            </p>
          </section>
        </div>

        {/* Edit Profile Modal Drawer */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-margin">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    manage_accounts
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Edit Profile Information
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-error-container text-on-error-container px-space-md py-space-sm font-label-sm text-label-sm">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={(e) => void handleSaveProfile(e)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-fullname"
                    className="font-label-sm text-label-sm text-on-surface-variant"
                  >
                    Full Name
                  </label>
                  <input
                    id="edit-fullname"
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-phone"
                    className="font-label-sm text-label-sm text-on-surface-variant"
                  >
                    Phone Number (Nigeria +234)
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-email"
                    className="font-label-sm text-label-sm text-on-surface-variant"
                  >
                    Email Address
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Gender
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Male", "Female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormGender(g)}
                        className={`h-10 rounded-xl font-label-md text-label-md transition-colors cursor-pointer ${
                          formGender === g
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-emergency"
                    className="font-label-sm text-label-sm text-on-surface-variant"
                  >
                    Emergency Contact (Optional)
                  </label>
                  <input
                    id="edit-emergency"
                    type="text"
                    placeholder="+234 802 123 4567"
                    value={formEmergency}
                    onChange={(e) => setFormEmergency(e.target.value)}
                    className="h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-space-sm pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="h-11 px-space-md rounded-xl bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-11 px-space-lg rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Stitch Persistent 4-Slot Member Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex justify-around items-center h-16 max-w-[600px] mx-auto px-space-xs">
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-label-sm text-label-sm">Home</span>
          </Link>
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/streak"
          >
            <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
            <span className="font-label-sm text-label-sm">Streak</span>
          </Link>
          <Link
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
            <span className="font-label-sm text-label-sm">Photos</span>
          </Link>
          <Link
            aria-current="page"
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors text-primary-container font-semibold"
            href="/profile"
          >
            <span className="material-symbols-outlined text-[24px] material-icon-filled">
              person
            </span>
            <span className="font-label-sm text-label-sm">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
