import { redirect } from "next/navigation";

import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { makeGetCurrentUser } from "@/application/use-cases/get-current-user";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";

import { ProfileSettingsForm } from "./ProfileSettingsForm";

async function loadCurrentUser() {
  const userId = await getServerSessionUserId();
  if (!userId) {
    return null;
  }

  const userRepository = new PrismaUserRepository(prisma);
  const getCurrentUser = makeGetCurrentUser({ userRepository });

  try {
    const user = await getCurrentUser(userId);
    return toAuthenticatedUserDto(user);
  } catch {
    return null;
  }
}

export async function ProfileSettingsScreen() {
  const user = await loadCurrentUser();
  if (!user) {
    redirect("/login?next=/settings/profile");
  }

  return <ProfileSettingsForm initialUser={user} />;
}
