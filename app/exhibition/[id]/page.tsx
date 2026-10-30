import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkGallery } from "@/components/ArtworkGallery";
import { readManifest, sampleExhibitions, withImageUrl } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ExhibitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exhibitions = await readManifest("exhibitions");
  // The thumbnail slider shows the saved exhibitions, or the samples until the first one is added.
  const collection = exhibitions.some((item) => item.id === id) ? exhibitions : sampleExhibitions;
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) notFound();
  return (
    <main className="container py-5">
      <Link className="btn btn-outline-dark mb-4" href="/#exhibitions">← Back to current exhibitions</Link>
      <ArtworkGallery
        artworks={collection.map(withImageUrl)}
        initialIndex={index}
        label="Current exhibition"
        basePath="/exhibition"
      />
    </main>
  );
}
