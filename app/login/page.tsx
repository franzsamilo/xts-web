"use client";

import { LoginForm } from "@/components/auth/AuthForms";
import { PageShell } from "@/components/layout/PageShell";

export default function LoginPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
        <LoginForm />
      </div>
    </PageShell>
  );
}
