import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/gamma/contact-form";
import { contactPage } from "@/lib/content/contact";
import { site } from "@/lib/content/site";

const { hero, details, form, closer } = contactPage;

const ICONS = { mail: Mail, phone: Phone, pin: MapPin } as const;

export const metadata: Metadata = {
  title: `Contact · ${site.name}`,
  description: hero.lead,
};

export default function ContactPage() {
  return (
    <main id="top">
      <section
        id="hero"
        className="bg-dark relative isolate flex flex-col overflow-hidden"
      >
        {/* Rays fanning out of the top-right corner, mirroring /work. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "conic-gradient(from 164deg at 108% -16%, transparent 0deg, rgba(47,232,92,0.20) 7deg, transparent 16deg, transparent 24deg, rgba(47,232,92,0.28) 31deg, transparent 40deg, transparent 49deg, rgba(47,232,92,0.14) 56deg, transparent 65deg, transparent 74deg, rgba(47,232,92,0.18) 81deg, transparent 90deg)",
            filter: "blur(26px)",
            maskImage:
              "radial-gradient(125% 115% at 100% 0%, #000 0%, rgba(0,0,0,0.5) 44%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(125% 115% at 100% 0%, #000 0%, rgba(0,0,0,0.5) 44%, transparent 80%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(236,236,228,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(236,236,228,0.028) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(80% 74% at 50% 42%, #000 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(80% 74% at 50% 42%, #000 0%, transparent 78%)",
          }}
        />

        {/* Clears the fixed StickyNav, which is dark while this hero is behind it. */}
        <div aria-hidden className="h-[72px] shrink-0" />

        <div className="mx-auto w-full max-w-[1080px] px-6 pt-[clamp(36px,4vw,60px)] pb-[clamp(40px,4.4vw,64px)]">
          <div className="flex flex-col items-center text-center">
            <p className="t-eyebrow text-dim-dark flex items-center gap-3">
              <span aria-hidden className="bg-dark-line-strong h-px w-8" />
              {hero.eyebrow}
              <span aria-hidden className="bg-dark-line-strong h-px w-8" />
            </p>

            <h1 className="font-display mt-6 text-[clamp(36px,5.6vw,74px)] leading-[0.94] font-bold tracking-[-0.05em] uppercase">
              <span className="text-dark-head block">{hero.heading.one}</span>
              <span className="text-brand block">{hero.heading.two}</span>
            </h1>

            <p className="text-dark-body mt-6 max-w-[58ch] text-[17px] leading-[1.6] text-pretty">
              {hero.lead}
            </p>
          </div>

          <ul className="border-dark-line mt-[clamp(36px,4.4vw,60px)] grid gap-px overflow-hidden rounded-[14px] border bg-[rgba(42,45,51,0.9)] sm:grid-cols-3">
            {details.map((detail) => {
              const Icon = ICONS[detail.icon];

              return (
                <li key={detail.key} className="bg-dark-row group relative">
                  <div className="flex h-full flex-col p-[clamp(20px,2.4vw,28px)]">
                    <span className="flex items-center gap-2.5">
                      <span className="border-dark-line text-brand group-hover:border-brand/40 group-hover:bg-brand/10 grid size-8 shrink-0 place-items-center rounded-[9px] border bg-white/[0.04] transition-colors duration-300 ease-out">
                        <Icon
                          aria-hidden
                          className="size-4"
                          strokeWidth={1.6}
                        />
                      </span>
                      <span className="t-eyebrow text-dim-dark">
                        {detail.label}
                      </span>
                    </span>

                    {detail.href ? (
                      <a
                        href={detail.href}
                        className="text-dark-head hover:text-brand mt-4 text-[16px] leading-[1.35] font-semibold tracking-[-0.02em] transition-colors duration-200"
                      >
                        {detail.value}
                      </a>
                    ) : (
                      <span className="text-dark-head mt-4 text-[16px] leading-[1.35] font-semibold tracking-[-0.02em]">
                        {detail.value}
                      </span>
                    )}

                    <span className="text-dim-dark mt-1.5 text-[13px] leading-[1.5]">
                      {detail.note}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-ground">
        <div className="mx-auto w-full max-w-[1080px] px-6 pt-[clamp(48px,5.4vw,80px)] pb-[clamp(40px,4.4vw,64px)]">
          <div className="mb-[clamp(24px,3vw,38px)]">
            <h2 className="font-display text-ink text-[clamp(28px,3.6vw,44px)] leading-[0.98] font-bold tracking-[-0.045em] uppercase">
              {form.heading}
            </h2>
            <p className="text-ink-soft mt-4 max-w-[56ch] text-[16px] leading-[1.6]">
              {form.lead}
            </p>
          </div>

          <ContactForm />
        </div>
      </section>

      <section className="bg-ground">
        <div className="mx-auto w-full max-w-[1080px] px-6 pb-[clamp(56px,6vw,88px)]">
          <div className="border-line flex flex-col items-start gap-6 rounded-[16px] border bg-white p-[clamp(24px,3.2vw,40px)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="t-h4 text-ink">{closer.heading}</h2>
              <p className="text-ink-soft mt-2 max-w-[52ch] text-[14px] leading-[1.6]">
                {closer.body}
              </p>
            </div>

            <Link
              href={closer.cta.href}
              className="border-line-strong text-ink hover:border-green-ink hover:text-green-ink inline-flex h-[50px] shrink-0 items-center rounded-full border px-7 text-[15px] font-semibold transition-colors duration-200 ease-out"
            >
              {closer.cta.label}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
