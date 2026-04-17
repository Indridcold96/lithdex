import type { SessionPayload } from "./SessionPayload";

export interface SessionTokenService {
  sign(payload: SessionPayload): Promise<string>;
  verify(token: string): Promise<SessionPayload | null>;
}
