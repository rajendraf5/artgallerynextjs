export default function ContactPage() {
  const mapEmbedUrl = "https://www.openstreetmap.org/export/embed.html?bbox=77.18%2C28.55%2C77.25%2C28.68&layer=mapnik&marker=28.6139%2C77.2090";
  const mapLinkUrl = "https://www.openstreetmap.org/?mlat=28.6139&mlon=77.2090#map=13/28.6139/77.2090";
  return (
    <main>
      <section className="contact-hero">
        <div className="container">
          <div className="contact-label mb-2">We’d love to hear from you</div>
          <h1 className="contact-title mb-3">Contact &amp; Visit</h1>
          <p className="contact-intro mb-0">Questions about an artwork or exhibition? Get in touch, or use the map below to explore our sample location.</p>
        </div>
      </section>
      <section className="container py-5" aria-label="Gallery contact details">
        <div className="row g-3">
          <div className="col-md-4"><article className="contact-card"><h2>Email</h2><p><a href="mailto:hello@artgallery.com">hello@artgallery.com</a></p></article></div>
          <div className="col-md-4"><article className="contact-card"><h2>Call</h2><p><a href="tel:+911234567890">+91 12345 67890</a></p></article></div>
          <div className="col-md-4"><article className="contact-card"><h2>Opening hours</h2><p>Monday – Sunday<br />10:00 AM – 6:00 PM</p></article></div>
        </div>
      </section>
      <section className="map-section pt-0">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
            <div>
              <div className="contact-label mb-2">Find us</div>
              <h2 className="h1 mb-1">Delhi, India</h2>
              <p className="map-caption mb-0">Sample map location only — replace with your gallery’s actual address.</p>
            </div>
            <a className="btn btn-outline-dark" href={mapLinkUrl} target="_blank" rel="noopener noreferrer">Open map</a>
          </div>
          <iframe className="map-frame" title="Sample map centered on Delhi, India" src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      </section>
    </main>
  );
}
