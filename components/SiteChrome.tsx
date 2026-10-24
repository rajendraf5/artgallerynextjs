"use client";

import { usePathname } from "next/navigation";
import { BackToTop } from "@/components/BackToTop";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function SiteChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  if (pathname === "/admin") return children;
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <BackToTop />
    </>
  );
}
