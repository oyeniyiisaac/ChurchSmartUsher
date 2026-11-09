"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
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

const REQUEST_AUTH_OTP_MUTATION = gql`
  mutation RequestAuthOtp($phone: String!, $channel: String, $purpose: String) {
    requestAuthOtp(phone: $phone, channel: $channel, purpose: $purpose) {
      phone
      maskedPhone
      channel
      purpose
      expiresAt
      code
      whatsappDeepLink
      deliveryNote
    }
  }
`;

const VERIFY_LOGIN_OTP_MUTATION = gql`
  mutation VerifyLoginOtp($phone: String!, $code: String!, $returnTo: String) {
    verifyLoginOtp(phone: $phone, code: $code, returnTo: $returnTo) {
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

const RESET_PASSWORD_WITH_OTP_MUTATION = gql`
  mutation ResetPasswordWithOtp($phone: String!, $code: String!, $newPassword: String!) {
    resetPasswordWithOtp(phone: $phone, code: $code, newPassword: $newPassword) {
      success
      message
    }
  }
`;

const PUBLIC_DEPARTMENTS_QUERY = gql`
  query PublicDepartments {
    departments {
      id
      name
      icon
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

interface RequestAuthOtpData {
  requestAuthOtp: {
    phone: string;
    maskedPhone: string;
    channel: string;
    purpose: string;
    expiresAt: string;
    code: string;
    whatsappDeepLink?: string;
    deliveryNote: string;
  };
}

interface VerifyLoginOtpData {
  verifyLoginOtp: {
    redirectTo: string;
    member: {
      id: string;
      fullName: string;
      phone: string;
      role: string;
    };
  };
}

interface ResetPasswordData {
  resetPasswordWithOtp: {
    success: boolean;
    message: string;
  };
}

interface PublicDepartmentsData {
  departments: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export function AuthForm({ mode }: AuthFormProps): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = getSafeReturnTo(searchParams.get("returnTo"));

  // Common authentication state
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("password");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [department, setDepartment] = useState<string>("General Member");
  const [consentGiven, setConsentGiven] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Instant OTP state
  const [otpChannel, setOtpChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP");
  const [otpStep, setOtpStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpDispatchedInfo, setOtpDispatchedInfo] = useState<
    RequestAuthOtpData["requestAuthOtp"] | null
  >(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<"REQUEST" | "RESET">("REQUEST");
  const [forgotChannel, setForgotChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP");
  const [forgotPhone, setForgotPhone] = useState<string>("");
  const [forgotCode, setForgotCode] = useState<string>("");
  const [forgotNewPassword, setForgotNewPassword] = useState<string>("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>("");
  const [forgotShowPassword, setForgotShowPassword] = useState<boolean>(false);
  const [forgotDispatchedInfo, setForgotDispatchedInfo] = useState<
    RequestAuthOtpData["requestAuthOtp"] | null
  >(null);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  const { data: deptData } = useQuery<PublicDepartmentsData>(PUBLIC_DEPARTMENTS_QUERY);
  const [loginMutation, { loading: loginLoading }] = useMutation<AuthMutationData>(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading }] =
    useMutation<AuthMutationData>(REGISTER_MUTATION);
  const [requestAuthOtpMutation, { loading: requestOtpLoading }] =
    useMutation<RequestAuthOtpData>(REQUEST_AUTH_OTP_MUTATION);
  const [verifyLoginOtpMutation, { loading: verifyOtpLoading }] =
    useMutation<VerifyLoginOtpData>(VERIFY_LOGIN_OTP_MUTATION);
  const [resetPasswordMutation, { loading: resetPasswordLoading }] = useMutation<ResetPasswordData>(
    RESET_PASSWORD_WITH_OTP_MUTATION,
  );

  const isLoading =
    loginLoading ||
    registerLoading ||
    requestOtpLoading ||
    verifyOtpLoading ||
    resetPasswordLoading;

  const baseDepartmentChoices = [
    { label: "General Member", icon: "favorite" },
    { label: "Media Unit", icon: "photo_camera" },
    { label: "Ushering Unit", icon: "badge" },
    { label: "Sanctuary Choir", icon: "music_note" },
    { label: "Prayer Band", icon: "volunteer_activism" },
    { label: "Sanctuary Keepers", icon: "cleaning_services" },
  ];

  const dbDeptChoices = (deptData?.departments ?? []).map((d) => ({
    label: d.name,
    icon: d.icon || "groups",
  }));

  const seenLabels = new Set<string>();
  const departmentChoices = [...dbDeptChoices, ...baseDepartmentChoices].filter((item) => {
    const key = item.label.trim().toLowerCase();
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });

  async function handleRequestInstantOtp(): Promise<void> {
    setErrorMessage(null);
    setInfoMessage(null);
    if (!phone || phone.trim().length < 8) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    try {
      const res = await requestAuthOtpMutation({
        variables: {
          phone,
          channel: otpChannel,
          purpose: "LOGIN",
        },
      });

      if (res.data?.requestAuthOtp) {
        setOtpDispatchedInfo(res.data.requestAuthOtp);
        setOtpStep("VERIFY");
        setInfoMessage(
          `Instant code dispatched to ${res.data.requestAuthOtp.maskedPhone} via ${res.data.requestAuthOtp.channel}.`,
        );
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send instant login code.");
    }
  }

  async function handleVerifyInstantOtp(): Promise<void> {
    setErrorMessage(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit confirmation code.");
      return;
    }

    try {
      const target = returnToParam || "/dashboard";
      const res = await verifyLoginOtpMutation({
        variables: {
          phone,
          code: otpCode.trim(),
          returnTo: target,
        },
      });

      const redirectTo = returnToParam || res.data?.verifyLoginOtp?.redirectTo || "/dashboard";
      window.location.assign(redirectTo);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Verification failed. Please check the code.",
      );
    }
  }

  async function handleRequestForgotOtp(): Promise<void> {
    setErrorMessage(null);
    setForgotSuccessMessage(null);
    if (!forgotPhone || forgotPhone.trim().length < 8) {
      setErrorMessage("Please enter your account phone number.");
      return;
    }

    try {
      const res = await requestAuthOtpMutation({
        variables: {
          phone: forgotPhone,
          channel: forgotChannel,
          purpose: "PASSWORD_RESET",
        },
      });

      if (res.data?.requestAuthOtp) {
        setForgotDispatchedInfo(res.data.requestAuthOtp);
        setForgotStep("RESET");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send password reset code.");
    }
  }

  async function handleResetPasswordWithOtp(): Promise<void> {
    setErrorMessage(null);
    if (!forgotCode || forgotCode.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit reset code.");
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    try {
      const res = await resetPasswordMutation({
        variables: {
          phone: forgotPhone,
          code: forgotCode.trim(),
          newPassword: forgotNewPassword,
        },
      });

      if (res.data?.resetPasswordWithOtp?.success) {
        setForgotSuccessMessage(res.data.resetPasswordWithOtp.message);
        setTimeout(() => {
          setPhone(forgotPhone);
          setPassword(forgotNewPassword);
          setShowForgotPassword(false);
          setForgotStep("REQUEST");
          setForgotCode("");
          setForgotNewPassword("");
          setForgotConfirmPassword("");
          setLoginMethod("password");
        }, 1800);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Password reset failed. Please check the code.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (mode === "login" && loginMethod === "otp") {
      if (otpStep === "REQUEST") {
        await handleRequestInstantOtp();
      } else {
        await handleVerifyInstantOtp();
      }
      return;
    }

    try {
      if (mode === "login") {
        const target = returnToParam || "/dashboard";
        const { data } = await loginMutation({
          variables: {
            input: {
              phone,
              password,
              returnTo: target,
            },
          },
        });
        const redirectTo = returnToParam || data?.login?.redirectTo || "/dashboard";
        // Clean navigation ensures the session cookie is attached to the page request
        // and layout Apollo client mounts fresh with authenticated member context.
        window.location.assign(redirectTo);
      } else {
        const target = returnToParam || "/dashboard";
        const { data } = await registerMutation({
          variables: {
            input: {
              fullName,
              phone,
              email,
              gender,
              department,
              password,
              consentGiven,
              returnTo: target,
            },
          },
        });
        const redirectTo = returnToParam || data?.register?.redirectTo || "/dashboard";
        window.location.assign(redirectTo);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Authentication failed. Please try again.");
      }
    }
  }

  const switchQuery = returnToParam ? `?returnTo=${encodeURIComponent(returnToParam)}` : "";

  if (mode === "register") {
    return (
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface">
        <div className="flex flex-col w-full max-w-[600px] md:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:py-6">
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
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-surface-container-lowest p-1 border border-outline-variant/20">
              <img
                className="w-full h-full object-contain"
                alt="RCCG JESUS HOUSE, OGBOMOSHO Logo"
                src="/rccg-logo.png"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
                RCCG JESUS HOUSE, OGBOMOSHO
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
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="phone"
              >
                <span>Phone Number</span>
                <span className="font-label-sm text-label-sm text-primary">Required</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="h-[52px] px-3 bg-surface-container-lowest rounded-xl flex items-center gap-1.5 shrink-0 text-on-surface shadow-sm">
                  <span className="material-symbols-outlined text-[20px] text-primary">flag</span>
                  <span className="font-body-md text-body-md font-medium">+234</span>
                </div>
                <div className="relative flex-1">
                  <input
                    className="w-full h-[52px] px-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                    id="phone"
                    placeholder="0803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    type="tel"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="email"
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
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("Male")}
                  className={`h-12 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                    gender === "Male"
                      ? "bg-primary-container text-on-primary ring-2 ring-primary"
                      : "bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">man</span>
                  <span>Male</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("Female")}
                  className={`h-12 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                    gender === "Female"
                      ? "bg-primary-container text-on-primary ring-2 ring-primary"
                      : "bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">woman</span>
                  <span>Female</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                htmlFor="password"
              >
                <span>Account Password</span>
                <span className="font-label-sm text-label-sm text-primary">Min 8 characters</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                  lock
                </span>
                <input
                  className="w-full h-[52px] pl-11 pr-12 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  id="password"
                  placeholder="Create password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-3 p-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface">
                  Church Unit / Department
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Select one
                </span>
              </div>
              <div className="flex flex-wrap gap-2" id="dept-pills">
                {departmentChoices.map((dept) => {
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
                I consent to RCCG JESUS HOUSE, OGBOMOSHO storing my profile and attendance records
                for church fellowship and ministry administration in compliance with NDPA 2023.
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
            <span className="font-label-sm text-label-sm">
              RCCG JESUS HOUSE, OGBOMOSHO · Secured Sanctuary System
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface">
      <div className="flex flex-col w-full max-w-[600px] md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-space-md lg:pt-10 pb-space-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column on Desktop: Brand Welcome, Registration CTA & Parish Footer */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low shadow-sm mb-space-lg p-space-md">
              <div className="flex items-center gap-space-md">
                <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm flex items-center justify-center p-space-xs">
                  <img
                    alt="RCCG JESUS HOUSE, OGBOMOSHO Logo"
                    className="w-full h-full object-contain"
                    src="/rccg-logo.png"
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
                    RCCG JESUS HOUSE, OGBOMOSHO
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex flex-col mb-space-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Welcome to your church family portal
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs leading-relaxed">
                Sign in with your phone to confirm attendance, track your consistency, and save
                service memories.
              </p>
            </div>

            <div className="hidden lg:flex w-full rounded-xl bg-secondary-fixed/30 p-space-md items-center justify-between shadow-sm mb-space-md gap-3">
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

            <div className="hidden lg:flex flex-col items-center justify-center text-center gap-1.5 p-space-md rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="font-label-md text-label-md font-semibold">
                  RCCG JESUS HOUSE, OGBOMOSHO
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Connecting the body of Christ in worship, fellowship, and truth.
              </p>
            </div>
          </div>

          {/* Right Column on Desktop: Sign In / Forgot Password Card */}
          <div className="lg:col-span-7 flex flex-col">
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

            {infoMessage && (
              <div
                className="flex items-center gap-2 rounded-xl bg-secondary-fixed/40 text-on-secondary-fixed-variant px-space-md py-space-sm mb-space-md font-label-sm text-label-sm"
                role="status"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{infoMessage}</span>
              </div>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {showForgotPassword ? (
              <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-lg border border-outline-variant/30">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotStep("REQUEST");
                        setErrorMessage(null);
                      }}
                      className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
                      aria-label="Back to Login"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    </button>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Reset Password
                      </h3>
                      <p className="font-body-xs text-xs text-on-surface-variant">
                        Free instant recovery via WhatsApp or SMS
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-container text-on-primary">
                    Security
                  </span>
                </div>

                {forgotSuccessMessage ? (
                  <div className="p-4 rounded-xl bg-secondary-fixed/30 text-on-surface text-center flex flex-col items-center gap-2 py-6">
                    <span className="material-symbols-outlined text-secondary text-4xl">
                      task_alt
                    </span>
                    <p className="font-headline-sm text-headline-sm">{forgotSuccessMessage}</p>
                    <p className="text-xs text-on-surface-variant">Switching to Sign In...</p>
                  </div>
                ) : forgotStep === "REQUEST" ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant"
                        htmlFor="forgot-phone"
                      >
                        Enter Registered Phone Number
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="h-[52px] px-3 bg-surface-container-low rounded-xl flex items-center gap-1.5 shrink-0 text-on-surface">
                          <span className="material-symbols-outlined text-[20px] text-primary">
                            flag
                          </span>
                          <span className="font-body-md text-body-md font-medium">+234</span>
                        </div>
                        <input
                          className="flex-1 h-[52px] px-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner"
                          id="forgot-phone"
                          placeholder="0803 000 0000"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                          type="tel"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface-variant">
                        Select Free Dispatch Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForgotChannel("WHATSAPP")}
                          className={`h-11 rounded-xl text-body-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                            forgotChannel === "WHATSAPP"
                              ? "bg-[#25D366]/15 border-[#25D366] text-[#128C7E] font-semibold"
                              : "bg-surface-container-low border-transparent text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          <span>WhatsApp (Free)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForgotChannel("SMS")}
                          className={`h-11 rounded-xl text-body-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                            forgotChannel === "SMS"
                              ? "bg-primary-container border-primary text-on-primary font-semibold"
                              : "bg-surface-container-low border-transparent text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">sms</span>
                          <span>SMS Message</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleRequestForgotOtp()}
                      disabled={isLoading}
                      className="w-full h-[52px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      <span>{isLoading ? "Generating Code..." : "Send Reset Code"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {forgotDispatchedInfo && (
                      <div className="p-3 bg-secondary-fixed/20 border border-secondary-fixed/30 rounded-xl text-on-surface text-body-sm flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                            verified
                          </span>
                          <div>
                            <p className="font-semibold text-label-sm">
                              {forgotDispatchedInfo.deliveryNote}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              Code expires in 10 minutes.
                            </p>
                          </div>
                        </div>

                        {forgotDispatchedInfo.whatsappDeepLink && (
                          <a
                            href={forgotDispatchedInfo.whatsappDeepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-10 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-label-md text-label-md shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            <span>Open WhatsApp Reset Code</span>
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant"
                        htmlFor="reset-code"
                      >
                        6-Digit Reset Code
                      </label>
                      <input
                        id="reset-code"
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        placeholder="······"
                        className="w-full h-12 text-center tracking-[0.4em] font-mono text-xl font-bold rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/[^\d]/g, ""))}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant"
                        htmlFor="new-password"
                      >
                        New Password (min 8 characters)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="new-password"
                          className="w-full h-12 pl-4 pr-12 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                          placeholder="Enter new strong password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          type={forgotShowPassword ? "text" : "password"}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 p-1.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                          onClick={() => setForgotShowPassword((prev) => !prev)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {forgotShowPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant"
                        htmlFor="confirm-password"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-password"
                        className="w-full h-12 px-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                        placeholder="Re-enter new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        type={forgotShowPassword ? "text" : "password"}
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleResetPasswordWithOtp()}
                      disabled={isLoading}
                      className="w-full h-[52px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                      <span>
                        {isLoading ? "Saving New Password..." : "Update Password & Continue"}
                      </span>
                    </button>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                      <button
                        type="button"
                        onClick={() => void handleRequestForgotOtp()}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotStep("REQUEST")}
                        className="text-on-surface-variant hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STANDARD LOGIN CARD */
              <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-lg">
                <form className="flex flex-col gap-space-md" onSubmit={(e) => void handleSubmit(e)}>
                  <div className="grid grid-cols-2 p-1 bg-surface-container rounded-lg">
                    <button
                      className={`h-10 rounded-md font-label-md text-label-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        loginMethod === "otp"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant"
                      }`}
                      id="tab-otp"
                      onClick={() => {
                        setLoginMethod("otp");
                        setErrorMessage(null);
                      }}
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
                      onClick={() => {
                        setLoginMethod("password");
                        setErrorMessage(null);
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span>Password</span>
                    </button>
                  </div>

                  {/* Phone input row */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="font-label-md text-label-md text-on-surface-variant"
                      htmlFor="phone-input"
                    >
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-[52px] px-3 bg-surface-container-low rounded-xl flex items-center gap-1.5 shrink-0 text-on-surface">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                          flag
                        </span>
                        <span className="font-body-md text-body-md font-medium">+234</span>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                          expand_more
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          className="w-full h-[52px] px-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner"
                          id="phone-input"
                          placeholder="0803 000 0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          type="tel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditional Method Rows */}
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
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-on-surface-variant">Need to recover access?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setForgotStep("REQUEST");
                            setForgotPhone(phone);
                            setErrorMessage(null);
                          }}
                          className="text-primary font-medium hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  ) : otpStep === "REQUEST" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface-variant">
                          Instant Verification Channel
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOtpChannel("WHATSAPP")}
                            className={`h-11 rounded-xl text-body-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                              otpChannel === "WHATSAPP"
                                ? "bg-[#25D366]/15 border-[#25D366] text-[#128C7E] font-semibold"
                                : "bg-surface-container-low border-transparent text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            <span>WhatsApp (Free)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOtpChannel("SMS")}
                            className={`h-11 rounded-xl text-body-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                              otpChannel === "SMS"
                                ? "bg-primary-container border-primary text-on-primary font-semibold"
                                : "bg-surface-container-low border-transparent text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">sms</span>
                            <span>SMS Message</span>
                          </button>
                        </div>
                      </div>

                      <div
                        className="flex items-start gap-2 bg-surface-container-low rounded-lg p-space-sm text-on-surface-variant"
                        id="otp-hint"
                      >
                        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                          verified_user
                        </span>
                        <p className="font-body-sm text-body-sm">
                          Free direct code delivery with zero delay. No password memorization
                          required!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {otpDispatchedInfo && (
                        <div className="p-3 bg-secondary-fixed/20 border border-secondary-fixed/30 rounded-xl text-on-surface text-body-sm flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                              verified
                            </span>
                            <div>
                              <p className="font-semibold text-label-sm">
                                {otpDispatchedInfo.deliveryNote}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                Code expires in 10 minutes.
                              </p>
                            </div>
                          </div>

                          {otpDispatchedInfo.whatsappDeepLink && (
                            <a
                              href={otpDispatchedInfo.whatsappDeepLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full h-11 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-label-md text-label-md shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                              <span>Open WhatsApp Code (Free)</span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="font-label-md text-label-md text-on-surface-variant"
                          htmlFor="otp-input"
                        >
                          Enter 6-Digit Instant Code
                        </label>
                        <input
                          id="otp-input"
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="······"
                          className="w-full h-14 text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ""))}
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                        <button
                          type="button"
                          onClick={() => void handleRequestInstantOtp()}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpStep("REQUEST")}
                          className="text-on-surface-variant hover:underline cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="w-full h-[52px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
                    disabled={isLoading}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {loginMethod === "otp" && otpStep === "REQUEST" ? "send" : "login"}
                    </span>
                    <span id="sign-in-label">
                      {isLoading
                        ? "Processing..."
                        : loginMethod === "otp"
                          ? otpStep === "REQUEST"
                            ? "Send Instant Code"
                            : "Verify & Sign In"
                          : "Sign In"}
                    </span>
                  </button>
                </form>
              </div>
            )}

            <div className="lg:hidden w-full rounded-xl bg-secondary-fixed/30 p-space-md flex items-center justify-between shadow-sm mb-space-xl">
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

            <div className="lg:hidden flex flex-col items-center justify-center text-center gap-1.5 p-space-md rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="font-label-md text-label-md font-semibold">
                  RCCG JESUS HOUSE, OGBOMOSHO
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Connecting the body of Christ in worship, fellowship, and truth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
