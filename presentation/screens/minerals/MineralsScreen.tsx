import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

export function MineralsScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Minerals"
        description="Browse the mineral and gemstone catalogue supported by Lithdex."
      />

      <Card>
        <CardHeader>
          <CardTitle>Catalogue coming soon</CardTitle>
          <CardDescription>
            The mineral reference database is not populated yet. Entries will
            appear here with their key identifying properties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No minerals available.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
