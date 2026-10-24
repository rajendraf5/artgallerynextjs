import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main>
      <section className="about-hero">
        <div className="container">
          <div className="about-label mb-2">Our story</div>
          <h1 className="about-title mb-3">A Space Where Art Comes Alive</h1>
          <p className="about-lead mb-0">Art Gallery is a place to encounter creativity, explore new perspectives, and connect with the stories behind the work. We bring together a changing collection of artworks, exhibitions, and artists for everyone to discover.</p>
        </div>
      </section>
      <section className="story-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <Image className="about-image" src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=85" alt="Artworks displayed in a gallery space" width={1200} height={800} unoptimized />
            </div>
            <div className="col-lg-6">
              <div className="about-label mb-2">What we believe</div>
              <h2 className="display-6 mb-3">Creativity brings us together.</h2>
              <p className="story-copy">We believe art can connect people, express emotions, and invite us to see familiar things differently. Our gallery shares work from established and emerging artists, making room for different ideas, styles, and experiences.</p>
              <p className="story-copy">Explore the latest collection, learn about current exhibitions, or meet the people who help make the gallery a welcoming place for creative discovery.</p>
              <Link className="btn btn-dark mt-2" href="/gallery">Explore the collection</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="pb-5">
        <div className="container">
          <div className="text-center mb-4">
            <div className="about-label mb-2">Our approach</div>
            <h2 className="display-6">A gallery for discovery</h2>
          </div>
          <div className="row g-3">
            {[
              ["Celebrate artists", "Share the people, creative practice, and perspectives behind the artworks."],
              ["Make space for ideas", "Present collections and exhibitions that encourage curiosity and conversation."],
              ["Welcome everyone", "Offer an inviting place to discover art, whether you are a regular visitor or just beginning."],
            ].map(([title, description]) => (
              <div className="col-md-4" key={title}>
                <article className="value-card"><h3>{title}</h3><p>{description}</p></article>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="about-cta">
        <div className="container">
          <div className="about-label">Your next inspiration awaits</div>
          <h2 className="display-6 mt-2">Come experience art.</h2>
          <p>Browse the collection, see what is on view, or plan a visit to the gallery.</p>
          <Link className="btn btn-light me-2 mb-2" href="/gallery">Visit Gallery</Link>
          <Link className="btn btn-outline-light mb-2" href="/contact">Contact &amp; Visit</Link>
        </div>
      </section>
    </main>
  );
}
