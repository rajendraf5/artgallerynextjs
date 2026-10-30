import path from "node:path";

import { ART_GALLERY_ENDPOINTS, ApiError, HOME_ABOUT_ENDPOINT, api } from "@/lib/api";
import type { GalleryData, GalleryItem, GalleryType, HomeAbout, ManifestName } from "@/lib/gallery-types";

export type { GalleryData, GalleryItem, GalleryType, HomeAbout, ManifestName } from "@/lib/gallery-types";

const projectRoot = process.cwd();
// Images are stored by the Next.js app; the FastAPI backend stores only their filenames.
export const uploadDirectory = path.join(projectRoot, "backend", "uploads");

const manifestNames: Record<GalleryType, ManifestName> = {
  banner: "banners",
  artwork: "artworks",
  auction: "auctions",
  exhibition: "exhibitions",
  archive: "archives",
  team: "team",
  testimonial: "testimonials",
};

export const emptyGallery: GalleryData = {
  banners: [],
  artworks: [],
  auctions: [],
  exhibitions: [],
  archives: [],
  team: [],
  testimonials: [],
};

export const sampleArtworks: GalleryItem[] = [
  {
    id: "sample-colourful-dreams",
    filename: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80",
    title: "Colourful Dreams",
    artist: "Contemporary Collection",
    category: "Abstract Art",
    description: "A colourful fine art painting from our contemporary collection.",
  },
  {
    id: "sample-beyond-imagination",
    filename: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80",
    title: "Beyond Imagination",
    artist: "Modern Art Collection",
    category: "Modern Art",
    description: "A modern abstract artwork exploring colour and creative expression.",
  },
  {
    id: "sample-silent-stories",
    filename: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80",
    title: "Silent Stories",
    artist: "Fine Art Collection",
    category: "Fine Art",
    description: "A painting from our fine art collection, on display in the gallery.",
  },
  {
    id: "sample-creative-spaces",
    filename: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80",
    title: "Creative Spaces",
    artist: "Gallery Selection",
    category: "Exhibition",
    description: "An artwork selected from the gallery collection.",
  },
];

export const sampleExhibitions: GalleryItem[] = [
  {
    id: "sample-beyond-the-canvas",
    title: "Beyond the Canvas",
    filename: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=80",
    dateLabel: "October — November 2026",
    description: "An exploration of colour, emotion, and modern expression.",
  },
  {
    id: "sample-colours-of-life",
    title: "Colours of Life",
    filename: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80",
    dateLabel: "November — December 2026",
    description: "A celebration of the beauty found in everyday moments.",
  },
  {
    id: "sample-emerging-voices",
    title: "Emerging Voices",
    filename: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80",
    dateLabel: "December 2026",
    description: "Meet a new generation of artists and their ideas.",
  },
];

// Shown in "Upcoming Auctions" until auctions are added from the admin dashboard; they have no date.
export const sampleAuctions: GalleryItem[] = sampleArtworks.map((artwork) => ({
  ...artwork,
  id: artwork.id.replace("sample-", "sample-auction-"),
}));

export function imageUrl(filename: string): string {
  if (/^https:\/\//i.test(filename)) return filename;
  return `/media/${encodeURIComponent(path.basename(filename))}`;
}

export function withImageUrl(item: GalleryItem): GalleryItem {
  return { ...item, imageUrl: imageUrl(item.filename) };
}

function itemPath(name: ManifestName, id: string): string {
  return `${ART_GALLERY_ENDPOINTS[name]}/${encodeURIComponent(id)}`;
}

export async function readManifest(name: ManifestName): Promise<GalleryItem[]> {
  return api.get<GalleryItem[]>(`${ART_GALLERY_ENDPOINTS[name]}?limit=500`);
}

// Auctions dated today or later, soonest first.
export async function readUpcomingAuctions(limit = 500): Promise<GalleryItem[]> {
  return api.get<GalleryItem[]>(`${ART_GALLERY_ENDPOINTS.auctions}?upcoming=true&limit=${limit}`);
}

export async function getItem(name: ManifestName, id: string): Promise<GalleryItem | null> {
  try {
    return await api.get<GalleryItem>(itemPath(name, id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createItem(name: ManifestName, data: Partial<GalleryItem>): Promise<GalleryItem> {
  return api.post<GalleryItem>(ART_GALLERY_ENDPOINTS[name], data);
}

export async function updateItem(name: ManifestName, id: string, data: Partial<GalleryItem>): Promise<GalleryItem> {
  return api.put<GalleryItem>(itemPath(name, id), data);
}

export async function deleteItem(name: ManifestName, id: string): Promise<void> {
  await api.delete(itemPath(name, id));
}

export async function readHomeAbout(): Promise<HomeAbout | null> {
  try {
    const section = await api.get<HomeAbout>(HOME_ABOUT_ENDPOINT);
    return { ...section, imageUrl: imageUrl(section.filename) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function saveHomeAbout(data: Partial<HomeAbout>): Promise<HomeAbout> {
  const section = await api.put<HomeAbout>(HOME_ABOUT_ENDPOINT, data);
  return { ...section, imageUrl: imageUrl(section.filename) };
}

export async function deleteHomeAbout(): Promise<void> {
  await api.delete(HOME_ABOUT_ENDPOINT);
}

export async function readGallery(): Promise<GalleryData> {
  const [banners, artworks, auctions, exhibitions, archives, team, testimonials] = await Promise.all([
    readManifest("banners"),
    readManifest("artworks"),
    readManifest("auctions"),
    readManifest("exhibitions"),
    readManifest("archives"),
    readManifest("team"),
    readManifest("testimonials"),
  ]);
  return {
    banners: banners.map(withImageUrl),
    artworks: artworks.map(withImageUrl),
    auctions: auctions.map(withImageUrl),
    exhibitions: exhibitions.map(withImageUrl),
    archives: archives.map(withImageUrl),
    team: team.map(withImageUrl),
    testimonials: testimonials.map(withImageUrl),
  };
}

export function manifestForType(type: GalleryType): ManifestName {
  return manifestNames[type];
}

export function isGalleryType(value: string): value is GalleryType {
  return Object.hasOwn(manifestNames, value);
}
