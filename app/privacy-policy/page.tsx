import type { Metadata } from "next";
import { SitePageView } from "@/components/SitePageView";

export const metadata: Metadata = { title: "Privacy Policy | Art Gallery" };
export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return <SitePageView slug="privacy-policy" />;
}
