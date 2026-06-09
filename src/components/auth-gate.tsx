"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setChecked(true);
      if (!user) {
        router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !checked) {
    return (
      <main className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  return <>{children}</>;
}
