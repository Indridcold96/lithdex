export interface User {
  id: string;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
