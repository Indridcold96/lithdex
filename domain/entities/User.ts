export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
