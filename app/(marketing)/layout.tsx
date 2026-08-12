import { ButtonFillEffects } from "@/components/common/button-fill-effects";
import { SiteLoader } from "@/components/common/site-loader";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ButtonFillEffects />
      <SiteLoader />
      {children}
    </>
  );
}
