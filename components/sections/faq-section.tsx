import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/common/reveal";
import { SectionHeading } from "@/components/common/section-heading";
import { faq } from "@/lib/content/home";

export function FaqSection() {
  return (
    <section className="border-border bg-secondary border-t py-25">
      <div className="mx-auto max-w-[1240px] px-5 md:px-9">
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
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger className="hover:text-accent py-6 text-[17px] font-medium tracking-[-0.01em] hover:no-underline">
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
