"use client";

import { useState } from "react";
import type { GalleryItem } from "@/lib/gallery-types";
import { ArtworkCard } from "@/components/ArtworkCard";

export function CategoryFilter({ artworks }: { artworks: GalleryItem[] }) {
  const categories = [...new Set(artworks.map((artwork) => artwork.category?.trim()).filter(
    (category): category is string => Boolean(category),
  ))].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
  const [selected, setSelected] = useState("all");
  const filtered = selected === "all"
    ? artworks
    : artworks.filter((artwork) => artwork.category?.trim() === selected);

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center" role="group" aria-label="Filter artworks by category">
        {["all", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            className={`btn btn-outline-dark category-filter${selected === category ? " active" : ""}`}
            aria-pressed={selected === category}
            onClick={() => setSelected(category)}
          >
            {category === "all" ? "All artwork" : category}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="bg-light border rounded-3 p-4 text-secondary">
          {artworks.length === 0
            ? "There are no artworks in the collection yet."
            : "No artworks are available in this category yet."}
        </p>
      ) : (
        <div className="row g-4" id="galleryGrid">
          {filtered.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} />)}
        </div>
      )}
    </>
  );
}
