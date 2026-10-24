import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { readManifest, withImageUrl } from "@/lib/gallery";

export const metadata: Metadata = { title: "Artwork Archive | Art Gallery" };
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const artworks = (await readManifest("archives")).map(withImageUrl);
  return (
    <main className="container py-5">
      <div className="section-label mb-2">From our collection</div>
      <h1 className="display-5 mb-2">Artwork Archive</h1>
      <p className="text-secondary mb-4">Explore artworks previously featured in our latest collection.</p>
      {artworks.length === 0 ? (
        <div className="bg-white border rounded-3 p-4 text-secondary">There are no archived artworks yet.</div>
      ) : (
        <div className="row g-4">
          {artworks.map((artwork) => (
            <article className="col-sm-6 col-lg-3" key={artwork.id}>
              <Link className="archive-card-link" href={`/artwork/${encodeURIComponent(artwork.id)}`}>
                <div className="archive-card">
                  <Image src={artwork.imageUrl ?? artwork.filename} alt={artwork.title} width={700} height={500} unoptimized />
                  <div className="archive-card-body">
                    <h2 className="h4">{artwork.title}</h2>
                    {artwork.artist && <p className="text-secondary mb-1">{artwork.artist}</p>}
                    {artwork.category && <span className="badge text-bg-light">{artwork.category}</span>}
                    {artwork.description && <p className="text-secondary mt-3 mb-0">{artwork.description}</p>}
                    <span className="archive-card-action">View artwork →</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
