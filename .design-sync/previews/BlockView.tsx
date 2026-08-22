import { BlockView } from "gd-website";

export function MixedBlocks() {
  return (
    <div className="max-w-xl p-6">
      <BlockView
        blocks={[
          { type: "heading", level: 2, text: "Invoice reconciliation — week 5" },
          {
            type: "text",
            text: "Matches incoming invoices against purchase orders and flags anything that **doesn't line up**.",
          },
          {
            type: "bullet",
            items: [
              "Pull invoices from the shared inbox",
              "Match against open purchase orders",
              "Flag mismatches over $50 for review",
            ],
          },
          {
            type: "callout",
            tone: "warn",
            text: "Three invoices this week had no matching PO — routed to Priya for review.",
          },
          {
            type: "credential",
            credentialId: "cred-3",
            name: "HARBOR_WMS_API_KEY",
          },
          { type: "divider" },
          {
            type: "file",
            path: "projects/harbor/week5-summary.pdf",
            name: "week5-summary.pdf",
            size: 214_500,
          },
        ]}
        signedUrls={{
          "projects/harbor/week5-summary.pdf":
            "https://files.gammadevelopers.com/harbor/week5-summary.pdf",
        }}
      />
    </div>
  );
}

export function TextOnly() {
  return (
    <div className="max-w-xl p-6">
      <BlockView
        blocks={[
          {
            type: "text",
            text: "Kicked off discovery with Northwind. Two calls booked this week to map their dispatch workflow.",
          },
        ]}
        signedUrls={{}}
      />
    </div>
  );
}
