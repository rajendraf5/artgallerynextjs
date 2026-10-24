import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { readManifest, sampleArtworks, withImageUrl } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artworks, archives] = await Promise.all([readManifest("artworks"), readManifest("archives")]);
  const isArchived = archives.some((item) => item.id === id);
  const item = [...artworks, ...archives].find((artwork) => artwork.id === id)
    ?? sampleArtworks.find((artwork) => artwork.id === id);
  if (!item) notFound();
  const artwork = withImageUrl(item);
  return (
    <main className="container py-5">
      <Link className="btn btn-outline-dark mb-4" href={isArchived ? "/archive" : "/#collection"}>
        {isArchived ? "← Back to archive" : "← Back to latest collection"}
      </Link>
      <article className="row g-4 g-lg-5 align-items-start">
        <div className="col-lg-5"><Image className="detail-image rounded-3" src={artwork.imageUrl ?? artwork.filename} alt={artwork.title} width={1200} height={1200} unoptimized /></div>
        <div className="col-lg-7">
          <div className="detail-panel rounded-3 p-4 p-md-5">
            <div className="section-label mb-2">{isArchived ? "Artwork archive" : "Latest collection"}</div>
            <h1 className="display-5 mb-3">{artwork.title}</h1>
            {artwork.artist && <p className="fs-5 text-secondary mb-2">{artwork.artist}</p>}
            {artwork.category && <span className="badge text-bg-light">{artwork.category}</span>}
            {artwork.description && <p className="text-secondary mt-4 mb-0">{artwork.description}</p>}
          </div>
        </div>
      </article>
    </main>
  );
}
