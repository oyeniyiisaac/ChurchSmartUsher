"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const ME_HEADER_QUERY = gql`
  query MeHeader {
    me {
      id
      fullName
      role
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation LogoutHeader {
    logout
  }
`;

interface MeHeaderData {
  me: {
    id: string;
    fullName: string;
    role: "MEMBER" | "USHER" | "ADMIN";
  } | null;
}

export interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title = "Home", showBack = false }: AppHeaderProps): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const { data, client } = useQuery<MeHeaderData>(ME_HEADER_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [logout, { loading: loggingOut }] = useMutation(LOGOUT_MUTATION);

  const member = data?.me ?? null;
  const initials = member?.fullName
    ? member.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "IA";

  async function handleLogout(): Promise<void> {
    await logout();
    await client.resetStore();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-margin max-w-[600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          {showBack ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : null}
          <Link href="/" className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">church</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                ChurchConnect
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                {title}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-space-xs">
          {member ? (
            <>
              <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                {member.role}
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                title={`Sign out (${member.fullName})`}
                className="h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>{loggingOut ? "..." : "Sign Out"}</span>
              </button>
              <Link
                href="/dashboard"
                className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md flex items-center justify-center shadow-sm"
                title={member.fullName}
              >
                {initials}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {pathname !== "/login" && (
                <Link
                  href="/login"
                  className="h-9 px-3 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md flex items-center justify-center"
                >
                  Sign In
                </Link>
              )}
              {pathname !== "/register" && (
                <Link
                  href="/register"
                  className="h-9 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center shadow-sm"
                >
                  Register
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
