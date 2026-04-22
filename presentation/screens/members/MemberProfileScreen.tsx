import { notFound } from "next/navigation";

import type { PublicMemberProfileDto } from "@/application/dto/PublicMemberProfileDto";
import { NotFoundError } from "@/application/errors";
import { makeGetPublicUserProfileByNickname } from "@/application/use-cases/get-public-user-profile-by-nickname";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserFollowRepository } from "@/infrastructure/database/repositories/PrismaUserFollowRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";

import { MemberProfileClient } from "./MemberProfileClient";

interface MemberProfileScreenProps {
  nickname: string;
}

async function loadProfile(
  nickname: string,
  viewerUserId: string | null
): Promise<PublicMemberProfileDto | null> {
  const getPublicUserProfileByNickname = makeGetPublicUserProfileByNickname({
    userRepository: new PrismaUserRepository(prisma),
    userFollowRepository: new PrismaUserFollowRepository(prisma),
  });

  try {
    return await getPublicUserProfileByNickname({
      nickname,
      viewerUserId,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
}

export async function MemberProfileScreen({
  nickname,
}: MemberProfileScreenProps) {
  const viewerUserId = await getServerSessionUserId();
  const profile = await loadProfile(nickname, viewerUserId);

  if (!profile) {
    notFound();
  }

  return <MemberProfileClient initialProfile={profile} />;
}
