import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ButtonFillEffects } from "@/components/common/button-fill-effects";
import { ConsentBanner } from "@/components/common/consent-banner";
import { SiteAnalytics } from "@/components/common/site-analytics";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { configuredOrigin } from "@/lib/site/origin";
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
  src: "./fonts/JetBrainsMono-Regular.ttf",
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

const syne = localFont({
  src: "./fonts/Syne-Variable.ttf",
  variable: "--font-syne",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(configuredOrigin() ?? "http://localhost:3000"),
  title: {
    default: "AI agents for SMBs that actually ship · Gamma Developers",
    template: "%s · Gamma Developers",
  },
  description:
    "AI agents and workflow automation for small and medium businesses. We map how your business actually runs, then build systems that reach production.",
  openGraph: { type: "website", siteName: "Gamma Developers" },
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
