import { AnalysisDetailScreen } from "@/presentation/screens/analyses/AnalysisDetailScreen";

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisDetailPage({
  params,
}: AnalysisDetailPageProps) {
  const { id } = await params;
  return <AnalysisDetailScreen id={id} />;
}
