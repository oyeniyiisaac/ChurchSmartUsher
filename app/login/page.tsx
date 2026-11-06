import { Suspense, type ReactNode } from "react";

import { AuthForm } from "@/components/AuthForm";

export default function LoginPage(): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="p-space-lg text-center text-on-surface-variant">
          Loading Sanctuary Portal...
        </div>
      }
    >
      <AuthForm mode="login" />
    </Suspense>
  );
}
