const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();

export const site = {
  name: "Gamma Developers",
  mark: "GD",
  tagline: "AI-first software for businesses that already run.",
  email: "hello@gammadevelopers.ai",
  location: "Lahore, Pakistan · remote-first",
  replyTime: "Within one business day",
  calendly: calendlyUrl || "https://calendly.com/gammadevelopers",
} as const;

export const navLinks = [
  { label: "Home", href: "/#top" },
  { label: "Work", href: "/#work" },
  { label: "Compliance", href: "/#compliance" },
] as const;

export const servicesMenu = [
  {
    title: "Production AI agents",
    body: "Agents that own a real outcome, with logs you can audit.",
    href: "/#process",
  },
  {
    title: "Internal platforms",
    body: "Dashboards and CRMs that replace the shared spreadsheet.",
    href: "/#process",
  },
  {
    title: "Systems integration",
    body: "Connect the tools you pay for, so nothing gets retyped.",
    href: "/#process",
  },
  {
    title: "Ongoing engineering",
    body: "A retained team that keeps shipping after launch.",
    href: "/#process",
  },
] as const;

export const clientLogos = [
  { name: "Cortek", icon: "hex" },
  { name: "D360", icon: "orbit" },
  { name: "Vidacure", icon: "cross" },
  { name: "Royal Tap", icon: "peaks" },
  { name: "Drive-247", icon: "clock" },
  { name: "METER", icon: "gauge" },
  { name: "Cars BN", icon: "car" },
  { name: "Just Wills", icon: "shield" },
] as const;

export const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/gammadevelopers",
  },
  { label: "X / Twitter", href: "https://x.com/gammadevelopers" },
  { label: "GitHub", href: "https://github.com/gammadevelopers" },
] as const;

export const footerColumns = [
  {
    title: "Site",
    links: [
      { label: "How we work", href: "/#process" },
      { label: "Case studies", href: "/#work" },
      { label: "Compliance", href: "/#compliance" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
] as const;

export const legalLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Cookies", href: "#" },
] as const;
