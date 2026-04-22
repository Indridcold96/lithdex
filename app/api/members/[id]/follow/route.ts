import { NextResponse, type NextRequest } from "next/server";

import { makeFollowUser } from "@/application/use-cases/follow-user";
import { makeUnfollowUser } from "@/application/use-cases/unfollow-user";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserFollowRepository } from "@/infrastructure/database/repositories/PrismaUserFollowRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: targetUserId } = await ctx.params;
    const actorUserId = await requireSessionUserId(request);

    const followUser = makeFollowUser({
      userRepository: new PrismaUserRepository(prisma),
      userFollowRepository: new PrismaUserFollowRepository(prisma),
    });

    const profile = await followUser({ actorUserId, targetUserId });
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: targetUserId } = await ctx.params;
    const actorUserId = await requireSessionUserId(request);

    const unfollowUser = makeUnfollowUser({
      userRepository: new PrismaUserRepository(prisma),
      userFollowRepository: new PrismaUserFollowRepository(prisma),
    });

    const profile = await unfollowUser({ actorUserId, targetUserId });
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
