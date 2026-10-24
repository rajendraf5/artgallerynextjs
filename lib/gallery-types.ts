export type GalleryType = "banner" | "artwork" | "exhibition" | "archive" | "team";
export type ManifestName = "banners" | "artworks" | "exhibitions" | "archives" | "team";

export type GalleryItem = {
  id: string;
  filename: string;
  imageUrl?: string;
  title: string;
  description?: string;
  artist?: string;
  category?: string;
  dateLabel?: string;
  designation?: string;
  createdAt?: string;
  archivedAt?: string | null;
};

export type GalleryData = Record<ManifestName, GalleryItem[]>;
