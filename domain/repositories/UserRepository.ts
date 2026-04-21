import type { User } from "../entities/User";

export interface CreateUserData {
  email: string;
  nickname: string;
  passwordHash: string;
}

export interface UpdateUserProfileData {
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByNickname(nickname: string): Promise<User | null>;
  listByIds(ids: string[]): Promise<User[]>;
  updateProfile(id: string, data: UpdateUserProfileData): Promise<User>;
}
