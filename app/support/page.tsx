import type { Metadata } from "next";
import { SitePageView } from "@/components/SitePageView";

export const metadata: Metadata = { title: "Support Center | Art Gallery" };
export const dynamic = "force-dynamic";

export default function SupportPage() {
  return <SitePageView slug="support" />;
}
