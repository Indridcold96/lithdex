import { notFound } from "next/navigation";

import type { PublicMemberProfileDto } from "@/application/dto/PublicMemberProfileDto";
import { NotFoundError } from "@/application/errors";
import { makeGetPublicUserProfileByUsername } from "@/application/use-cases/get-public-user-profile-by-username";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserFollowRepository } from "@/infrastructure/database/repositories/PrismaUserFollowRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";

import { MemberProfileClient } from "./MemberProfileClient";

interface MemberProfileScreenProps {
  username: string;
}

async function loadProfile(
  username: string,
  viewerUserId: string | null
): Promise<PublicMemberProfileDto | null> {
  const getPublicUserProfileByUsername = makeGetPublicUserProfileByUsername({
    userRepository: new PrismaUserRepository(prisma),
    userFollowRepository: new PrismaUserFollowRepository(prisma),
  });

  try {
    return await getPublicUserProfileByUsername({
      username,
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
  username,
}: MemberProfileScreenProps) {
  const viewerUserId = await getServerSessionUserId();
  const profile = await loadProfile(username, viewerUserId);

  if (!profile) {
    notFound();
  }

  return <MemberProfileClient initialProfile={profile} />;
}
