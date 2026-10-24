import Link from "next/link";
import Image from "next/image";
import { ArtworkCard } from "@/components/ArtworkCard";
import { readGallery, sampleArtworks, sampleExhibitions, withImageUrl } from "@/lib/gallery";

export const dynamic = "force-dynamic";

const defaultBanners = [
  {
    id: "default-banner-1",
    title: "Discover Art That Moves You.",
    description: "Explore a world of creativity, culture and expression. Discover beautiful artworks from talented artists.",
    imageUrl: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=2000&q=85",
    label: "Welcome to our art gallery",
    primary: "Explore Collection",
    target: "#collection",
    secondary: "Plan Your Visit",
    secondaryTarget: "#visit",
  },
  {
    id: "default-banner-2",
    title: "Every Artwork Tells a Story.",
    description: "Experience the beauty of paintings, contemporary art and extraordinary creative perspectives.",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=2000&q=85",
    label: "Art • Passion • Imagination",
    primary: "View Artworks",
    target: "#collection",
    secondary: "Meet Our Team",
    secondaryTarget: "#artists",
  },
  {
    id: "default-banner-3",
    title: "Feel The Art. Live The Moment.",
    description: "Visit our exhibitions and discover inspiring collections that bring creativity to life.",
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=2000&q=85",
    label: "A world of creative inspiration",
    primary: "Explore Exhibitions",
    target: "#exhibitions",
    secondary: "Contact Us",
    secondaryTarget: "/contact",
  },
];

export default async function HomePage() {
  const data = await readGallery();
  const artworks = data.artworks.length ? data.artworks : sampleArtworks.map(withImageUrl);
  const exhibitions = data.exhibitions.length ? data.exhibitions : sampleExhibitions.map(withImageUrl);
  const team = data.team;
  const banners = data.banners.length
    ? data.banners.map((banner) => ({
      ...banner,
      label: "Welcome to our art gallery",
      primary: "Explore Collection",
      target: "#collection",
      secondary: "Plan Your Visit",
      secondaryTarget: "#visit",
      imageUrl: banner.imageUrl ?? banner.filename,
    }))
    : defaultBanners;

  return (
    <main>
      <section id="gallerySlider" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="5000">
        <div className="carousel-indicators">
          {banners.map((banner, index) => (
            <button
              key={banner.id ?? banner.title}
              type="button"
              data-bs-target="#gallerySlider"
              data-bs-slide-to={index}
              className={index === 0 ? "active" : ""}
              aria-current={index === 0 ? "true" : undefined}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        <div className="carousel-inner">
          {banners.map((banner, index) => (
            <div className={`carousel-item${index === 0 ? " active" : ""}`} key={banner.id ?? banner.title}>
              <div className="banner-slide" style={{ backgroundImage: `url("${banner.imageUrl}")` }}>
                <div className="banner-overlay" />
                <div className="container banner-content">
                  <span className="banner-label">{banner.label}</span>
                  <h1>{banner.title}</h1>
                  <p>{banner.description}</p>
                  <Link href={banner.target} className="btn banner-btn">{banner.primary} <span>→</span></Link>
                  <Link href={banner.secondaryTarget} className="btn banner-outline-btn">{banner.secondary}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#gallerySlider" data-bs-slide="prev" aria-label="Previous slide">
          <span className="carousel-control-prev-icon" aria-hidden="true" />
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#gallerySlider" data-bs-slide="next" aria-label="Next slide">
          <span className="carousel-control-next-icon" aria-hidden="true" />
        </button>
      </section>

      <section className="section-padding" id="collection">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end">
            <div>
              <div className="section-label">Curated with passion</div>
              <h2 className="section-title">Our Latest Collection</h2>
            </div>
            <Link href="/gallery" className="mb-3" style={{ color: "var(--accent)" }}>View the full collection →</Link>
          </div>
          {artworks.length > 0 ? (
            <div className="row g-4">
              {artworks.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} />)}
            </div>
          ) : (
            <p className="bg-light border rounded-3 p-4 text-secondary">
              There are no artworks in the latest collection yet.
            </p>
          )}
        </div>
      </section>

      <section className="exhibition section-padding" id="about">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <Image className="exhibition-image" src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=85" alt="Art gallery exhibition space" width={1000} height={700} unoptimized />
            </div>
            <div className="col-lg-6">
              <div className="exhibition-content">
                <div className="section-label">Experience creativity</div>
                <h2>A Space Where Art Comes Alive.</h2>
                <p>We believe art has the power to connect people, express emotions, and transform perspectives. Our gallery brings together established artists and exciting new talent from different creative worlds.</p>
                <p>Explore carefully selected collections, attend special exhibitions, and discover the stories behind every masterpiece.</p>
                <Link href="/about" className="btn btn-gallery mt-2">Discover Our Story →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" id="exhibitions">
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-label">What&apos;s happening</div>
            <h2 className="section-title">Current Exhibitions</h2>
            <p className="section-description">Discover new perspectives through our featured exhibitions.</p>
          </div>
          <div className="row g-4">
            {exhibitions.map((exhibition) => (
              <article className="col-md-4" key={exhibition.id}>
                <div className="art-image-wrap">
                  <Image className="art-image" src={exhibition.imageUrl ?? exhibition.filename} alt={exhibition.title} width={800} height={600} unoptimized />
                </div>
                <div className="art-card">
                  {exhibition.dateLabel && <div className="section-label">{exhibition.dateLabel}</div>}
                  <div className="flex-body">
                    <h3>{exhibition.title}</h3>
                    <p className="section-description">{exhibition.description}</p>
                  </div>
                  <Link className="artwork-detail-link" href={`/exhibition/${encodeURIComponent(exhibition.id)}`}>View exhibition →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="exhibition section-padding" id="artists">
        <div className="container">
          <div className="text-center mb-4">
            <div className="section-label">The creative minds</div>
            <h2 className="section-title">Meet Our Team</h2>
            <p className="section-description">Every artist brings a unique story to the canvas.</p>
          </div>
          <div className="row justify-content-center">
            {team.map((member) => (
              <article className="col-6 col-md-4 col-lg-3" key={member.id}>
                <div className="artist-card">
                  <Image className="artist-image" src={member.imageUrl ?? member.filename} alt={member.title} width={300} height={400} unoptimized />
                  <h3>{member.title}</h3>
                  <p>{member.designation}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <span id="visit" />
    </main>
  );
}
