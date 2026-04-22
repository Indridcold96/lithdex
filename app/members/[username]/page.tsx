import { MemberProfileScreen } from "@/presentation/screens/members/MemberProfileScreen";

interface MemberProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function MemberProfilePage({
  params,
}: MemberProfilePageProps) {
  const { username } = await params;
  return <MemberProfileScreen username={username} />;
}
