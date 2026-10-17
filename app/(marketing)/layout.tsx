import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { StickyCta } from "@/components/layout/sticky-cta";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <StickyCta />
      {children}
      <SiteFooter />
    </>
  );
}
