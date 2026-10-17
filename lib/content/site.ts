const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();

export const site = {
  /** The brand. The registered entity behind it is legalName. */
  name: "Gamma Developers",
  /** Gamma Systems LLC, NM business ID 0008132973, effective 1 Oct 2026. */
  legalName: "Gamma Systems LLC",
  jurisdiction: "New Mexico, United States",
  /** Registered address on the NM Articles of Organization. */
  address: {
    line1: "1209 Mountain Road PL NE, Ste R",
    line2: "Albuquerque, NM 87110, United States",
  },
  mark: "GD",
  tagline: "AI-first software for businesses that already run.",
  email: "contact@gammadevelopers.com",
  phone: "+92 313 4900091",
  phoneHref: "tel:+923134900091",
  location: "New Mexico, United States · remote-first",
  replyTime: "Within one business day",
  /** Embedded on /book. Everything else links to /book, not here. */
  calendly: calendlyUrl || "https://calendly.com/gammadevelopers0/30min",
  book: "/book",
} as const;

export const navLinks = [
  { label: "Work", href: "/work" },
  { label: "Audit", href: "/audit" },
  { label: "About", href: "/about" },
] as const;

export const servicesMenu = [
  {
    title: "Speed to lead",
    body: "The lead that comes in at 7pm Friday gets answered at 7pm Friday.",
    href: "/services/speed-to-lead",
  },
  {
    title: "Document processing",
    body: "Nobody retypes invoices into the spreadsheet anymore.",
    href: "/services/document-processing",
  },
  {
    title: "Follow-up",
    body: "The people who went quiet still hear from you.",
    href: "/services/follow-up",
  },
  {
    title: "Database reactivation",
    body: "Your best month is probably already sitting in your CRM.",
    href: "/services/reactivation",
  },
  {
    title: "Internal reporting",
    body: "Friday's report builds itself.",
    href: "/services/reporting",
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
    href: "https://www.linkedin.com/company/gamma-developers/",
  },
  { label: "Instagram", href: "https://www.instagram.com/gammadevelopers/" },
  {
    label: "Facebook",
    // id= is the address; the utm_* and fbclid params on the pasted link were
    // the Instagram bio tag and would misattribute every click from the site.
    href: "https://www.facebook.com/profile.php?id=61568610294256",
  },
  // The clean booking URL, not the link-in-bio one: that carries
  // utm_source=ig / utm_content=link_in_bio, which would file every click
  // from the site footer as Instagram traffic.
  { label: "Calendly", href: site.calendly },
] as const;

export const footerColumns = [
  {
    title: "Site",
    links: [
      { label: "The audit", href: "/audit" },
      { label: "Work", href: "/work" },
      { label: "How we work", href: "/#process" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact us", href: "/contact" },
    ],
  },
] as const;

export const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;
