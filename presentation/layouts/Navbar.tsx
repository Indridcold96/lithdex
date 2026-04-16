import Link from "next/link";
import { Gem } from "lucide-react";

import { Button } from "@/presentation/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyses", label: "Analyses" },
  { href: "/minerals", label: "Minerals" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        </nav>
      </div>
    </header>
  );
}
