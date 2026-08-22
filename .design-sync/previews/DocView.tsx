import { DocView } from "gd-website";

const weekNotes = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Week 4 — intake agent" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "WhatsApp and email intake is " },
        { type: "text", text: "live", marks: [{ type: "bold" }] },
        {
          type: "text",
          text: ". Two edge cases left before we call it done.",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Handle attachments over 10MB" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Route French-language leads to the Montreal team",
                },
              ],
            },
          ],
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
              content: [
                { type: "text", text: "Connect WhatsApp Business API" },
              ],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Ship attachment size guard" }],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Client flagged that Friday leads still get missed over the weekend.",
            },
          ],
        },
      ],
    },
  ],
};

const technicalNote = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Deploy notes" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Webhook signature check now uses " },
        { type: "text", text: "X-GD-Signature", marks: [{ type: "code" }] },
        {
          type: "text",
          text: ". Rotate the shared secret before the next release.",
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "bash" },
      content: [
        {
          type: "text",
          text: "curl -X POST /api/webhooks/intake -H 'X-GD-Signature: ...'",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Full runbook is linked in the credentials note.",
          marks: [
            {
              type: "link",
              attrs: {
                href: "https://calendly.com/gammadevelopers",
                target: "_blank",
                rel: "noreferrer",
              },
            },
          ],
        },
      ],
    },
  ],
};

export function WeekNotes() {
  return (
    <div className="bg-background max-w-xl p-8">
      <DocView doc={weekNotes} />
    </div>
  );
}

export function TechnicalNote() {
  return (
    <div className="bg-background max-w-xl p-8">
      <DocView doc={technicalNote} />
    </div>
  );
}
