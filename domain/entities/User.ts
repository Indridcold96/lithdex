export interface User {
  id: string;
  nickname: string;
  email: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
