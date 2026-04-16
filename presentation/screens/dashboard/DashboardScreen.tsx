import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

const STATS = [
  { label: "Analyses", value: "0" },
  { label: "Minerals tracked", value: "0" },
  { label: "Pending reviews", value: "0" },
] as const;

export function DashboardScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Dashboard"
        description="An overview of your recent activity on Lithdex."
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
