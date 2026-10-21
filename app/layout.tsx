import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ButtonFillEffects } from "@/components/common/button-fill-effects";
import { ConsentBanner } from "@/components/common/consent-banner";
import { SiteAnalytics } from "@/components/common/site-analytics";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { configuredOrigin } from "@/lib/site/origin";
import { OG_IMAGE, absoluteUrl } from "@/lib/seo";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
} from "@/components/common/json-ld";

const generalSans = localFont({
  src: [
    {
      path: "./fonts/GeneralSans-Variable.woff2",
      weight: "200 700",
      style: "normal",
    },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono-Regular.woff2",
  variable: "--font-jetbrains",
  display: "swap",
});

const hikasami = localFont({
  src: [
    {
      path: "./fonts/Hikasami-VF.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-hikasami",
  display: "swap",
});

// Only the error page uses this (.route-error-code), so it is not preloaded:
// it was costing every page a 74 KB download for a screen nobody should see.
const syne = localFont({
  src: "./fonts/Syne-Variable.woff2",
  variable: "--font-syne",
  weight: "400 800",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(configuredOrigin() ?? "http://localhost:3000"),
  title: {
    default: "AI agents for SMBs that actually ship · Gamma Developers",
    template: "%s · Gamma Developers",
  },
  description:
    "AI agents and workflow automation for small and medium businesses. We map how your business actually runs, then build systems that reach production.",
  // Routes that do not go through pageMeta() still need a card; an explicit
  // openGraph object suppresses the opengraph-image file convention.
  openGraph: {
    type: "website",
    siteName: "Gamma Developers",
    images: [
      {
        url: absoluteUrl(OG_IMAGE),
        width: 1200,
        height: 630,
        alt: "Gamma Developers",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: [absoluteUrl(OG_IMAGE)] },
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} ${hikasami.variable} ${jetbrainsMono.variable} ${syne.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-background text-foreground font-body antialiased">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <ButtonFillEffects />
        {children}
        <Toaster />
        <SiteAnalytics />
        <ConsentBanner />
      </body>
    </html>
  );
}
