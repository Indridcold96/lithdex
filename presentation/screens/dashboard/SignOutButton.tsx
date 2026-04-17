"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/presentation/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loggingOut}
      onClick={handleLogout}
    >
      {loggingOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
