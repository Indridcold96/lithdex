import type { PasswordHasher } from "@/domain/auth/PasswordHasher";
import type { User } from "@/domain/entities/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { InvalidCredentialsError } from "../errors";

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
}

export function makeLoginUser(deps: LoginUserDeps) {
  return async function loginUser(input: LoginUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    const user = await deps.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsError("Invalid email or password.");
    }

    const ok = await deps.passwordHasher.verify(
      input.password,
      user.passwordHash
    );
    if (!ok) {
      throw new InvalidCredentialsError("Invalid email or password.");
    }

    return user;
  };
}

export type LoginUser = ReturnType<typeof makeLoginUser>;
