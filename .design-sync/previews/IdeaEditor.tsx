import { IdeaEditor } from "gd-website";

const noop = () => {};

const draftDoc = {
  type: "doc" as const,
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Northwind Logistics — dispatch agent" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Reads inbound carrier email, matches loads against open lanes, and drafts a reply for the dispatcher to approve.",
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Confirm inbox scopes with IT" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Draft the lane-matching prompt" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export function Editable() {
  return (
    <div className="bg-background h-[500px] max-w-2xl overflow-hidden rounded-xl border border-black/10">
      <IdeaEditor
        initialDoc={draftDoc}
        editable
        onChange={noop}
        onAttach={noop}
      />
    </div>
  );
}

export function ReadOnly() {
  return (
    <div className="bg-background max-w-2xl overflow-hidden rounded-xl border border-black/10">
      <IdeaEditor initialDoc={draftDoc} editable={false} onChange={noop} />
    </div>
  );
}
