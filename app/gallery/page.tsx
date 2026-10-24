import type { Metadata } from "next";
import { CategoryFilter } from "@/components/CategoryFilter";
import { readManifest, sampleArtworks, withImageUrl } from "@/lib/gallery";

export const metadata: Metadata = { title: "Visit Gallery | Art Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const current = await readManifest("artworks");
  const artworks = (current.length ? current : sampleArtworks).map(withImageUrl);
  return (
    <main>
      <section className="section-padding">
        <div className="container">
          <div className="section-label text-center">Explore the collection</div>
          <div className="d-flex flex-wrap text-center justify-content-center align-items-end gap-3 mb-4">
            <div>
              <h1 className="section-title mb-2">Visit Gallery</h1>
              <p className="section-description mb-0">Browse every artwork in our collection by category.</p>
            </div>
          </div>
          <CategoryFilter artworks={artworks} />
        </div>
      </section>
    </main>
  );
}
