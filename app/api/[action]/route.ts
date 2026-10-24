import { randomBytes } from "node:crypto";
import { mkdir, open, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  isSessionSecretConfigured,
  isPasswordConfigured,
  readAdminSession,
  savePassword,
  sessionCookieName,
  verifyPassword,
} from "@/lib/auth";
import {
  dataDirectory,
  isGalleryType,
  manifestForType,
  readGallery,
  updateManifest,
  uploadDirectory,
  withImageUrl,
  type GalleryItem,
  type GalleryType,
} from "@/lib/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxImageSize = 8 * 1024 * 1024;
const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function isLocalRequest(request: NextRequest): boolean {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "";
  const host = request.headers.get("host")?.split(":")[0];
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address)
    || host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function sessionFor(request: NextRequest) {
  return readAdminSession(request.cookies.get(sessionCookieName)?.value);
}

function authenticated(request: NextRequest): boolean {
  return sessionFor(request) !== null;
}

function hasCsrf(request: NextRequest): boolean {
  const session = sessionFor(request);
  return Boolean(session && request.headers.get("x-csrf-token") === session.csrfToken);
}

function withSessionCookie(response: NextResponse, token: string, maxAge: number): NextResponse {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return response;
}

async function readJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function textField(form: FormData, name: string, maximum: number, required = false): string {
  const value = form.get(name);
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new InputError(`Please provide ${name}.`);
  if (Array.from(result).length > maximum) {
    throw new InputError(`${name[0].toUpperCase()}${name.slice(1)} must be ${maximum} characters or fewer.`);
  }
  return result;
}

class InputError extends Error {}

function extensionForImage(buffer: Buffer): (typeof allowedTypes)[keyof typeof allowedTypes] | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function saveImage(value: FormDataEntryValue | null, required: boolean): Promise<string | null> {
  if (!(value instanceof File) || value.size === 0) {
    if (required) throw new InputError("Choose an image to upload.");
    return null;
  }
  if (value.size > maxImageSize) throw new InputError("Images must be 8 MB or smaller.");
  const buffer = Buffer.from(await value.arrayBuffer());
  const extension = extensionForImage(buffer);
  if (!extension || !(value.type in allowedTypes) || allowedTypes[value.type as keyof typeof allowedTypes] !== extension) {
    throw new InputError("Use a valid JPG, PNG, or WebP image.");
  }
  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomBytes(16).toString("hex")}.${extension}`;
  await writeFile(path.join(uploadDirectory, filename), buffer, { flag: "wx" });
  return filename;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/.test(value);
}

async function listPublic(): Promise<NextResponse> {
  try {
    const gallery = await readGallery();
    return NextResponse.json(gallery, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not read gallery manifests.", error);
    return jsonError("The gallery data could not be read.", 500);
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action === "public") return listPublic();
  if (action !== "session") return jsonError("Unknown action or unsupported request method.", 404);

  try {
    return NextResponse.json({
      authenticated: authenticated(request),
      configured: await isPasswordConfigured(),
      csrfToken: sessionFor(request)?.csrfToken ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not read admin authentication configuration.", error);
    return jsonError("The admin password configuration could not be read.", 500);
  }
}

async function createInitialPassword(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Initial password setup is disabled in production. Configure ART_GALLERY_ADMIN_PASSWORD or use an existing password hash.", 403);
  }
  if (!isSessionSecretConfigured()) {
    return jsonError("ART_GALLERY_SESSION_SECRET must be configured before admin sign-in.", 500);
  }
  if (process.env.ART_GALLERY_ADMIN_PASSWORD) {
    return jsonError("An admin password is already configured. Sign in instead.", 409);
  }
  if (!isLocalRequest(request)) {
    return jsonError("Initial password setup is only available on this computer. Open the admin page using localhost.", 403);
  }
  const body = await readJson(request);
  const password = body?.password;
  if (typeof password !== "string" || password.length < 12 || password.length > 1024) {
    return jsonError("Choose a password between 12 and 1024 characters long.", 400);
  }

  await mkdir(dataDirectory, { recursive: true });
  const lockPath = path.join(dataDirectory, "admin-setup.claim");
  let lock;
  try {
    lock = await open(lockPath, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return jsonError("The admin password has already been set. Sign in instead.", 409);
    }
    console.error("Could not lock initial admin setup.", error);
    return jsonError("Could not lock the admin setup. Check backend/data folder permissions.", 500);
  }

  try {
    if (await isPasswordConfigured()) return jsonError("The admin password has already been set. Sign in instead.", 409);
    await savePassword(password);
  } catch (error) {
    console.error("Could not save the initial admin password.", error);
    return jsonError("Could not save the admin password. Check backend/data folder permissions.", 500);
  } finally {
    await lock.close();
    await unlink(lockPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") console.error("Could not remove the admin setup lock.", error);
    });
  }

  const created = createAdminSession();
  return withSessionCookie(
    NextResponse.json({ authenticated: true, csrfToken: created.session.csrfToken }, { status: 201 }),
    created.token,
    created.maxAge,
  );
}

async function login(request: NextRequest): Promise<NextResponse> {
  if (!isSessionSecretConfigured()) {
    return jsonError("ART_GALLERY_SESSION_SECRET must be configured before admin sign-in.", 500);
  }
  const body = await readJson(request);
  if (typeof body?.password !== "string") return jsonError("The password is incorrect.", 401);
  try {
    if (!await verifyPassword(body.password)) return jsonError("The password is incorrect.", 401);
  } catch (error) {
    console.error("Could not verify admin password.", error);
    return jsonError("The admin password configuration could not be read.", 500);
  }
  const created = createAdminSession();
  return withSessionCookie(
    NextResponse.json({ authenticated: true, csrfToken: created.session.csrfToken }),
    created.token,
    created.maxAge,
  );
}

async function upload(request: NextRequest, update: boolean): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);

  let filename: string | null = null;
  try {
    const form = await request.formData();
    const typeValue = form.get("type");
    const type = typeof typeValue === "string" ? typeValue : "";
    const idValue = form.get("id");
    const id = typeof idValue === "string" ? idValue : "";
    if (!["banner", "artwork", "exhibition", "team"].includes(type) || (update && !validId(id))) {
      return jsonError(update ? "The selected gallery item is invalid." : "Choose a banner, artwork, exhibition, or team member upload.", 400);
    }

    const title = textField(form, "title", 100, true);
    const description = textField(form, "description", 500);
    const artist = type === "artwork" ? textField(form, "artist", 100) : "";
    const category = type === "artwork" ? textField(form, "category", 60) : "";
    const dateLabel = type === "exhibition" ? textField(form, "dateLabel", 100) : "";
    const designation = type === "team" ? textField(form, "designation", 100, true) : "";
    filename = await saveImage(form.get("image"), !update);

    let resultItem: GalleryItem | undefined;
    let oldFilename: string | undefined;
    let found = !update;
    const manifestName = manifestForType(type as GalleryType);
    await updateManifest(manifestName, (items) => {
      if (!update) {
        const item: GalleryItem = {
          id: randomBytes(12).toString("hex"),
          filename: filename!,
          title,
          description,
          createdAt: new Date().toISOString(),
        };
        if (type === "artwork") Object.assign(item, { artist, category });
        if (type === "exhibition") item.dateLabel = dateLabel;
        if (type === "team") item.designation = designation;
        resultItem = item;
        return [item, ...items];
      }
      return items.map((item) => {
        if (item.id !== id) return item;
        found = true;
        oldFilename = filename ? path.basename(item.filename) : undefined;
        const replacement = {
          ...item,
          title,
          description,
          updatedAt: new Date().toISOString(),
          ...(filename ? { filename } : {}),
          ...(type === "artwork" ? { artist, category } : {}),
          ...(type === "exhibition" ? { dateLabel } : {}),
          ...(type === "team" ? { designation } : {}),
        };
        resultItem = replacement;
        return replacement;
      });
    });

    if (!found) {
      if (filename) await unlink(path.join(uploadDirectory, filename)).catch(() => undefined);
      return jsonError("That gallery item no longer exists.", 404);
    }
    if (update && !resultItem) return jsonError("That gallery item no longer exists.", 404);
    if (update) {
      if (oldFilename) {
        try {
          await unlink(path.join(uploadDirectory, oldFilename));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.error("Could not remove the replaced gallery image.", error);
            return jsonError("The item was updated, but its previous image could not be deleted.", 500);
          }
        }
      }
      return NextResponse.json({ updated: true });
    }
    return NextResponse.json({ item: withImageUrl(resultItem!) }, { status: 201 });
  } catch (error) {
    if (filename) await unlink(path.join(uploadDirectory, filename)).catch(() => undefined);
    if (error instanceof InputError) return jsonError(error.message, 400);
    console.error("Could not save gallery content.", error);
    return jsonError("Could not save gallery content. Check the backend data and uploads folders.", 500);
  }
}

async function moveArtwork(request: NextRequest, action: "archive" | "restore"): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  const body = await readJson(request);
  if (!validId(body?.id)) return jsonError("The selected artwork is invalid.", 400);
  const source = action === "archive" ? "artworks" : "archives";
  const destination = action === "archive" ? "archives" : "artworks";
  let moved: GalleryItem | undefined;
  let original: GalleryItem | undefined;
  try {
    await updateManifest(source, (items) => {
      moved = items.find((item) => item.id === body.id);
      return items.filter((item) => item.id !== body.id);
    });
    if (!moved) return jsonError("That artwork no longer exists.", 404);
    original = moved;
    moved = { ...original, archivedAt: action === "archive" ? new Date().toISOString() : null };
    await updateManifest(destination, (items) => [moved!, ...items]);
    return NextResponse.json({ moved: true });
  } catch (error) {
    if (original) {
      await updateManifest(source, (items) => [original!, ...items]).catch((rollbackError) => {
        console.error("Could not restore artwork after a failed archive operation.", rollbackError);
      });
    }
    console.error("Could not move artwork.", error);
    return jsonError("Could not move the artwork. Check the backend data folder.", 500);
  }
}

async function deleteItem(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  const body = await readJson(request);
  if (typeof body?.type !== "string" || !isGalleryType(body.type) || !validId(body.id)) {
    return jsonError("The selected gallery item is invalid.", 400);
  }
  let filename: string | undefined;
  try {
    await updateManifest(manifestForType(body.type), (items) => {
      filename = items.find((item) => item.id === body.id)?.filename;
      return items.filter((item) => item.id !== body.id);
    });
    if (!filename) return jsonError("That gallery item no longer exists.", 404);
    await unlink(path.join(uploadDirectory, path.basename(filename))).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Could not remove gallery content.", error);
    return jsonError("The gallery item could not be removed.", 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action === "setup") return createInitialPassword(request);
  if (action === "login") return login(request);
  if (action === "logout") {
    if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
    if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(sessionCookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
  if (action === "upload") return upload(request, false);
  if (action === "update") return upload(request, true);
  if (action === "archive" || action === "restore") return moveArtwork(request, action);
  if (action === "delete") return deleteItem(request);
  return jsonError("Unknown action or unsupported request method.", 404);
}
