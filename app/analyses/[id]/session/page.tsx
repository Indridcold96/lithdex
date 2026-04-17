import { AnalysisSessionScreen } from "@/presentation/screens/analyses/AnalysisSessionScreen";

interface AnalysisSessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisSessionPage({
  params,
}: AnalysisSessionPageProps) {
  const { id } = await params;
  return <AnalysisSessionScreen id={id} />;
}
