import Link from "next/link";
import Image from "next/image";
import { formatAuctionDate } from "@/lib/auction-date";
import type { GalleryItem } from "@/lib/gallery-types";

export function AuctionCard({ auction, linked = true }: { auction: GalleryItem; linked?: boolean }) {
  const date = formatAuctionDate(auction.auctionDate);
  const image = <Image className="auction-image" src={auction.imageUrl ?? auction.filename} alt={auction.title} width={900} height={850} unoptimized />;
  const href = `/auctions/${encodeURIComponent(auction.id)}`;
  return (
    <article className="col-6 col-lg-3">
      <div className="auction-card">
        {linked ? <Link className="auction-image-wrap" href={href}>{image}</Link> : <div className="auction-image-wrap">{image}</div>}
        <h3 className="auction-title">
          {linked ? <Link href={href}>{auction.title}</Link> : auction.title}
        </h3>
        {auction.artist && <p className="auction-artist">{auction.artist}</p>}
        {(date || auction.estimate) && (
          <p className="auction-meta">
            {date && <time dateTime={auction.auctionDate}>{date}</time>}
            {date && auction.estimate && <span aria-hidden="true"> · </span>}
            {auction.estimate && <span>Est. {auction.estimate}</span>}
          </p>
        )}
      </div>
    </article>
  );
}
