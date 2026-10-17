import Link from "next/link";
import { BrandLogo } from "@/components/common/brand-logo";
import { ConsentLink } from "@/components/common/consent-link";
import { newsletter } from "@/lib/content/home";
import {
  footerColumns,
  legalLinks,
  site,
  socialLinks,
} from "@/lib/content/site";
import { FooterGlow } from "./footer-glow";
import { NewsletterForm } from "./newsletter-form";
import { SOCIAL_ICONS } from "./social-icons";

function Dot() {
  return (
    <span aria-hidden className="opacity-40">
      •
    </span>
  );
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3.5 font-mono text-[10px] tracking-[0.15em] text-[#6d736a] uppercase">
      {children}
    </h3>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="book"
      className="relative scroll-mt-[90px] overflow-hidden bg-[#080b0e] pt-15 text-[#eceae2]"
    >
      <FooterGlow />

      <div className="relative z-2 mx-auto max-w-[1160px] px-5 md:px-6.5">
        <div className="grid gap-9 pt-2 pb-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
          <div>
            <BrandLogo tone="light" className="h-[24px]" />
            <p className="mt-3.5 max-w-[30ch] text-[13px] leading-[1.6] text-[#9aa096]">
              {site.tagline}
            </p>
            <div className="mt-4 flex gap-2.25">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="hover:border-brand hover:bg-brand grid size-8.5 place-items-center rounded-[9px] border border-white/[0.09] bg-white/[0.05] text-[#c8ccc2] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#0f1512]"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="size-[15px]"
                    fill="currentColor"
                  >
                    {SOCIAL_ICONS[social.label]}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <ColumnTitle>{col.title}</ColumnTitle>
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="hover:text-brand text-[#9aa096] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <ColumnTitle>{newsletter.title}</ColumnTitle>
            <p className="mb-3 text-[13px] leading-[1.55] text-[#9aa096]">
              {newsletter.body}
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-white/[0.07] pt-5 pb-6.5 font-mono text-[11px] text-[#6d736a]">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              © {new Date().getFullYear()} {site.name}
            </span>
            <Dot />
            {legalLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="transition-colors hover:text-[#eceae2]"
              >
                {l.label}
              </Link>
            ))}
            <ConsentLink className="transition-colors hover:text-[#eceae2]" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.75">
              <span className="bg-brand size-1.5 rounded-full shadow-[0_0_8px_rgba(47,232,92,0.7)]" />
              All systems operational
            </span>
            <Dot />
            <Link
              href="#top"
              className="transition-colors hover:text-[#eceae2]"
            >
              Back to top ↑
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
