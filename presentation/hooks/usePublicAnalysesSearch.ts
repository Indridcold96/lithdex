"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UsePublicAnalysesSearchInput {
  initialQuery: string;
}

export function usePublicAnalysesSearch({
  initialQuery,
}: UsePublicAnalysesSearchInput) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      router.push("/analyses");
      return;
    }

    const params = new URLSearchParams({ q: trimmed });
    router.push(`/analyses?${params}`);
  }

  function handleClear() {
    setQuery("");
    router.push("/analyses");
  }

  return {
    query,
    setQuery,
    showClear: initialQuery.trim().length > 0 || query.trim().length > 0,
    handleSubmit,
    handleClear,
  };
}
