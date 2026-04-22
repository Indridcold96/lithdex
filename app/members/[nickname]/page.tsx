import { MemberProfileScreen } from "@/presentation/screens/members/MemberProfileScreen";

interface MemberProfilePageProps {
  params: Promise<{ nickname: string }>;
}

export default async function MemberProfilePage({
  params,
}: MemberProfilePageProps) {
  const { nickname } = await params;
  return <MemberProfileScreen nickname={nickname} />;
}
