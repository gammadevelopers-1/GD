import { GammaFooter } from "@/components/gamma/gamma-footer";
import { StickyNav } from "@/components/gamma/sticky-nav";

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <StickyNav />
      {children}
      <GammaFooter />
    </>
  );
}
