"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

const MY_PROFILE_QUERY = gql`
  query MyProfile {
    me {
      id
      fullName
      phone
      email
      gender
      avatarUrl
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
    myAttendanceHistory {
      id
      serviceId
      memberName
      method
      station
      checkedInAt
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
      avatarUrl
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
    avatarUrl?: string | null;
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
  myAttendanceHistory: Array<{
    id: string;
    serviceId: string;
    memberName: string;
    method: string;
    station: string;
    checkedInAt: string;
  }>;
}

export default function ProfilePage(): ReactNode {
  const { data, refetch } = useQuery<MyProfileQueryData>(MY_PROFILE_QUERY, {
    fetchPolicy: "network-only",
  });
  const [updateProfile, { loading: saving }] = useMutation(UPDATE_MY_PROFILE_MUTATION);

  const member = data?.me ?? null;
  const attendanceHistory = data?.myAttendanceHistory ?? [];

  const displayFullName = member?.fullName ?? "Not Signed In";
  const displayPhone = member?.phone ?? "—";
  const displayEmail = member?.email || "No email provided";
  const displayMemberCode = member?.memberCode ?? "—";
  const displayDepartment = member?.department || "Unassigned";
  const displayActivities = member?.activities ?? [];
  const displayAvatarUrl = member?.avatarUrl || "/rccg-logo.png";

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [formFullName, setFormFullName] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formGender, setFormGender] = useState<"Male" | "Female">("Male");
  const [formEmergency, setFormEmergency] = useState<string>("");
  const [formAvatarBase64, setFormAvatarBase64] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function openEditModal(): void {
    setFormFullName(member?.fullName ?? "");
    setFormPhone(member?.phone ?? "");
    setFormEmail(member?.email ?? "");
    setFormGender((member?.gender as "Male" | "Female" | undefined) ?? "Male");
    setFormEmergency(member?.emergencyContact ?? "");
    setFormAvatarBase64(null);
    setErrorMsg(null);
    setEditModalOpen(true);
  }

  function handleAvatarFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormAvatarBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setErrorMsg(null);

    if (!member) {
      setErrorMsg("Please sign in first to update your profile.");
      return;
    }

    try {
      await updateProfile({
        variables: {
          input: {
            fullName: formFullName,
            phone: formPhone,
            email: formEmail,
            gender: formGender,
            emergencyContact: formEmergency,
            ...(formAvatarBase64 ? { avatarBase64: formAvatarBase64 } : {}),
          },
        },
      });
      await refetch();
      setEditModalOpen(false);
      setFeedbackMsg("Profile and Cloudinary avatar synced with RCCG JESUS HOUSE, OGBOMOSHO.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile.");
    }
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      {/* Stitch Top Header (8._member_profile) */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <img
              alt="RCCG JESUS HOUSE, OGBOMOSHO Logo"
              className="h-8 w-8 object-contain"
              src="/rccg-logo.png"
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                RCCG JESUS HOUSE, OGBOMOSHO
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
                className="w-8 h-8 rounded-full object-cover bg-surface-container"
                src={displayAvatarUrl}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-space-xl">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-space-sm">
            {/* Left Column on Desktop: Member Profile Header Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <section className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-secondary-fixed/40 blur-xl pointer-events-none" />

                {/* Avatar with Verified Badge */}
                <div className="relative mb-space-md">
                  <div className="w-24 h-24 rounded-full p-1 bg-surface-container-high shadow-md">
                    <img
                      alt={displayFullName}
                      className="w-full h-full rounded-full object-cover bg-white"
                      src={displayAvatarUrl}
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
                    {member ? `${member.status} · ${member.role}` : "Guest Session"}
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
                  <span>Edit Profile &amp; Photo</span>
                </button>
              </section>

              {/* Privacy & Regulatory Compliance Notice */}
              <section className="flex flex-col items-center text-center px-space-md py-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-container">
                    verified_user
                  </span>
                  <span className="font-label-sm text-label-sm font-medium">
                    NDPA 2023 Compliant
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  Data managed securely by RCCG JESUS HOUSE, OGBOMOSHO
                </p>
              </section>
            </div>

            {/* Right Column on Desktop: Departments, Activities & Attendance Log */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Department & Ministry Affiliations */}
              <section className="flex flex-col gap-space-sm bg-surface-container-lowest rounded-xl p-space-md sm:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      groups
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      Departments &amp; Roles
                    </h2>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {displayDepartment && displayDepartment !== "Unassigned" ? "1 Unit" : "0 Units"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high text-on-surface shadow-xs">
                    <span className="material-symbols-outlined text-[18px] text-primary-container">
                      groups
                    </span>
                    <span className="font-label-md text-label-md font-semibold">
                      {displayDepartment}
                    </span>
                  </div>
                </div>
              </section>

              {/* Fellowship Activities & Cohorts */}
              <section className="flex flex-col gap-space-sm bg-surface-container-lowest rounded-xl p-space-md sm:p-6 shadow-sm">
                <div className="flex items-center justify-between">
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
                {displayActivities.length > 0 ? (
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
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    No weekly activities assigned yet.
                  </p>
                )}
              </section>

              {/* Attendance History Log (from MongoDB) */}
              <section className="flex flex-col gap-space-sm">
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
                    {attendanceHistory.length} Record(s)
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-start gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[22px]">church</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                                {rec.station}
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {new Date(rec.checkedInAt).toLocaleString()}
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
                    ))
                  ) : (
                    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm text-center text-on-surface-variant font-body-sm text-body-sm">
                      No attendance records found in the database yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
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
                    htmlFor="edit-avatar"
                    className="font-label-sm text-label-sm text-on-surface-variant"
                  >
                    Profile Picture (Uploads to Cloudinary)
                  </label>
                  <input
                    id="edit-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="py-2 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm"
                  />
                </div>

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
                    placeholder="+234 802 000 0000"
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
                    {saving ? "Uploading & Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Stitch Persistent 4-Slot Member Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.05)]">
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
            href="/photos"
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
