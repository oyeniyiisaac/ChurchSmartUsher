import { Suspense, type ReactNode } from "react";

import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage(): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="p-space-lg text-center text-on-surface-variant">
          Loading Registration...
        </div>
      }
    >
      <AuthForm mode="register" />
    </Suspense>
  );
}
