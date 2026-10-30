import type { Metadata } from "next";
import { AuctionCard } from "@/components/AuctionCard";
import { readManifest, sampleAuctions, withImageUrl } from "@/lib/gallery";

export const metadata: Metadata = { title: "Auctions | Art Gallery" };
export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const all = await readManifest("auctions");
  const today = new Date().toISOString().slice(0, 10);
  // Dates are YYYY-MM-DD, so they compare correctly as strings.
  const upcoming = (all.length ? all.filter((auction) => (auction.auctionDate ?? "") >= today) : sampleAuctions).map(withImageUrl);
  const past = all.filter((auction) => (auction.auctionDate ?? "") < today).reverse().map(withImageUrl);
  return (
    <main>
      <section className="contact-hero">
        <div className="container">
          <div className="contact-label mb-2">Curated with passion</div>
          <h1 className="contact-title mb-3">Auctions</h1>
          <p className="contact-intro mb-0">Discover the artworks coming up for auction, and browse our past sales.</p>
        </div>
      </section>
      <section className="section-padding" aria-labelledby="upcoming-heading">
        <div className="container">
          <h2 className="section-title mb-4" id="upcoming-heading">Upcoming Auctions</h2>
          {upcoming.length > 0 ? (
            <div className="row g-4">
              {upcoming.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}
            </div>
          ) : (
            <p className="bg-light border rounded-3 p-4 text-secondary">There are no upcoming auctions right now. Please check back soon.</p>
          )}
        </div>
      </section>
      {past.length > 0 && (
        <section className="section-padding pt-0" aria-labelledby="past-heading">
          <div className="container">
            <h2 className="section-title mb-4" id="past-heading">Past Auctions</h2>
            <div className="row g-4">
              {past.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
