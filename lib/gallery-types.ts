export type GalleryType = "banner" | "artwork" | "auction" | "exhibition" | "archive" | "team" | "testimonial";
export type ManifestName = "banners" | "artworks" | "auctions" | "exhibitions" | "archives" | "team" | "testimonials";

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
  auctionDate?: string; // YYYY-MM-DD
  estimate?: string;
  authorName?: string; // testimonials: title is the heading, description the quote
  givenAt?: string; // ISO date-time
  createdAt?: string;
  archivedAt?: string | null;
};

export type GalleryData = Record<ManifestName, GalleryItem[]>;

export type FaqCategory = "bidding" | "sell" | "others";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string | null;
};

// The homepage "Experience creativity" section. Paragraphs in description are separated by blank lines.
export type HomeAbout = {
  filename: string;
  imageUrl?: string;
  label: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  createdAt?: string;
  updatedAt?: string | null;
};

export type SitePageSlug = "support" | "privacy-policy" | "terms-and-conditions";

// A footer text page. In content, paragraphs are separated by blank lines, "## " starts a heading and "- " a list item.
export type SitePage = {
  slug: SitePageSlug;
  title: string;
  intro: string;
  content: string;
  createdAt?: string;
  updatedAt?: string | null;
};
