import { ApiError, SITE_PAGES_ENDPOINT, api } from "@/lib/api";
import type { SitePage, SitePageSlug } from "@/lib/gallery-types";
import { sitePages } from "@/lib/site-page-defaults";

export async function readSitePage(slug: SitePageSlug): Promise<SitePage | null> {
  try {
    return await api.get<SitePage>(`${SITE_PAGES_ENDPOINT}/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// Every footer page, null where it has not been saved yet.
export async function readSitePages(): Promise<Record<SitePageSlug, SitePage | null>> {
  const saved = await Promise.all(sitePages.map((page) => readSitePage(page.slug)));
  return Object.fromEntries(sitePages.map((page, index) => [page.slug, saved[index]])) as Record<SitePageSlug, SitePage | null>;
}

export async function saveSitePage(slug: SitePageSlug, data: Pick<SitePage, "title" | "intro" | "content">): Promise<SitePage> {
  return api.put<SitePage>(`${SITE_PAGES_ENDPOINT}/${slug}`, data);
}

export async function deleteSitePage(slug: SitePageSlug): Promise<void> {
  try {
    await api.delete(`${SITE_PAGES_ENDPOINT}/${slug}`);
  } catch (error) {
    // Already showing the defaults.
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
}
