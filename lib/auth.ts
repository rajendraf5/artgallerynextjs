import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ADMIN_CREDENTIALS_ENDPOINT, api } from "@/lib/api";

export const sessionCookieName = "art-gallery-session";
const sessionDurationSeconds = 60 * 60 * 8;
const sessionSecret = process.env.ART_GALLERY_SESSION_SECRET
  || (process.env.NODE_ENV === "production" ? "" : "development-only-change-this-session-secret");

export type AdminSession = { csrfToken: string };

export function isSessionSecretConfigured(): boolean {
  return Boolean(sessionSecret);
}

function sign(value: string): string {
  if (!sessionSecret) throw new Error("ART_GALLERY_SESSION_SECRET must be configured in production.");
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

export function createAdminSession(): { token: string; session: AdminSession; maxAge: number } {
  const csrfToken = randomBytes(32).toString("hex");
  const payload = Buffer.from(JSON.stringify({
    expiresAt: Date.now() + sessionDurationSeconds * 1000,
    csrfToken,
  })).toString("base64url");
  return {
    token: `${payload}.${sign(payload)}`,
    session: { csrfToken },
    maxAge: sessionDurationSeconds,
  };
}

export function readAdminSession(token?: string): AdminSession | null {
  if (!token || !sessionSecret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: number;
      csrfToken?: string;
    };
    if (typeof data.expiresAt !== "number" || data.expiresAt < Date.now()
      || typeof data.csrfToken !== "string") return null;
    return { csrfToken: data.csrfToken };
  } catch {
    return null;
  }
}

export async function isPasswordConfigured(): Promise<boolean> {
  if (process.env.ART_GALLERY_ADMIN_PASSWORD) return true;
  const status = await api.get<{ configured: boolean }>(ADMIN_CREDENTIALS_ENDPOINT);
  return status.configured;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const configuredPassword = process.env.ART_GALLERY_ADMIN_PASSWORD;
  if (configuredPassword) {
    const supplied = Buffer.from(password);
    const expected = Buffer.from(configuredPassword);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  }
  const result = await api.post<{ valid: boolean }>(`${ADMIN_CREDENTIALS_ENDPOINT}/verify`, { password });
  return result.valid;
}

// The backend hashes the password; it responds 409 if one is already set.
export async function savePassword(password: string): Promise<void> {
  await api.post(ADMIN_CREDENTIALS_ENDPOINT, { password });
}
