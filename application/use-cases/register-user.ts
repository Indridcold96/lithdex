import type { PasswordHasher } from "@/domain/auth/PasswordHasher";
import type { User } from "@/domain/entities/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { DuplicateError, ValidationError } from "../errors";
import { normalizeAndValidateUsername } from "../username";

export interface RegisterUserInput {
  email: string;
  username: string;
  password: string;
}

export interface RegisterUserDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
}

const MIN_PASSWORD_LENGTH = 8;

export function makeRegisterUser(deps: RegisterUserDeps) {
  return async function registerUser(
    input: RegisterUserInput
  ): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const username = normalizeAndValidateUsername(input.username);

    if (email.length === 0) {
      throw new ValidationError("Email is required.");
    }
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
    }

    const [emailTaken, usernameTaken] = await Promise.all([
      deps.userRepository.findByEmail(email),
      deps.userRepository.findByUsername(username),
    ]);

    if (emailTaken) {
      throw new DuplicateError("An account with this email already exists.");
    }
    if (usernameTaken) {
      throw new DuplicateError("This username is already taken.");
    }

    const passwordHash = await deps.passwordHasher.hash(input.password);

    return deps.userRepository.create({
      email,
      username,
      passwordHash,
    });
  };
}

export type RegisterUser = ReturnType<typeof makeRegisterUser>;
