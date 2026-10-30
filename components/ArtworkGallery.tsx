"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatAuctionDate } from "@/lib/auction-date";
import type { GalleryItem } from "@/lib/gallery-types";

export function ArtworkGallery({
  artworks,
  initialIndex,
  label,
  basePath = "/artwork",
}: {
  artworks: GalleryItem[];
  initialIndex: number;
  label: string;
  basePath?: string;
}) {
  const [index, setIndex] = useState(initialIndex);
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([]);
  const artwork = artworks[index];
  const hasMany = artworks.length > 1;

  useEffect(() => {
    // Keep the address shareable, and the selected thumbnail in view.
    const path = `${basePath}/${encodeURIComponent(artworks[index].id)}`;
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
    thumbnails.current[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [artworks, index, basePath]);

  function show(next: number) {
    setIndex((next + artworks.length) % artworks.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMany) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); show(index - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); show(index + 1); }
  }

  return (
    <article className="row g-4 g-lg-5 align-items-start">
      <div className="col-lg-6">
        <div className="artwork-viewer" role="region" aria-roledescription="carousel" aria-label="Artwork images" tabIndex={0} onKeyDown={handleKeyDown}>
          <div className="artwork-stage">
            <Image
              key={artwork.id}
              className="artwork-stage-image"
              src={artwork.imageUrl ?? artwork.filename}
              alt={artwork.title}
              width={1200}
              height={1200}
              unoptimized
              priority
            />
            {hasMany && (
              <>
                <button className="artwork-arrow artwork-arrow-prev" type="button" aria-label="Previous artwork" onClick={() => show(index - 1)} />
                <button className="artwork-arrow artwork-arrow-next" type="button" aria-label="Next artwork" onClick={() => show(index + 1)} />
              </>
            )}
          </div>
          <p className="visually-hidden" aria-live="polite">{`${artwork.title}, ${index + 1} of ${artworks.length}`}</p>
          {hasMany && (
            <div className="artwork-thumbs" aria-label="Choose an artwork">
              {artworks.map((item, itemIndex) => (
                <button
                  key={item.id}
                  ref={(element) => { thumbnails.current[itemIndex] = element; }}
                  className="artwork-thumb"
                  type="button"
                  aria-label={item.title}
                  aria-current={itemIndex === index ? "true" : undefined}
                  onClick={() => show(itemIndex)}
                >
                  <Image src={item.imageUrl ?? item.filename} alt="" width={200} height={250} unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-6">
        <div className="detail-panel rounded-3 p-4 p-md-5">
          <div className="section-label mb-2">{label}</div>
          <h1 className="display-5 mb-3">{artwork.title}</h1>
          {artwork.artist && <p className="fs-5 text-secondary mb-2">{artwork.artist}</p>}
          {artwork.dateLabel && <p className="fs-5 text-secondary mb-2">{artwork.dateLabel}</p>}
          {artwork.category && <span className="badge text-bg-light">{artwork.category}</span>}
          {(artwork.auctionDate || artwork.estimate) && (
            <dl className="auction-facts mt-4 mb-0">
              {artwork.auctionDate && <><dt>Auction date</dt><dd><time dateTime={artwork.auctionDate}>{formatAuctionDate(artwork.auctionDate)}</time></dd></>}
              {artwork.estimate && <><dt>Estimate</dt><dd>{artwork.estimate}</dd></>}
            </dl>
          )}
          {artwork.description && <p className="text-secondary mt-4 mb-0">{artwork.description}</p>}
          {/* {hasMany && <p className="small text-secondary mt-4 mb-0">{index + 1} of {artworks.length}</p>} */}
        </div>
      </div>
    </article>
  );
}
