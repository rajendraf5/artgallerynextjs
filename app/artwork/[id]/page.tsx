import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkGallery } from "@/components/ArtworkGallery";
import { readManifest, sampleArtworks, withImageUrl } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artworks, archives] = await Promise.all([readManifest("artworks"), readManifest("archives")]);
  const isArchived = archives.some((item) => item.id === id);
  // The thumbnail slider shows the artwork's own list: the archive, the latest collection, or the samples.
  const collection = isArchived ? archives : artworks.some((item) => item.id === id) ? artworks : sampleArtworks;
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) notFound();
  return (
    <main className="container py-5">
      <Link className="btn btn-outline-dark mb-4" href={isArchived ? "/archive" : "/#collection"}>
        {isArchived ? "← Back to archive" : "← Back to latest collection"}
      </Link>
      <ArtworkGallery
        artworks={collection.map(withImageUrl)}
        initialIndex={index}
        label={isArchived ? "Artwork archive" : "Latest collection"}
      />
    </main>
  );
}
