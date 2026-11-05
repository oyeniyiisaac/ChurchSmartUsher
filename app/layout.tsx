import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "ChurchConnect — Attendance & Profiles",
  description: "Modern church attendance and member consistency tracking",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="app-shell">
            <AppHeader />
            <div className="page-content">{children}</div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
