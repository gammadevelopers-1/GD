import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Project", template: "%s · Gamma Developers" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-background text-foreground min-h-dvh">{children}</div>
  );
}
