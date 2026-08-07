const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();

export const site = {
  name: "Gamma Developers",
  mark: "GD",
  tagline: "AI-first software for businesses that already run.",
  email: "hello@gammadevelopers.ai",
  calendly: calendlyUrl || "https://calendly.com/gammadevelopers",
} as const;

export const navLinks = [
  { label: "Process", href: "#flow" },
  { label: "Services", href: "#capabilities" },
  { label: "Work", href: "#work" },
] as const;

export const clientLogos = [
  "Cortek",
  "D360",
  "Vidacure",
  "Royal Tap",
  "Drive-247",
  "METER",
  "Cars BN",
  "Just Wills",
] as const;

export const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "Process", href: "#flow" },
      { label: "Services", href: "#capabilities" },
      { label: "Work", href: "#work" },
    ],
  },
  {
    title: "Start",
    links: [
      { label: "Book an AI audit", href: site.calendly },
      { label: site.email, href: `mailto:${site.email}` },
    ],
  },
] as const;
