import type { Metadata } from "next";
import { AmbientField } from "@/components/common/ambient-field";
import { Reveal } from "@/components/common/reveal";
import { ContactForm } from "@/components/sections/contact/contact-form";
import { contact } from "@/lib/content/home";
import { site } from "@/lib/content/site";
import { Clock, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Contact · ${site.name}`,
  description: contact.body,
};

export default function ContactPage() {
  const details = [
    {
      icon: Mail,
      label: "Email",
      value: site.email,
      href: `mailto:${site.email}`,
    },
    { icon: MapPin, label: "Based in", value: site.location },
    { icon: Clock, label: "Reply time", value: site.replyTime },
  ];

  return (
    <main
      id="top"
      className="bg-gd-light-background relative min-h-screen overflow-x-hidden"
    >
      <section className="relative isolate overflow-hidden pt-37 pb-17 [background:radial-gradient(ellipse_60%_46%_at_50%_0%,rgba(255,255,255,0.9),transparent_68%),linear-gradient(180deg,#f4f4ee_0%,#eef4ee_60%,#e6efe7_100%)]">
        <AmbientField variant="mint" className="opacity-80" />
        <Reveal className="relative z-1 mx-auto max-w-[820px] px-5 text-center md:px-9">
          <span className="shimmer-label mb-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase">
            <span className="bg-brand size-1.5 rounded-full shadow-[0_0_10px_rgba(47,232,92,0.7)]" />
            {contact.eyebrow}
          </span>
          <h1 className="font-display text-[clamp(38px,6vw,68px)] leading-[0.92] font-bold tracking-[-0.045em] uppercase">
            {contact.title}
          </h1>
          <p className="text-foreground/72 mx-auto mt-5.5 max-w-[52ch] text-[clamp(15px,1.6vw,18px)] leading-[1.55]">
            {contact.body}
          </p>
        </Reveal>
      </section>

      <section className="relative pb-27">
        <div className="mx-auto grid max-w-[1120px] items-start gap-7.5 px-5 md:px-9 lg:grid-cols-[1.25fr_0.9fr]">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[20px] p-7 text-[#eef1ec] [background:linear-gradient(180deg,#101512,#0a1f14)]">
              <div
                aria-hidden
                className="absolute -top-[40%] -right-[25%] size-[75%] rounded-full bg-[rgba(47,232,92,0.22)] blur-[70px]"
              />
              <div className="relative">
                <span className="font-mono text-[10.5px] tracking-[0.2em] text-[#75efa0] uppercase">
                  {contact.aside.eyebrow}
                </span>
                <h2 className="font-display mt-3 mb-2 text-[22px] font-semibold tracking-[-0.025em]">
                  {contact.aside.title}
                </h2>
                <p className="mb-4.5 text-[13.5px] leading-[1.55] text-[#a8aea5]">
                  {contact.aside.body}
                </p>
                <Link
                  href={site.calendly}
                  data-button-fill
                  className="button-fill-fx bg-brand focus-visible:ring-brand/50 flex h-12 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold text-[#101512] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(47,232,92,0.42)] focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="button-fill-fx__label">
                    {contact.aside.cta}
                  </span>
                </Link>
              </div>
            </div>

            <div className="border-border flex flex-col gap-4.5 rounded-[20px] border bg-white p-6.5 shadow-[0_20px_50px_-30px_rgba(16,24,40,0.28)]">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-center gap-3.25">
                  <span className="text-gd-light-emerald grid size-10 shrink-0 place-items-center rounded-[11px] bg-[rgba(47,232,92,0.10)]">
                    <detail.icon
                      aria-hidden
                      className="size-4.5"
                      strokeWidth={1.5}
                    />
                  </span>
                  <div>
                    <div className="text-xs text-black/40">{detail.label}</div>
                    {detail.href ? (
                      <a
                        href={detail.href}
                        className="text-foreground text-[14.5px] font-semibold hover:text-[#059669]"
                      >
                        {detail.value}
                      </a>
                    ) : (
                      <div className="text-foreground text-[14.5px] font-semibold">
                        {detail.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
