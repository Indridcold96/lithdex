export interface PublicMemberProfileDto {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: Date;
  followerCount: number;
  followingCount: number;
  viewerCanFollow: boolean;
  viewerIsFollowing: boolean;
  isOwnProfile: boolean;
}
