import { AnalysesScreen } from "@/presentation/screens/analyses/AnalysesScreen";

interface AnalysesPageProps {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}

export default async function AnalysesPage({ searchParams }: AnalysesPageProps) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  return <AnalysesScreen searchQuery={q} />;
}
