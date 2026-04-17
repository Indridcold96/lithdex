import bcrypt from "bcryptjs";

import type { PasswordHasher } from "@/domain/auth/PasswordHasher";

const DEFAULT_COST = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: number = DEFAULT_COST) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cost);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
