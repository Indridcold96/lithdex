import Link from "next/link";
import { Gem } from "lucide-react";

import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { Button } from "@/presentation/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyses", label: "Analyses" },
  { href: "/minerals", label: "Minerals" },
] as const;

export async function Navbar() {
  const userId = await getServerSessionUserId();
  const isAuthenticated = userId !== null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Gem className="size-5 text-primary" aria-hidden />
          <span className="text-base">Lithdex</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={link.href}>{link.label}</Link>}
            />
          ))}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/settings/profile">Profile</Link>}
            />
          ) : null}
          {!isAuthenticated ? (
            <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/login">Sign in</Link>}
              />
              <Button
                variant="default"
                size="sm"
                nativeButton={false}
                render={<Link href="/register">Sign up</Link>}
              />
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
