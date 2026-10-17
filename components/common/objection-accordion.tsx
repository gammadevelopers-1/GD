import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type Objection = {
  q: string;
  a: string;
};

type ObjectionAccordionProps = {
  items: readonly Objection[];
  className?: string;
};

export function ObjectionAccordion({
  items,
  className,
}: ObjectionAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn("border-border border-t", className)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.q}
          value={item.q}
          className="border-border border-b"
        >
          <AccordionTrigger className="font-display t-h4 py-6 text-left hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-gd-light-muted t-body max-w-[68ch] pb-6">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
