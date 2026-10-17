import Link from "next/link";

import { BrandLogo } from "@/components/common/brand-logo";
import { ConsentLink } from "@/components/common/consent-link";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SOCIAL_ICONS } from "@/components/layout/social-icons";
import { getPublishedCases } from "@/data/case-studies";
import { footer } from "@/lib/gamma-content";
import { site, socialLinks } from "@/lib/content/site";

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-dim-dark mb-5 font-mono text-[10.5px] tracking-[0.16em] uppercase">
      {children}
    </h3>
  );
}

const linkClass =
  "text-dark-body hover:text-brand transition-colors duration-200";

function NavColumn({ index }: { index: 0 | 1 }) {
  const column = footer.columns[index];

  return (
    <div>
      <ColumnTitle>{column.heading}</ColumnTitle>
      <ul className="flex flex-col gap-3.5 text-[14px]">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function GammaFooter() {
  const cases = await getPublishedCases();
  const proof = cases.map((item) => ({
    label: footer.work.label(item.vertical),
    href: `/work/${item.slug}`,
  }));

  return (
    <footer
      id="contact"
      className="relative isolate overflow-hidden bg-[#0b0e11] text-[#eceae2]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[62%]"
        style={{
          background:
            "radial-gradient(64% 100% at 50% 100%, rgba(47,232,92,0.13) 0%, rgba(47,232,92,0.03) 44%, transparent 76%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1280px] px-6 pt-[clamp(56px,6vw,88px)]">
        <div className="grid gap-x-[clamp(28px,3.2vw,56px)] gap-y-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_0.8fr_1.25fr]">
          <div>
            <Link
              href="/"
              aria-label={`${site.name} home`}
              className="inline-block"
            >
              <BrandLogo tone="light" className="h-[26px]" />
            </Link>

            <p className="text-dim-dark mt-5 max-w-[34ch] text-[14px] leading-[1.6]">
              {footer.tagline}
            </p>

            <a
              href={`mailto:${site.email}`}
              className={`${linkClass} mt-6 inline-block text-[14px]`}
            >
              {site.email}
            </a>

            <div className="mt-7 flex gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:border-brand hover:bg-brand grid size-9 place-items-center rounded-[10px] border border-white/[0.09] bg-white/[0.05] text-[#c8ccc2] transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-0.5 hover:text-[#0f1512]"
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

          <NavColumn index={0} />

          {/* Every client with a case study, read from the same list /work
              renders — a new case appears here without a second edit. */}
          <div>
            <ColumnTitle>{footer.work.heading}</ColumnTitle>
            <ul className="flex flex-col gap-3.5 text-[14px]">
              <li>
                <Link
                  href={footer.work.all.href}
                  className="text-dark-head hover:text-brand font-medium transition-colors duration-200"
                >
                  {footer.work.all.label}
                </Link>
              </li>
              {proof.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <NavColumn index={1} />

          <div>
            <ColumnTitle>{footer.newsletter.heading}</ColumnTitle>
            <p className="text-dim-dark mb-5 text-[14px] leading-[1.55]">
              {footer.newsletter.body}
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="text-dim-dark mt-[clamp(44px,5vw,68px)] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.07] pt-7 pb-9 text-[12.5px]">
          <p>
            © {new Date().getFullYear()} {site.legalName}. {footer.rights}
          </p>

          <div className="flex flex-wrap items-center gap-6">
            {footer.legal.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors duration-200 hover:text-[#eceae2]"
              >
                {item.label}
              </Link>
            ))}
            <ConsentLink className="transition-colors duration-200 hover:text-[#eceae2]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
