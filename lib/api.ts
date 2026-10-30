import type { ManifestName } from "@/lib/gallery-types";

// Base URL of the FastAPI backend, e.g. http://127.0.0.1:8000/api (set in .env).
export const ART_GALLERY = process.env.BACKEND_API_URL;

// FastAPI route prefix for each gallery collection.
export const ART_GALLERY_ENDPOINTS: Record<ManifestName, string> = {
  banners: "/banners",
  artworks: "/artworks",
  auctions: "/auctions",
  exhibitions: "/exhibitions",
  archives: "/archives",
  team: "/team-members",
  testimonials: "/testimonials",
};

export const ADMIN_CREDENTIALS_ENDPOINT = "/admin-credentials";
export const HOME_ABOUT_ENDPOINT = "/home-about";
export const FAQS_ENDPOINT = "/faqs";
export const SITE_PAGES_ENDPOINT = "/site-pages";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// FastAPI errors are { detail: string } or, for validation errors, { detail: [{ msg }] }.
function errorMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") return detail[0].msg;
  return fallback;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!ART_GALLERY) throw new Error("BACKEND_API_URL must be configured in .env.");

  const response = await fetch(`${ART_GALLERY.replace(/\/+$/, "")}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(errorMessage(body, `Backend request failed (${response.status}).`), response.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string, body?: unknown) => apiRequest<void>(path, {
    method: "DELETE",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }),
};
