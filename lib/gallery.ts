import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { GalleryData, GalleryItem, GalleryType, ManifestName } from "@/lib/gallery-types";

export type { GalleryData, GalleryItem, GalleryType, ManifestName } from "@/lib/gallery-types";

const projectRoot = process.cwd();
export const dataDirectory = path.join(projectRoot, "backend", "data");
export const uploadDirectory = path.join(projectRoot, "backend", "uploads");

const manifestNames: Record<GalleryType, ManifestName> = {
  banner: "banners",
  artwork: "artworks",
  exhibition: "exhibitions",
  archive: "archives",
  team: "team",
};

export const emptyGallery: GalleryData = {
  banners: [],
  artworks: [],
  exhibitions: [],
  archives: [],
  team: [],
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

export function imageUrl(filename: string): string {
  if (/^https:\/\//i.test(filename)) return filename;
  return `/media/${encodeURIComponent(path.basename(filename))}`;
}

export function withImageUrl(item: GalleryItem): GalleryItem {
  return { ...item, imageUrl: imageUrl(item.filename) };
}

export async function readManifest(name: ManifestName): Promise<GalleryItem[]> {
  const filePath = path.join(dataDirectory, `${name}.json`);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error(`Gallery records in ${name}.json are invalid.`);
  return data.filter((record): record is GalleryItem => (
    typeof record === "object" && record !== null
    && typeof (record as GalleryItem).id === "string"
    && typeof (record as GalleryItem).filename === "string"
    && typeof (record as GalleryItem).title === "string"
  ));
}

export async function readGallery(): Promise<GalleryData> {
  const [banners, artworks, exhibitions, archives, team] = await Promise.all([
    readManifest("banners"),
    readManifest("artworks"),
    readManifest("exhibitions"),
    readManifest("archives"),
    readManifest("team"),
  ]);
  return {
    banners: banners.map(withImageUrl),
    artworks: artworks.map(withImageUrl),
    exhibitions: exhibitions.map(withImageUrl),
    archives: archives.map(withImageUrl),
    team: team.map(withImageUrl),
  };
}

let manifestQueue = Promise.resolve();

export async function updateManifest(
  name: ManifestName,
  update: (items: GalleryItem[]) => GalleryItem[],
): Promise<GalleryItem[]> {
  const operation = manifestQueue.then(async () => {
    await mkdir(dataDirectory, { recursive: true });
    const items = update(await readManifest(name));
    const target = path.join(dataDirectory, `${name}.json`);
    const temporary = `${target}.${randomBytes(8).toString("hex")}.tmp`;
    await writeFile(temporary, `${JSON.stringify(items, null, 2)}\n`, { flag: "wx" });
    await rename(temporary, target);
    return items;
  });
  manifestQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export function manifestForType(type: GalleryType): ManifestName {
  return manifestNames[type];
}

export function isGalleryType(value: string): value is GalleryType {
  return Object.hasOwn(manifestNames, value);
}
