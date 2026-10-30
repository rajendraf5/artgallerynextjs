import type { FaqCategory } from "@/lib/gallery-types";

// The tabs on the F.A.Q page, in display order. Must match the backend's FaqCategory.
export const faqCategories: { id: FaqCategory; label: string }[] = [
  { id: "bidding", label: "Bidding" },
  { id: "sell", label: "Sell" },
  { id: "others", label: "Others" },
];

export function isFaqCategory(value: unknown): value is FaqCategory {
  return faqCategories.some((category) => category.id === value);
}
