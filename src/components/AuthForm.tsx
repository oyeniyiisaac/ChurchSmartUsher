"use client";

import { gql, useMutation } from "@apollo/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { getSafeReturnTo } from "@/services/validation";

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      redirectTo
      member {
        id
        fullName
        phone
        role
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      redirectTo
      member {
        id
        fullName
        phone
        role
      }
    }
  }
`;

export interface AuthFormProps {
  mode: "login" | "register";
}

interface AuthMutationData {
  login?: {
    redirectTo: string;
    member: {
      id: string;
      fullName: string;
      phone: string;
      role: string;
    };
  };
  register?: {
    redirectTo: string;
    member: {
      id: string;
      fullName: string;
      phone: string;
      role: string;
    };
  };
}

const DEPARTMENTS = [
  { label: "Sanctuary Choir", icon: "music_note" },
  { label: "Ushering & Protocol", icon: "groups" },
  { label: "Media & Sound", icon: "videocam" },
  { label: "Youth Fellowship", icon: "volunteer_activism" },
  { label: "Sunday School", icon: "menu_book" },
  { label: "No Department / General Member", icon: "favorite" },
] as const;

export function AuthForm({ mode }: AuthFormProps): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = getSafeReturnTo(searchParams.get("returnTo"));

  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("password");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [department, setDepartment] = useState<string>("Sanctuary Choir");
  const [consentGiven, setConsentGiven] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginMutation, { loading: loginLoading }] = useMutation<AuthMutationData>(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading }] =
    useMutation<AuthMutationData>(REGISTER_MUTATION);

  const isLoading = loginLoading || registerLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (mode === "login" && loginMethod === "otp") {
      setLoginMethod("password");
      return;
    }

    try {
      if (mode === "login") {
        const { data } = await loginMutation({
          variables: {
            input: {
              phone,
              password,
              returnTo: returnToParam,
            },
          },
        });
        const redirectTo = data?.login?.redirectTo ?? "/dashboard";
        router.push(redirectTo);
        router.refresh();
      } else {
        const { data } = await registerMutation({
          variables: {
            input: {
              fullName,
              phone,
              password,
              consentGiven,
              returnTo: returnToParam,
            },
          },
        });
        const redirectTo = data?.register?.redirectTo ?? "/dashboard";
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Authentication failed. Please try again.");
      }
    }
  }

  function fillSeedCredentials(seedPhone: string): void {
    setLoginMethod("password");
    setPhone(seedPhone);
    setPassword("ChangeMe123!");
    setErrorMessage(null);
  }

  const switchQuery = returnToParam ? `?returnTo=${encodeURIComponent(returnToParam)}` : "";

  if (mode === "register") {
    return (
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface">
        <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin pb-12">
          <div className="flex items-center justify-between py-space-sm mb-space-sm">
            <Link
              href={`/login${switchQuery}`}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface transition-colors active:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
            <div className="flex items-center space-x-1.5 bg-surface-container-high px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              <span className="font-label-sm text-label-sm text-on-surface">Step 1 of 2</span>
            </div>
          </div>

          <div className="flex items-center gap-space-md mb-space-lg bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-surface-container">
              <img
                className="w-full h-full object-cover"
                alt="Warm portrait of a welcoming church member"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLguqvF0DLU1mRRub7L8K1kXeummankdtrDkgii-ndPmhkp4Qzdtx4M7wC5KXl0n81MpKgKksY3vFTqpqj-VCH7mk-tNJaUtrg2UCDQQaSvEA7X2iO9ZGO_QA2zczlGVXj6WNBPhDfoG1L8d-1KuPo_TvoOjSD_mbgkbyi41Efm6ph3gGchN3YdShyPv7j2nofJglPUl4QDyy2aBkLXFpgOqbNNuXSf3ImhXW3deE"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
                Join ChurchConnect
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                Register your digital member profile in under 2 minutes.
              </p>
            </div>
          </div>

          {returnToParam && (
            <div
              className="flex items-center gap-2 rounded-xl bg-tertiary-fixed/40 text-on-tertiary-fixed-variant px-space-md py-space-sm mb-space-md font-label-sm text-label-sm"
              role="status"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>Return destination saved: {returnToParam}</span>
            </div>
          )}

          {errorMessage && (
            <div
              className="flex items-center gap-2 rounded-xl bg-error-container text-on-error-container px-space-md py-space-sm mb-space-md font-label-sm text-label-sm"
              role="alert"
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            className="flex flex-col gap-space-lg"
            id="register-form"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="fullName"
              >
                <span>Full Name</span>
                <span className="font-label-sm text-label-sm text-primary">Required</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                  person
                </span>
                <input
                  className="w-full h-[52px] pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  id="fullName"
                  placeholder="Isaac Olumide Adeleke"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  type="text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="phoneNumber"
              >
                <span>Phone Number</span>
                <span className="font-label-sm text-label-sm text-primary">Required</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                  phone
                </span>
                <input
                  className="w-full h-[52px] pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  id="phoneNumber"
                  placeholder="+234 803 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  type="tel"
                />
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant px-1">
                Used for fast service check-in verification
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="emailAddress"
              >
                <span>Email Address</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Optional
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                  mail
                </span>
                <input
                  className="w-full h-[52px] pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  id="emailAddress"
                  placeholder="isaac.adeleke@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="registerPassword"
              >
                <span>Account Password</span>
                <span className="font-label-sm text-label-sm text-primary">Required</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                  lock
                </span>
                <input
                  className="w-full h-[52px] pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  id="registerPassword"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  type="password"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface">Gender</label>
              <div className="grid grid-cols-2 gap-3" id="gender-group">
                <button
                  className={`h-[50px] rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all shadow-sm cursor-pointer ${
                    gender === "Male"
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-container-lowest text-on-surface"
                  }`}
                  onClick={() => setGender("Male")}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">male</span>
                  <span>Male</span>
                </button>
                <button
                  className={`h-[50px] rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all shadow-sm cursor-pointer ${
                    gender === "Female"
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-container-lowest text-on-surface"
                  }`}
                  onClick={() => setGender("Female")}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">female</span>
                  <span>Female</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface">
                  Fellowship &amp; Department
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Choose one
                </span>
              </div>
              <div className="flex flex-wrap gap-2" id="dept-pills">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = department === dept.label;
                  return (
                    <button
                      key={dept.label}
                      type="button"
                      onClick={() => setDepartment(dept.label)}
                      className={`px-3.5 py-2.5 rounded-xl font-body-sm text-body-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container-lowest text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{dept.icon}</span>
                      {dept.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-3 mt-1">
              <div className="pt-0.5 shrink-0">
                <input
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-container accent-primary-container cursor-pointer"
                  id="ndpaConsent"
                  required
                  type="checkbox"
                />
              </div>
              <label
                className="font-body-sm text-body-sm text-on-surface cursor-pointer leading-snug"
                htmlFor="ndpaConsent"
              >
                I consent to ChurchConnect storing my profile and attendance records for church
                fellowship and ministry administration in compliance with NDPA 2023.
              </label>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                className="w-full h-14 bg-primary-container text-on-primary font-headline-sm text-headline-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:bg-primary transition-colors cursor-pointer disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                <span>{isLoading ? "Creating Profile..." : "Complete Registration"}</span>
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 py-2">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Already have an account?
                </span>
                <Link
                  href={`/login${switchQuery}`}
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </form>

          <div className="mt-space-lg flex items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span className="font-label-sm text-label-sm">Secured Sanctuary Protocol System</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface">
      <div className="flex flex-col w-full max-w-[600px] mx-auto px-margin pt-space-md pb-space-2xl">
        {/* Subtle decorative ambient greeting banner */}
        <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low shadow-sm mb-space-lg p-space-md">
          <div className="flex items-center gap-space-md">
            <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm flex items-center justify-center p-space-xs">
              <img
                alt="ChurchConnect Brand Logo"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7NEpelKc3mHXSIAhc2iqycO8lUp6JVPLL0f8KwlMm6F-ko5kgCJF7GHgTucFRSa_u8gz3TRePbY_-508i43VqKH-4g4QNI88bF0luoqf6XQu4iNGXbm5wVNElC-reLG2MaaOPj6Zlp5leiT7pkKOujqWQio1OHzn6nA8gqV0ktKXL4-8YYIeYTHuA5eUjAsbqU71wQ6R3A8eZxx1FdL6MLt4_ZUWprTMDFGy1fhg"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="inline-flex items-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed rounded-full px-space-sm py-0.5 w-max">
                <span className="material-symbols-outlined text-[14px]">church</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">
                  Sanctuary Portal
                </span>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight truncate mt-1">
                ChurchConnect
              </h1>
            </div>
          </div>
        </div>

        {/* Welcome Statement */}
        <div className="flex flex-col mb-space-xl">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Welcome to your church family portal
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs leading-relaxed">
            Sign in to confirm attendance, track your consistency, and save service memories.
          </p>
        </div>

        {returnToParam && (
          <div
            className="flex items-center gap-2 rounded-xl bg-tertiary-fixed/40 text-on-tertiary-fixed-variant px-space-md py-space-sm mb-space-md font-label-sm text-label-sm"
            role="status"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Return destination saved: {returnToParam}</span>
          </div>
        )}

        {errorMessage && (
          <div
            className="flex items-center gap-2 rounded-xl bg-error-container text-on-error-container px-space-md py-space-sm mb-space-md font-label-sm text-label-sm"
            role="alert"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form Card */}
        <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-lg">
          <form className="flex flex-col gap-space-md" onSubmit={(e) => void handleSubmit(e)}>
            {/* Method Selector: OTP vs Password */}
            <div className="grid grid-cols-2 p-1 bg-surface-container rounded-lg">
              <button
                className={`h-10 rounded-md font-label-md text-label-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  loginMethod === "otp"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
                id="tab-otp"
                onClick={() => setLoginMethod("otp")}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">sms</span>
                <span>Instant Code</span>
              </button>
              <button
                className={`h-10 rounded-md font-label-md text-label-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  loginMethod === "password"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
                id="tab-pass"
                onClick={() => setLoginMethod("password")}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Password</span>
              </button>
            </div>

            {/* Phone Number Field */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface-variant"
                htmlFor="phone-input"
              >
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                {/* Country Code Picker */}
                <div className="h-[52px] px-3 bg-surface-container-low rounded-xl flex items-center gap-1.5 shrink-0 text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-primary">flag</span>
                  <span className="font-body-md text-body-md font-medium">+234</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    expand_more
                  </span>
                </div>
                {/* Phone Number Input */}
                <div className="relative flex-1">
                  <input
                    className="w-full h-[52px] px-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner"
                    id="phone-input"
                    placeholder="0803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    type="tel"
                  />
                </div>
              </div>
            </div>

            {/* Conditional Password Field */}
            {loginMethod === "password" ? (
              <div className="flex flex-col gap-1.5" id="password-container">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-md text-label-md text-on-surface-variant"
                    htmlFor="password-input"
                  >
                    Account Password
                  </label>
                  <span className="font-label-sm text-label-sm text-primary flex items-center gap-0.5">
                    60-day session active
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    className="w-full h-[52px] pl-4 pr-12 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner"
                    id="password-input"
                    placeholder="Enter your church passkey"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="absolute right-3 p-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px]" id="eye-icon">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-start gap-2 bg-surface-container-low rounded-lg p-space-sm text-on-surface-variant"
                id="otp-hint"
              >
                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                  verified_user
                </span>
                <p className="font-body-sm text-body-sm">
                  We will send a 6-digit confirmation code via SMS or WhatsApp to this number.
                </p>
              </div>
            )}

            {/* Primary Sign In Button */}
            <button
              className="w-full h-[52px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span id="sign-in-label">
                {isLoading
                  ? "Signing In..."
                  : loginMethod === "otp"
                    ? "Get One-Time Code"
                    : "Sign In"}
              </span>
            </button>
          </form>

          {/* Social / Secondary Divider */}
          <div className="relative flex items-center justify-center my-space-lg">
            <div className="w-full h-[1px] bg-surface-container" />
            <span className="absolute px-3 bg-surface-container-lowest font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              or continue with
            </span>
          </div>

          {/* Alternative Sign-in / Seed Quick Fill Buttons */}
          <div className="grid grid-cols-3 gap-space-xs">
            <button
              className="h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              type="button"
              onClick={() => fillSeedCredentials("08000000003")}
            >
              <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
              <span>Member</span>
            </button>
            <button
              className="h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              type="button"
              onClick={() => fillSeedCredentials("08000000002")}
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">
                qr_code_scanner
              </span>
              <span>Usher</span>
            </button>
            <button
              className="h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              type="button"
              onClick={() => fillSeedCredentials("08000000001")}
            >
              <span className="material-symbols-outlined text-tertiary text-[18px]">
                admin_panel_settings
              </span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Registration Link Card */}
        <div className="w-full rounded-xl bg-secondary-fixed/30 p-space-md flex items-center justify-between shadow-sm mb-space-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface">
                First time worshipping here?
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                New member or first-time visitor?
              </span>
            </div>
          </div>
          <Link
            className="h-10 px-3 rounded-lg bg-surface-container-lowest text-secondary font-label-md text-label-md shadow-sm flex items-center gap-1 shrink-0 hover:bg-surface-container-low"
            href={`/register${switchQuery}`}
          >
            <span>Create account</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* Parish Sanctuary Footer Reassurance */}
        <div className="flex flex-col items-center justify-center text-center gap-1.5 p-space-md rounded-xl bg-surface-container-low">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span className="font-label-md text-label-md font-semibold">
              Grace Sanctuary Parish, Lagos
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Connecting the body of Christ in worship, fellowship, and truth.
          </p>
        </div>
      </div>
    </main>
  );
}
