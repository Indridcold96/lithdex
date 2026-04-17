"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

interface MeResponse {
  id: string;
  email: string;
  nickname: string;
  role: string;
}

const STATS = [
  { label: "Analyses", value: "0" },
  { label: "Minerals tracked", value: "0" },
  { label: "Pending reviews", value: "0" },
] as const;

export function DashboardScreen() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) router.replace("/login");
          return;
        }
        const data = (await res.json()) as MeResponse;
        if (!cancelled) {
          setMe(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Dashboard"
        description={
          loading
            ? "Loading your account..."
            : me
              ? `Welcome back, ${me.nickname}.`
              : "An overview of your recent activity on Lithdex."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Once you start analysing specimens, your history will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No activity yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
