import Link from "next/link";
import Image from "next/image";
import type { GalleryItem } from "@/lib/gallery-types";

export function ArtworkCard({ artwork }: { artwork: GalleryItem }) {
  const image = artwork.imageUrl ?? artwork.filename;
  const category = artwork.category?.trim();
  return (
    <article className="col-6 col-lg-3 gallery-item" data-category={category ?? ""}>
      <div className="art-card">
        <Link className="art-image-wrap d-block" href={`/artwork/${encodeURIComponent(artwork.id)}`}>
          <Image className="art-image" src={image} alt={artwork.title} width={900} height={700} unoptimized />
        </Link>
          <div className="flex-body">
            <h3>{artwork.title}</h3>
          </div>   
            {artwork.artist && <div className="art-artist">{artwork.artist}
        </div>}
        <div className="d-flex align-items-center justify-content-between gap-2">
          {category ? <span className="art-tag">{category}</span> : <span />}
          <Link className="artwork-detail-link" href={`/artwork/${encodeURIComponent(artwork.id)}`}>
            View artwork →
          </Link>
        </div>
      </div>
    </article>
  );
}
