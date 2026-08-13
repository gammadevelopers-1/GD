import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AmbientField } from "@/components/common/ambient-field";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { faq } from "@/lib/content/home";

export function FaqSection() {
  return (
    <section className="border-border bg-secondary relative isolate overflow-hidden border-t py-25 [background:radial-gradient(ellipse_70%_55%_at_85%_0%,rgba(211,146,72,0.10),transparent_66%),linear-gradient(180deg,#f1eee7_0%,#e9e6de_100%)]">
      <AmbientField variant="warm" className="opacity-70" />
      <div className="relative z-1 mx-auto max-w-[1240px] px-5 md:px-9">
        <Reveal>
          <SectionHeading eyebrow={faq.eyebrow} title={faq.title} />
        </Reveal>

        <Reveal delay={0.08}>
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="mt-11 max-w-[800px]"
          >
            {faq.items.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="faq-row px-0 sm:px-4"
              >
                <AccordionTrigger className="hover:text-accent py-5 text-left text-base font-medium tracking-[-0.01em] hover:no-underline sm:py-6 sm:text-[17px]">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground max-w-[64ch] pb-6 text-[15px] leading-[1.66]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
