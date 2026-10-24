import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { dataDirectory } from "@/lib/gallery";

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

export async function storedPasswordHash(): Promise<string | null> {
  try {
    const value = JSON.parse(await readFile(path.join(dataDirectory, "admin-password.json"), "utf8")) as {
      passwordHash?: unknown;
    };
    if (typeof value.passwordHash !== "string") {
      throw new Error("Admin password configuration is invalid. Check backend/data/admin-password.json.");
    }
    return value.passwordHash;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function isPasswordConfigured(): Promise<boolean> {
  return Boolean(process.env.ART_GALLERY_ADMIN_PASSWORD) || (await storedPasswordHash()) !== null;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const configuredPassword = process.env.ART_GALLERY_ADMIN_PASSWORD;
  if (configuredPassword) {
    const supplied = Buffer.from(password);
    const expected = Buffer.from(configuredPassword);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  }
  const hash = await storedPasswordHash();
  return hash !== null && bcrypt.compare(password, hash);
}

export async function savePassword(password: string): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const hash = await bcrypt.hash(password, 12);
  const target = path.join(dataDirectory, "admin-password.json");
  const temporary = `${target}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ passwordHash: hash }, null, 2)}\n`, { flag: "wx" });
  await rename(temporary, target);
}
