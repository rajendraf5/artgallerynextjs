import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkGallery } from "@/components/ArtworkGallery";
import { readManifest, sampleAuctions, withImageUrl } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saved = await readManifest("auctions");
  // The thumbnail slider shows all auctions (soonest first), or the samples until auctions are added.
  const auctions = saved.some((item) => item.id === id) ? saved : sampleAuctions;
  const index = auctions.findIndex((item) => item.id === id);
  if (index === -1) notFound();
  return (
    <main className="container py-5">
      <Link className="btn btn-outline-dark mb-4" href="/auctions">← Back to auctions</Link>
      <ArtworkGallery artworks={auctions.map(withImageUrl)} initialIndex={index} label="Auction" basePath="/auctions" />
    </main>
  );
}
