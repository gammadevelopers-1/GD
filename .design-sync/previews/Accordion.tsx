import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "gd-website";

export function Default() {
  return (
    <div className="max-w-lg p-6">
      <Accordion type="single" collapsible defaultValue="scope">
        <AccordionItem value="scope">
          <AccordionTrigger>What's included in the audit?</AccordionTrigger>
          <AccordionContent>
            We map every manual step in your ops that could be an agent,
            score them by effort and payoff, and hand you a ranked backlog.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="timeline">
          <AccordionTrigger>How long does a build take?</AccordionTrigger>
          <AccordionContent>
            Most agents ship in two to four weeks, tracked week by week
            inside the project workspace.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="retainer">
          <AccordionTrigger>What happens after launch?</AccordionTrigger>
          <AccordionContent>
            Projects move to a retainer for monitoring, fixes, and the next
            round of automation.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function MultipleOpen() {
  return (
    <div className="max-w-lg p-6">
      <Accordion type="multiple" defaultValue={["billing", "security"]}>
        <AccordionItem value="billing">
          <AccordionTrigger>Billing and contracts</AccordionTrigger>
          <AccordionContent>
            Fixed-price builds, then a monthly retainer once the agent is
            live. No usage surprises.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="security">
          <AccordionTrigger>How are credentials handled?</AccordionTrigger>
          <AccordionContent>
            Secrets are stored in a vault, scoped per project, and every
            access is written to an audit trail.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function AllClosed() {
  return (
    <div className="max-w-lg p-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="northwind">
          <AccordionTrigger>Northwind Logistics — dispatch agent</AccordionTrigger>
          <AccordionContent>
            Reads inbound carrier email and books the load automatically.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="harbor">
          <AccordionTrigger>Harbor Freight Co — invoice reconciliation</AccordionTrigger>
          <AccordionContent>
            Matches incoming invoices against purchase orders and flags
            mismatches for review.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
