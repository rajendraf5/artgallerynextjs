import type { Metadata } from "next";
import Link from "next/link";
import { FaqTabs } from "@/components/FaqTabs";
import { defaultFaqs, readFaqs } from "@/lib/faq";

export const metadata: Metadata = { title: "F.A.Q | Art Gallery" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const saved = await readFaqs();
  const faqs = saved.length ? saved : defaultFaqs;
  return (
    <main>
      <section className="contact-hero">
        <div className="container">
          <div className="contact-label mb-2">Help &amp; information</div>
          <h1 className="contact-title mb-3">Frequently Asked Questions</h1>
          <p className="contact-intro mb-0">Answers to common questions about bidding, selling, and visiting the gallery.</p>
        </div>
      </section>
      <section className="container py-5" aria-label="Frequently asked questions">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <FaqTabs faqs={faqs} />
            <div className="faq-more mt-5">
              <h2 className="h4 mb-1">Still have a question?</h2>
              <p className="mb-3">Our team is happy to help with anything not covered here.</p>
              <Link href="/contact" className="btn-gallery">Contact us →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
