import Link from "next/link";
import { BackToTop } from "@/components/BackToTop";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-3">
            <h2 className="h4">Art Gallery</h2>
            <p>A welcoming place to discover art, explore new perspectives, and meet creative minds.</p>
          </div>
          <div className="col-6 col-lg-2 offset-lg-1">
            <h3 className="h5">Explore</h3>
            <p><Link href="/about">About us</Link></p>
            <p><Link href="/#collection">Collection</Link></p>
            <p><Link href="/faq">F.A.Q</Link></p>
          </div>
          <div className="col-6 col-lg-3">
            <h3 className="h5">Discover</h3>
            <p><Link href="/#exhibitions">Exhibitions</Link></p>
            <p><Link href="/gallery">Visit Gallery</Link></p>
            <p><Link href="/">How to sell</Link></p>
          </div>
          <div className="col-lg-3">
            <h3 className="h5">Get in Touch</h3>
              <p>Email: hello@artgallery.com</p>
              <p>Monday – Sunday: 10 AM – 6 PM</p>
              <p>Follow us on Instagram and Facebook.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="row">
            <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-12">
                Copyright © {new Date().getFullYear()} Art Gallery. All rights reserved.
             </div>
             <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-12 d-flex justify-content-start justify-content-lg-end justify-content-md-end">
                <div className="link">
                  <ul>
                    <li><Link href="/support">Support Center</Link></li>
                    <li><Link href="/privacy-policy">Privacy &amp; Policy</Link></li>
                    <li><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></li>
                  </ul>
                </div>  
             </div>
          </div>
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
