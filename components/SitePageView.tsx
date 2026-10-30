import type { ReactNode } from "react";
import Link from "next/link";
import type { SitePageSlug } from "@/lib/gallery-types";
import { sitePages } from "@/lib/site-page-defaults";
import { readSitePage } from "@/lib/site-pages";

// Turns the plain-text content into headings, lists and paragraphs; it is never treated as HTML.
function renderContent(content: string): ReactNode[] {
  return content.split(/\n\s*\n/).flatMap((block, blockIndex) => {
    const nodes: ReactNode[] = [];
    let list: string[] = [];
    let paragraph: string[] = [];
    const flush = () => {
      if (list.length) nodes.push(<ul key={`${blockIndex}-${nodes.length}`}>{list.map((item, index) => <li key={index}>{item}</li>)}</ul>);
      if (paragraph.length) nodes.push(<p key={`${blockIndex}-${nodes.length}`}>{paragraph.join(" ")}</p>);
      list = [];
      paragraph = [];
    };
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("## ")) {
        flush();
        nodes.push(<h2 key={`${blockIndex}-${nodes.length}`}>{line.slice(3)}</h2>);
      } else if (line.startsWith("- ")) {
        if (paragraph.length) flush();
        list.push(line.slice(2));
      } else {
        if (list.length) flush();
        paragraph.push(line);
      }
    }
    flush();
    return nodes;
  });
}

export async function SitePageView({ slug }: { slug: SitePageSlug }) {
  const definition = sitePages.find((page) => page.slug === slug)!;
  const page = (await readSitePage(slug)) ?? definition.defaults;
  const updated = page.updatedAt ?? page.createdAt;
  return (
    <main>
      <section className="contact-hero">
        <div className="container">
          <div className="contact-label mb-2">Help &amp; information</div>
          <h1 className="contact-title mb-3">{page.title}</h1>
          {page.intro && <p className="contact-intro mb-0">{page.intro}</p>}
        </div>
      </section>
      <section className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            {updated && (
              <p className="site-page-updated">
                Last updated <time dateTime={updated}>{new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time>
              </p>
            )}
            <div className="site-page-content">{renderContent(page.content)}</div>
            {/* <div className="faq-more mt-5">
              <h2 className="h4 mb-1">Need more help?</h2>
              <p className="mb-3">Read the answers to common questions, or send us a message.</p>
              <div className="d-flex flex-wrap gap-2">
                <Link href="/faq" className="btn-gallery">Visit the F.A.Q →</Link>
                <Link href="/contact" className="btn btn-outline-dark">Contact us</Link>
              </div>
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
