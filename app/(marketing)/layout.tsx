import { SiteLoader } from "@/components/common/site-loader";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteLoader />
      {children}
    </>
  );
}
