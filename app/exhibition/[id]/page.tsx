import { notFound } from "next/navigation";
import Image from "next/image";
import { readManifest, sampleExhibitions, withImageUrl } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function ExhibitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exhibitions = await readManifest("exhibitions");
  const exhibition = exhibitions.find((item) => item.id === id)
    ?? sampleExhibitions.find((item) => item.id === id);
  if (!exhibition) notFound();
  const item = withImageUrl(exhibition);
  return (
    <main className="container py-5">
      <article className="row g-4 g-lg-5 align-items-start">
        <div className="col-lg-5"><Image className="detail-image rounded-3" src={item.imageUrl ?? item.filename} alt={item.title} width={1200} height={1200} unoptimized /></div>
        <div className="col-lg-7">
          <div className="detail-panel rounded-3 p-4 p-md-5">
            <div className="section-label mb-2">Current exhibition</div>
            <h1 className="display-5 mb-3">{item.title}</h1>
            {item.dateLabel && <p className="fs-5 text-secondary mb-2">{item.dateLabel}</p>}
            {item.description && <p className="text-secondary mt-4 mb-0">{item.description}</p>}
          </div>
        </div>
      </article>
    </main>
  );
}
