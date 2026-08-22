import { useRef } from "react";
import { BoardSurface } from "gd-website";

const ideaDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Dispatch agent — ideas" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Reads inbound carrier email, matches it against open lanes, and drafts a booking for a human to confirm.",
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
              content: [{ type: "text", text: "Handle multi-leg loads" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Flag rate mismatches over 8%" }],
            },
          ],
        },
      ],
    },
  ],
};

const upload = async () => ({
  status: "success" as const,
  message: null,
  path: "projects/northwind/attachment.png",
  name: "attachment.png",
  size: 45210,
});

const noop = () => {};

export function Editable() {
  const editorRef = useRef(null);
  return (
    <div className="h-125 max-w-2xl overflow-hidden rounded-2xl border border-black/[0.08]">
      <BoardSurface
        projectId="northwind-logistics"
        initialDoc={ideaDoc}
        canEdit={true}
        placeholder="Capture anything worth doing…"
        status="saved"
        message={null}
        updatedAt="2026-08-20T15:30:00.000Z"
        updatedBy="Maya Reyes"
        onChange={noop}
        onRetry={noop}
        upload={upload}
        lead={
          <h3 className="text-[13px] font-semibold tracking-[-0.02em]">
            Idea board
          </h3>
        }
        editorRef={editorRef}
      />
    </div>
  );
}

export function SaveError() {
  const editorRef = useRef(null);
  return (
    <div className="h-125 max-w-2xl overflow-hidden rounded-2xl border border-black/[0.08]">
      <BoardSurface
        projectId="harbor-freight"
        initialDoc={ideaDoc}
        canEdit={true}
        placeholder="Capture anything worth doing…"
        status="error"
        message="Couldn't save — check your connection."
        updatedAt="2026-08-19T09:10:00.000Z"
        updatedBy="Devon Okafor"
        onChange={noop}
        onRetry={noop}
        upload={upload}
        lead={
          <h3 className="text-[13px] font-semibold tracking-[-0.02em]">
            Idea board
          </h3>
        }
        editorRef={editorRef}
      />
    </div>
  );
}

export function ViewOnly() {
  const editorRef = useRef(null);
  return (
    <div className="h-125 max-w-2xl overflow-hidden rounded-2xl border border-black/[0.08]">
      <BoardSurface
        projectId="harbor-freight"
        initialDoc={ideaDoc}
        canEdit={false}
        placeholder="Nothing written yet"
        status="idle"
        message={null}
        updatedAt="2026-08-14T11:00:00.000Z"
        updatedBy="Priya Nair"
        onChange={noop}
        onRetry={noop}
        upload={upload}
        lead={
          <h3 className="text-[13px] font-semibold tracking-[-0.02em]">
            Idea board
          </h3>
        }
        editorRef={editorRef}
      />
    </div>
  );
}
