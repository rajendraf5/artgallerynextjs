import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-5">
            <h2 className="h4">Art Gallery</h2>
            <p>A welcoming place to discover art, explore new perspectives, and meet creative minds.</p>
          </div>
          <div className="col-6 col-md-3">
            <h3 className="h5">Explore</h3>
            <p><Link href="/about">About us</Link></p>
            <p><Link href="/gallery">Collection</Link></p>
            <p><Link href="/archive">Artwork archive</Link></p>
          </div>
          <div className="col-6 col-md-4">
            <h3 className="h5">Visit</h3>
            <p><Link href="/contact">Contact &amp; opening hours</Link></p>
            <p><a href="mailto:hello@artgallery.com">hello@artgallery.com</a></p>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Art Gallery. All rights reserved.</div>
      </div>
    </footer>
  );
}
