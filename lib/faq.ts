import { ApiError, FAQS_ENDPOINT, api } from "@/lib/api";
import type { Faq } from "@/lib/gallery-types";

export type { Faq } from "@/lib/gallery-types";

// Shown on the F.A.Q page until questions are added from the admin dashboard.
export const defaultFaqs: Faq[] = [
  {
    id: "default-what-is-auction",
    category: "bidding",
    question: "What is an art auction?",
    answer: "An art auction is a public sale where artwork is sold to the highest bidder. Auctions can be held in person, online, or as a combination of both.",
    sortOrder: 0,
  },
  {
    id: "default-participate",
    category: "bidding",
    question: "How do I participate in an art auction?",
    answer: "Register with us before the auction with your contact details. Once approved, you can bid in person, online, or by phone, and place absentee bids in advance if you cannot attend.",
    sortOrder: 1,
  },
  {
    id: "default-reserve-price",
    category: "bidding",
    question: "What is a reserve price?",
    answer: "The reserve price is the confidential minimum price the seller has agreed to accept. If bidding does not reach the reserve, the artwork is not sold.",
    sortOrder: 2,
  },
  {
    id: "default-buyers-premium",
    category: "bidding",
    question: "What is a buyer’s premium?",
    answer: "The buyer’s premium is a percentage added to the winning bid (the hammer price) and paid by the buyer. The total you pay is the hammer price plus the premium and any applicable taxes.",
    sortOrder: 3,
  },
  {
    id: "default-authentic",
    category: "bidding",
    question: "How do I know if the artwork is authentic?",
    answer: "Every artwork is researched by our specialists before sale. Where available, we provide provenance, certificates of authenticity, and condition reports. Ask us for these documents before you bid.",
    sortOrder: 4,
  },
  {
    id: "default-how-to-sell",
    category: "sell",
    question: "How can I sell my artwork through the gallery?",
    answer: "Send us photos of the artwork with its size, medium, artist and any documents you have. Our specialists will review it and get back to you with an estimate.",
    sortOrder: 0,
  },
  {
    id: "default-valuation",
    category: "sell",
    question: "How is my artwork valued?",
    answer: "We estimate value from the artist’s market, recent comparable sales, the artwork’s condition, and its provenance.",
    sortOrder: 1,
  },
  {
    id: "default-hours",
    category: "others",
    question: "When is the gallery open?",
    answer: "We are open Monday to Sunday, 10:00 AM to 6:00 PM.",
    sortOrder: 0,
  },
  {
    id: "default-contact",
    category: "others",
    question: "How can I ask about an artwork or exhibition?",
    answer: "Email us at hello@artgallery.com or visit the Contact page, and our team will get back to you.",
    sortOrder: 1,
  },
];

function faqPath(id: string): string {
  return `${FAQS_ENDPOINT}/${encodeURIComponent(id)}`;
}

export async function readFaqs(): Promise<Faq[]> {
  return api.get<Faq[]>(`${FAQS_ENDPOINT}?limit=500`);
}

export async function createFaq(data: Omit<Faq, "id">): Promise<Faq> {
  return api.post<Faq>(FAQS_ENDPOINT, data);
}

export async function updateFaq(id: string, data: Partial<Omit<Faq, "id">>): Promise<Faq | null> {
  try {
    return await api.put<Faq>(faqPath(id), data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function deleteFaq(id: string): Promise<boolean> {
  try {
    await api.delete(faqPath(id));
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return false;
    throw error;
  }
}
