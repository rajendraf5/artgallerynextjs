import type { Metadata } from "next";
import { SitePageView } from "@/components/SitePageView";

export const metadata: Metadata = { title: "Terms & Conditions | Art Gallery" };
export const dynamic = "force-dynamic";

export default function TermsAndConditionsPage() {
  return <SitePageView slug="terms-and-conditions" />;
}
