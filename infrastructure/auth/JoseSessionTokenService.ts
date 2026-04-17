import { jwtVerify, SignJWT } from "jose";

import type { SessionPayload } from "@/domain/auth/SessionPayload";
import type { SessionTokenService } from "@/domain/auth/SessionTokenService";

import { authSecretKey, SESSION_MAX_AGE_SECONDS } from "./env";

const ALG = "HS256";

export class JoseSessionTokenService implements SessionTokenService {
  async sign(payload: SessionPayload): Promise<string> {
    return new SignJWT({ role: payload.role })
      .setProtectedHeader({ alg: ALG })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
      .sign(authSecretKey);
  }

  async verify(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, authSecretKey, {
        algorithms: [ALG],
      });

      if (typeof payload.sub !== "string") {
        return null;
      }
      const role = typeof payload.role === "string" ? payload.role : "user";
      return { sub: payload.sub, role };
    } catch {
      return null;
    }
  }
}
