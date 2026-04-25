"use client";

import { Search, X } from "lucide-react";

import { usePublicAnalysesSearch } from "@/presentation/hooks/usePublicAnalysesSearch";
import { Button } from "@/presentation/ui/button";
import { Input } from "@/presentation/ui/input";

interface PublicAnalysesSearchProps {
  initialQuery: string;
}

export function PublicAnalysesSearch({
  initialQuery,
}: PublicAnalysesSearchProps) {
  const { query, setQuery, showClear, handleSubmit, handleClear } =
    usePublicAnalysesSearch({ initialQuery });

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, author, or tag"
          className="pl-8"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          <Search aria-hidden />
          Search
        </Button>
        {showClear ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleClear}
          >
            <X aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}
