import { Plus } from "lucide-react";

import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

export function AnalysesScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Analyses"
        description="Review past identification attempts and their results."
        actions={
          <Button size="sm" disabled>
            <Plus aria-hidden />
            New analysis
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>No analyses yet</CardTitle>
          <CardDescription>
            When you start identifying specimens, each analysis will be listed
            here with its observable properties and candidate matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Your analysis history is empty.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
