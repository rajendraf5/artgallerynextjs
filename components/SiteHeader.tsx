"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { label: "Home", href: "/#gallerySlider", active: (path: string) => path === "/" },
  { label: "About", href: "/about", active: (path: string) => path === "/about" },
  { label: "Collection", href: "/#collection", active: (path: string) => path.startsWith("/artwork/") },
  { label: "Exhibition", href: "/#exhibitions", active: (path: string) => path.startsWith("/exhibition/") },
  { label: "Archive", href: "/archive", active: (path: string) => path === "/archive" },
  { label: "Contact", href: "/contact", active: (path: string) => path === "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);
  return (
    <header className="site-header sticky-top">
      <nav className="navbar navbar-expand-lg" aria-label="Main navigation">
        <div className="container">
          <Link className="navbar-brand" href="/">Art Gallery</Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav mx-auto">
              {links.map((link) => {
                const hashActive = pathname === "/" && (
                  (link.label === "Collection" && hash === "#collection")
                  || (link.label === "Exhibition" && hash === "#exhibitions")
                );
                const active = hashActive || (pathname === "/" && hash && ["Home", "Collection", "Exhibition"].includes(link.label)
                  ? false
                  : link.active(pathname));
                return (
                  <li className="nav-item" key={link.label}>
                    <Link
                      className={`nav-link${active ? " active" : ""}`}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/gallery"
              className={`btn btn-dark nav-action-btn${pathname === "/gallery" ? " active" : ""}`}
              aria-current={pathname === "/gallery" ? "page" : undefined}
            >
              Visit Gallery
            </Link>
            <Link href="/admin" className="btn btn-outline-dark ms-lg-2 nav-admin-btn">Admin</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
