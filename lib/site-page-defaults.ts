import type { SitePage, SitePageSlug } from "@/lib/gallery-types";

// The footer text pages: where each lives, its admin label, and what it shows until saved from the admin dashboard.
export const sitePages: { slug: SitePageSlug; path: string; label: string; defaults: SitePage }[] = [
  {
    slug: "support",
    path: "/support",
    label: "Support Center",
    defaults: {
      slug: "support",
      title: "Support Center",
      intro: "We are here to help with buying, selling, visiting, and anything else about the gallery.",
      content: `## Get in touch
Email us at hello@artgallery.com and our team will reply as soon as possible, usually within one working day.

Our gallery is open Monday – Sunday, 10 AM – 6 PM. You are welcome to speak to a member of our team in person during opening hours.

## Common topics
- Bidding: registering for an auction, placing bids, and paying for artwork you have won.
- Selling: having your artwork valued and offered in one of our auctions.
- Collection and delivery: arranging to pick up or ship a purchased artwork.
- Visiting: opening hours, exhibitions, and planning your visit.

## Before you contact us
Many questions are answered on our F.A.Q page. When you write to us about an artwork or an auction, please include its title so we can help you quickly.`,
    },
  },
  {
    slug: "privacy-policy",
    path: "/privacy-policy",
    label: "Privacy & Policy",
    defaults: {
      slug: "privacy-policy",
      title: "Privacy Policy",
      intro: "How Art Gallery collects, uses, and protects your personal information.",
      content: `## Information we collect
We collect the information you give us when you contact us, register to bid, buy or sell artwork, or sign up for updates. This can include your name, email address, phone number, postal address, and details of your purchases.

We also collect basic technical information when you use our website, such as your browser type and the pages you visit, to keep the site working and secure.

## How we use your information
- To answer your questions and provide the services you ask for.
- To manage auctions, sales, payments, and deliveries.
- To send you news about exhibitions and auctions, if you have agreed to receive it.
- To meet our legal and accounting obligations.

## Sharing your information
We do not sell your personal information. We only share it with trusted service providers who help us run the gallery, such as payment and shipping companies, or when the law requires it.

## Keeping your information safe
We use appropriate technical and organisational measures to protect your information, and we keep it only for as long as we need it.

## Your choices
You can ask to see, correct, or delete the personal information we hold about you, and you can unsubscribe from our emails at any time.

## Contact us
If you have any questions about this policy, email us at hello@artgallery.com.`,
    },
  },
  {
    slug: "terms-and-conditions",
    path: "/terms-and-conditions",
    label: "Terms & Conditions",
    defaults: {
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      intro: "The terms that apply when you use our website, visit the gallery, or take part in our auctions.",
      content: `## Using this website
By using this website you agree to these terms. The content is provided for general information and may change without notice.

## Artwork and images
All artworks and images on this website belong to the artists or the gallery. They may not be copied, reproduced, or used for commercial purposes without written permission.

## Auctions and sales
- Bidders must register before taking part in an auction.
- A bid is a binding offer to buy the artwork at that price.
- The highest bid accepted by the auctioneer wins the artwork.
- Payment is due within the time stated for each auction, and artwork is released once payment is received in full.

## Estimates and descriptions
Estimates are a guide only and are not a guarantee of the final price. We describe each artwork as accurately as we can, and we encourage buyers to view artwork in person before bidding.

## Changes to these terms
We may update these terms from time to time. The version on this page is the one that applies.

## Contact us
If you have any questions about these terms, email us at hello@artgallery.com.`,
    },
  },
];

export function isSitePageSlug(value: unknown): value is SitePageSlug {
  return sitePages.some((page) => page.slug === value);
}
