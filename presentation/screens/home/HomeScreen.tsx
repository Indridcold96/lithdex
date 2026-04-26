import Link from "next/link";
import { ArrowRight, Gem, Sparkles, Telescope } from "lucide-react";

import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";

const FEATURES = [
  {
    icon: Telescope,
    title: "Identify with confidence",
    description:
      "Describe a specimen's key traits and get a focused shortlist of likely candidates.",
  },
  {
    icon: Sparkles,
    title: "Learn as you go",
    description:
      "Each entry links hardness, luster, cleavage and crystal system to help you recognize patterns.",
  },
  {
    icon: Gem,
    title: "Built for collectors",
    description:
      "Track analyses over time and build a traceable history of the specimens you have studied.",
  },
] as const;

export function HomeScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 sm:py-24">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <Gem className="size-3.5" aria-hidden />
          Mineral &amp; gemstone identification
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Know what you are holding.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Lithdex helps hobbyists and collectors identify minerals and
          gemstones from observable properties &mdash; so every specimen in
          your collection earns its label.
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={
              <Link href="/dashboard">
                Get started
                <ArrowRight aria-hidden />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/analyses">Browse public analyses</Link>}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" aria-hidden />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </div>
  );
}
