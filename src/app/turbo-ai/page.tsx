"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TurboAIPage() {
  const router = useRouter();

  useEffect(() => {
    const params = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/ai${params}`);
  }, [router]);

  return null;
}
