import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import {
  createAdminSession,
  isSessionSecretConfigured,
  isPasswordConfigured,
  readAdminSession,
  savePassword,
  sessionCookieName,
  verifyPassword,
} from "@/lib/auth";
import { isValidAuctionDate } from "@/lib/auction-date";
import { createFaq, deleteFaq, readFaqs, updateFaq } from "@/lib/faq";
import { isValidTestimonialDateTime } from "@/lib/testimonial-date";
import { isFaqCategory } from "@/lib/faq-categories";
import { isSitePageSlug } from "@/lib/site-page-defaults";
import { deleteSitePage, readSitePages, saveSitePage } from "@/lib/site-pages";
import {
  createItem,
  deleteHomeAbout,
  deleteItem,
  getItem,
  isGalleryType,
  manifestForType,
  readGallery,
  readHomeAbout,
  saveHomeAbout,
  updateItem,
  uploadDirectory,
  withImageUrl,
  type GalleryItem,
  type GalleryType,
} from "@/lib/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxImageSize = 8 * 1024 * 1024;
// bcrypt, used by the backend, only accepts passwords up to 72 bytes.
const maxPasswordBytes = 72;
const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

// Pass the backend's own 4xx messages through; anything else means the backend is down or failing.
function backendError(error: unknown, message: string): NextResponse {
  if (error instanceof ApiError && error.status < 500) return jsonError(error.message, error.status);
  console.error(message, error);
  return jsonError(`${message} Check that the backend API is running.`, 502);
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

async function saveImage(
  value: FormDataEntryValue | null,
  required: boolean
): Promise<string | null> {
  if (!(value instanceof File) || value.size === 0) {
    if (required) {
      throw new InputError("Choose an image to upload.");
    }
    return null;
  }

  if (value.size > maxImageSize) {
    throw new InputError("Images must be 8 MB or smaller.");
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  const extension = extensionForImage(buffer);

  if (
    !extension ||
    !(value.type in allowedTypes) ||
    allowedTypes[value.type as keyof typeof allowedTypes] !== extension
  ) {
    throw new InputError("Use a valid JPG, PNG, or WebP image.");
  }

  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomBytes(16).toString("hex")}.${extension}`;
  await writeFile(path.join(uploadDirectory, filename), buffer, { flag: "wx" });
  return filename;
}

async function removeImage(filename: string): Promise<void> {
  if (/^https?:\/\//i.test(filename)) return;
  await unlink(path.join(uploadDirectory, path.basename(filename))).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") console.error("Could not remove gallery image.", error);
  });
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/.test(value);
}

async function listPublic(): Promise<NextResponse> {
  try {
    const gallery = await readGallery();
    return NextResponse.json(gallery, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return backendError(error, "The gallery data could not be read.");
  }
}

async function getHomeAbout(): Promise<NextResponse> {
  try {
    return NextResponse.json({ about: await readHomeAbout() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return backendError(error, "The home about section could not be read.");
  }
}

async function listFaqs(): Promise<NextResponse> {
  try {
    return NextResponse.json({ faqs: await readFaqs() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return backendError(error, "The F.A.Q could not be read.");
  }
}

async function listSitePages(): Promise<NextResponse> {
  try {
    return NextResponse.json({ pages: await readSitePages() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return backendError(error, "The pages could not be read.");
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action === "public") return listPublic();
  if (action === "home-about") return getHomeAbout();
  if (action === "faqs") return listFaqs();
  if (action === "site-pages") return listSitePages();
  if (action !== "session") return jsonError("Unknown action or unsupported request method.", 404);

  try {
    return NextResponse.json({
      authenticated: authenticated(request),
      configured: await isPasswordConfigured(),
      csrfToken: sessionFor(request)?.csrfToken ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return backendError(error, "The admin password configuration could not be read.");
  }
}

async function createInitialPassword(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Initial password setup is disabled in production. Configure ART_GALLERY_ADMIN_PASSWORD or set the password through the backend.", 403);
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
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password) > maxPasswordBytes) {
    return jsonError(`Choose a password between 12 and ${maxPasswordBytes} characters long.`, 400);
  }

  try {
    await savePassword(password);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return jsonError("The admin password has already been set. Sign in instead.", 409);
    }
    return backendError(error, "Could not save the admin password.");
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
    if (error instanceof ApiError && error.status === 422) return jsonError("The password is incorrect.", 401);
    return backendError(error, "The admin password could not be verified.");
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
    if (!["banner", "artwork", "auction", "exhibition", "team", "testimonial"].includes(type) || (update && !validId(id))) {
      return jsonError(update ? "The selected gallery item is invalid." : "Choose a banner, artwork, auction, exhibition, team member, or testimonial upload.", 400);
    }

    const title = textField(form, "title", 100, true);
    const description = textField(form, "description", 500, type === "testimonial");
    const fields: Partial<GalleryItem> = { title, description };
    if (type === "artwork") {
      fields.artist = textField(form, "artist", 100);
      fields.category = textField(form, "category", 60);
    }
    if (type === "auction") {
      fields.artist = textField(form, "artist", 100);
      fields.estimate = textField(form, "estimate", 100);
      fields.auctionDate = textField(form, "auctionDate", 10, true);
      if (!isValidAuctionDate(fields.auctionDate)) throw new InputError("Choose a valid auction date.");
    }
    if (type === "exhibition") fields.dateLabel = textField(form, "dateLabel", 100);
    if (type === "team") fields.designation = textField(form, "designation", 100, true);
    if (type === "testimonial") {
      fields.authorName = textField(form, "authorName", 100, true);
      fields.designation = textField(form, "designation", 100);
      const givenAt = textField(form, "givenAt", 16, true);
      if (!isValidTestimonialDateTime(givenAt)) throw new InputError("Choose a valid date and time.");
      // Sent without a time zone so the backend stores the time exactly as entered.
      fields.givenAt = `${givenAt}:00`;
    }

    const manifestName = manifestForType(type as GalleryType);
    const existing = update ? await getItem(manifestName, id) : null;
    if (update && !existing) return jsonError("That gallery item no longer exists.", 404);

    filename = await saveImage(form.get("image"), !update);
    if (filename) fields.filename = filename;

    if (!update) {
      const item = await createItem(manifestName, fields);
      return NextResponse.json({ item: withImageUrl(item) }, { status: 201 });
    }

    await updateItem(manifestName, id, fields);
    if (filename && existing) await removeImage(existing.filename);
    return NextResponse.json({ updated: true });
  } catch (error) {
    if (filename) await removeImage(filename);
    if (error instanceof InputError) return jsonError(error.message, 400);
    if (error instanceof ApiError && error.status === 404) return jsonError("That gallery item no longer exists.", 404);
    return backendError(error, "Could not save gallery content.");
  }
}

async function moveArtwork(request: NextRequest, action: "archive" | "restore"): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  const body = await readJson(request);
  if (!validId(body?.id)) return jsonError("The selected artwork is invalid.", 400);
  const source = action === "archive" ? "artworks" : "archives";
  const destination = action === "archive" ? "archives" : "artworks";
  try {
    const item = await getItem(source, body.id);
    if (!item) return jsonError("That artwork no longer exists.", 404);
    const fields: Partial<GalleryItem> = {
      filename: item.filename,
      title: item.title,
      description: item.description ?? "",
      artist: item.artist ?? "",
      category: item.category ?? "",
    };
    // Archives keep the artwork's original date; the backend sets archivedAt.
    if (action === "archive") fields.createdAt = item.createdAt;
    const moved = await createItem(destination, fields);
    try {
      await deleteItem(source, body.id);
    } catch (error) {
      await deleteItem(destination, moved.id).catch((rollbackError) => {
        console.error("Could not undo a failed artwork move.", rollbackError);
      });
      throw error;
    }
    return NextResponse.json({ moved: true });
  } catch (error) {
    return backendError(error, "Could not move the artwork.");
  }
}

async function removeItem(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  const body = await readJson(request);
  if (typeof body?.type !== "string" || !isGalleryType(body.type) || !validId(body.id)) {
    return jsonError("The selected gallery item is invalid.", 400);
  }
  const manifestName = manifestForType(body.type);
  try {
    const item = await getItem(manifestName, body.id);
    if (!item) return jsonError("That gallery item no longer exists.", 404);
    await deleteItem(manifestName, body.id);
    await removeImage(item.filename);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return backendError(error, "The gallery item could not be removed.");
  }
}

async function saveHomeAboutSection(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);

  let filename: string | null = null;
  try {
    const form = await request.formData();
    const buttonLink = textField(form, "buttonLink", 255);
    if (buttonLink && !/^(\/(?!\/)|#|https?:\/\/)/i.test(buttonLink)) {
      throw new InputError("The button link must start with /, # or https://.");
    }
    const fields = {
      label: textField(form, "label", 60),
      title: textField(form, "title", 100, true),
      description: textField(form, "description", 1000),
      buttonText: textField(form, "buttonText", 60),
      buttonLink,
    };

    const existing = await readHomeAbout();
    filename = await saveImage(form.get("image"), !existing);
    const about = await saveHomeAbout({ ...fields, ...(filename ? { filename } : {}) });
    if (filename && existing) await removeImage(existing.filename);
    return NextResponse.json({ about });
  } catch (error) {
    if (filename) await removeImage(filename);
    if (error instanceof InputError) return jsonError(error.message, 400);
    return backendError(error, "Could not save the home about section.");
  }
}

async function resetHomeAbout(request: NextRequest): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  try {
    const existing = await readHomeAbout();
    if (!existing) return NextResponse.json({ about: null });
    await deleteHomeAbout();
    await removeImage(existing.filename);
    return NextResponse.json({ about: null });
  } catch (error) {
    return backendError(error, "Could not reset the home about section.");
  }
}

function faqText(body: Record<string, unknown> | null, name: "question" | "answer", maximum: number): string {
  const value = typeof body?.[name] === "string" ? body[name].trim() : "";
  if (!value) throw new InputError(`Please provide ${name === "question" ? "a question" : "an answer"}.`);
  if (Array.from(value).length > maximum) {
    throw new InputError(`The ${name} must be ${maximum} characters or fewer.`);
  }
  return value;
}

function faqSortOrder(body: Record<string, unknown> | null): number {
  const value = body?.sortOrder === undefined || body.sortOrder === "" ? 0 : Number(body.sortOrder);
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    throw new InputError("The display order must be a whole number between 0 and 10000.");
  }
  return value;
}

async function saveFaq(request: NextRequest, action: "create" | "update" | "delete"): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  const body = await readJson(request);
  if (action !== "create" && !validId(body?.id)) return jsonError("The selected question is invalid.", 400);
  const id = body?.id as string;

  try {
    if (action === "delete") {
      if (!await deleteFaq(id)) return jsonError("That question no longer exists.", 404);
      return NextResponse.json({ deleted: true });
    }
    const category = body?.category;
    if (!isFaqCategory(category)) throw new InputError("Choose a tab for this question.");
    const fields = {
      question: faqText(body, "question", 200),
      answer: faqText(body, "answer", 2000),
      category,
      sortOrder: faqSortOrder(body),
    };
    if (action === "create") return NextResponse.json({ faq: await createFaq(fields) }, { status: 201 });
    const faq = await updateFaq(id, fields);
    if (!faq) return jsonError("That question no longer exists.", 404);
    return NextResponse.json({ faq });
  } catch (error) {
    if (error instanceof InputError) return jsonError(error.message, 400);
    return backendError(error, "Could not save the F.A.Q.");
  }
}

function sitePageText(body: Record<string, unknown> | null, name: "title" | "intro" | "content", maximum: number, required: boolean): string {
  const value = typeof body?.[name] === "string" ? body[name].trim() : "";
  if (required && !value) throw new InputError(`Please provide the page ${name}.`);
  if (Array.from(value).length > maximum) throw new InputError(`The page ${name} must be ${maximum} characters or fewer.`);
  return value;
}

async function saveSitePageContent(request: NextRequest, reset: boolean): Promise<NextResponse> {
  if (!authenticated(request)) return jsonError("Please sign in to continue.", 401);
  if (!hasCsrf(request)) return jsonError("Your session has expired. Sign in and try again.", 403);
  const body = await readJson(request);
  const slug = body?.slug;
  if (!isSitePageSlug(slug)) return jsonError("The selected page is invalid.", 400);

  try {
    if (reset) {
      await deleteSitePage(slug);
      return NextResponse.json({ page: null });
    }
    const page = await saveSitePage(slug, {
      title: sitePageText(body, "title", 100, true),
      intro: sitePageText(body, "intro", 300, false),
      content: sitePageText(body, "content", 20000, true),
    });
    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof InputError) return jsonError(error.message, 400);
    return backendError(error, "Could not save the page.");
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
  if (action === "delete") return removeItem(request);
  if (action === "home-about") return saveHomeAboutSection(request);
  if (action === "home-about-reset") return resetHomeAbout(request);
  if (action === "faq-create") return saveFaq(request, "create");
  if (action === "faq-update") return saveFaq(request, "update");
  if (action === "faq-delete") return saveFaq(request, "delete");
  if (action === "site-page") return saveSitePageContent(request, false);
  if (action === "site-page-reset") return saveSitePageContent(request, true);
  return jsonError("Unknown action or unsupported request method.", 404);
}
