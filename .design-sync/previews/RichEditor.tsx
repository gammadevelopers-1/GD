import { RichEditor } from "gd-website";

const notes = [
  { type: "heading", level: 2, text: "Onboarding call notes" },
  {
    type: "text",
    text: "Northwind runs dispatch out of a shared inbox. Carriers reply by email and someone re-keys the booking into their TMS by hand.",
  },
  { type: "bullet", items: ["Inbox volume: ~140/day", "Two dispatchers, one backup"] },
  { type: "callout", tone: "key", text: "Booking confirmations must go out within 5 minutes of a carrier reply." },
];

export function Default() {
  return (
    <div className="bg-background p-10" style={{ width: 620 }}>
      <RichEditor initialBlocks={notes} onChange={() => {}} />
    </div>
  );
}

export function Empty() {
  return (
    <div className="bg-background p-10" style={{ width: 620 }}>
      <RichEditor initialBlocks={[]} onChange={() => {}} />
    </div>
  );
}
