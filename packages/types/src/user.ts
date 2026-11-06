import type { EntityId, Timestamped } from "./common.js";

export type ThemePreference = "dark" | "light" | "system";

export interface User extends Timestamped {
  id: EntityId;
  email: string;
  name: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  themePreference: ThemePreference;
  // passwordHash and any credential material is NEVER part of this shared type
  // and must never be serialized to the frontend (§29 Authentication).
}

export interface UpdateUserSettingsInput {
  name?: string;
  timezone?: string;
  locale?: string;
  themePreference?: ThemePreference;
}

export interface AuthLoginInput {
  email: string;
  password: string;
}

export interface AuthRegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface GoogleAuthInput {
  credential?: string;
  code?: string;
  redirectUri?: string;
  name?: string;
  email?: string;
  photoUrl?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyResetTokenResult {
  valid: boolean;
  email?: string;
}

export interface AuthMessageResult {
  message: string;
}

/** Returned on successful login/register. Session token lives only in an
 * HTTP-only cookie — it is never present in this payload. */
export interface AuthSessionResult {
  user: User;
}
