export const site = {
  name: "Gamma Developers",
  mark: "GD",
  tagline: "AI-first software for businesses that already run.",
  email: "hello@gammadevelopers.ai",
  calendly:
    process.env.NEXT_PUBLIC_CALENDLY_URL ??
    "https://calendly.com/gammadevelopers",
} as const;

export const navLinks = [
  { label: "Process", href: "#flow" },
  { label: "Services", href: "#capabilities" },
  { label: "Work", href: "#work" },
] as const;

export const clientLogos = [
  { name: "Cortek", src: "/logos/cortek.svg" },
  { name: "D360", src: "/logos/d360.svg" },
  { name: "Vidacure", src: "/logos/vidacure.svg" },
  { name: "Royal Tap", src: "/logos/royal-tap.svg" },
  { name: "Drive-247", src: "/logos/drive-247.svg" },
  { name: "METER", src: "/logos/meter.svg" },
  { name: "Cars BN", src: "/logos/cars-bn.svg" },
  { name: "Just Wills", src: "/logos/just-wills.svg" },
] as const;

export const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Work", href: "/work" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "AI agents", href: "/services/agents" },
      { label: "Internal tools", href: "/services/internal-tools" },
      { label: "Integrations", href: "/services/integrations" },
      { label: "Platforms", href: "/services/platforms" },
    ],
  },
  {
    title: "Contact",
    links: [
      {
        label: "hello@gammadevelopers.ai",
        href: "mailto:hello@gammadevelopers.ai",
      },
      { label: "LinkedIn", href: "https://linkedin.com" },
      { label: "Instagram", href: "https://instagram.com" },
      { label: "X", href: "https://x.com" },
    ],
  },
] as const;
