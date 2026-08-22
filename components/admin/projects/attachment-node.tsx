"use client";

import { useEffect, useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { formatBytes, mediaKind } from "@/lib/projects/idea-media";
import { cn } from "@/lib/utils";

const cache = new Map<string, string>();
const waiting = new Map<string, Promise<string | null>>();

async function signedUrl(path: string): Promise<string | null> {
  const cached = cache.get(path);
  if (cached) return cached;

  const inflight = waiting.get(path);
  if (inflight) return inflight;

  const request = fetch("/api/projects/attachment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paths: [path] }),
  })
    .then((response) => (response.ok ? response.json() : { urls: {} }))
    .then((body: { urls?: Record<string, string> }) => {
      const url = body.urls?.[path] ?? null;
      if (url) cache.set(path, url);
      return url;
    })
    .catch(() => null)
    .finally(() => waiting.delete(path));

  waiting.set(path, request);
  return request;
}

function AttachmentView({ node, deleteNode, editor }: NodeViewProps) {
  const path = String(node.attrs.path ?? "");
  const name = String(node.attrs.name ?? "Attachment");
  const mime = String(node.attrs.mime ?? "");
  const size = Number(node.attrs.size ?? 0);
  const kind = mediaKind(mime);

  const [url, setUrl] = useState<string | null>(() => cache.get(path) ?? null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = holder.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || url || failed) return;
    let live = true;
    signedUrl(path).then((next) => {
      if (!live) return;
      if (next) setUrl(next);
      else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [visible, url, failed, path]);

  const editable = editor.isEditable;

  return (
    <NodeViewWrapper
      className="idea-attachment relative my-3"
      data-drag-handle
      ref={holder}
    >
      {editable ? (
        <button
          type="button"
          onClick={deleteNode}
          aria-label={`Remove ${name}`}
          title="Remove"
          className="absolute top-2 right-2 z-10 grid size-7 place-items-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover/idea:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}

      {kind === "image" && !failed ? (
        <figure className="group/idea relative overflow-hidden rounded-xl border border-black/[0.07] bg-black/[0.02]">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt={name}
              loading="lazy"
              className="mx-auto max-h-[560px] w-auto max-w-full"
            />
          ) : (
            <Placeholder />
          )}
        </figure>
      ) : kind === "video" && !failed ? (
        <div className="group/idea overflow-hidden rounded-xl border border-black/[0.07] bg-black">
          {url ? (
            <video
              src={url}
              controls
              preload="metadata"
              className="max-h-[560px] w-full"
            />
          ) : (
            <Placeholder />
          )}
        </div>
      ) : kind === "audio" && !failed ? (
        <div className="group/idea rounded-xl border border-black/[0.07] bg-black/[0.02] p-3">
          {url ? (
            <audio src={url} controls className="w-full" />
          ) : (
            <Placeholder />
          )}
        </div>
      ) : kind === "pdf" && !failed ? (
        <div className="group/idea overflow-hidden rounded-xl border border-black/[0.07]">
          <FileBar name={name} mime={mime} size={size} url={url} />
          {url ? (
            <iframe
              src={`${url}#view=FitH`}
              title={name}
              className="h-[520px] w-full border-0 bg-white"
            />
          ) : (
            <Placeholder />
          )}
        </div>
      ) : (
        <div className="group/idea rounded-xl border border-black/[0.07] bg-black/[0.02]">
          <FileBar name={name} mime={mime} size={size} url={url} />
        </div>
      )}
    </NodeViewWrapper>
  );
}

function Placeholder() {
  return (
    <div className="grid h-40 place-items-center">
      <Loader2 className="size-4 animate-spin text-black/55" />
    </div>
  );
}

function FileBar({
  name,
  mime,
  size,
  url,
}: {
  name: string;
  mime: string;
  size: number;
  url: string | null;
}) {
  const detail = [mime.split("/").pop()?.toUpperCase(), formatBytes(size)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/[0.05] text-black/60">
        <FileText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{name}</span>
        {detail ? (
          <span className="block text-[11px] text-black/55">{detail}</span>
        ) : null}
      </span>
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!url}
        title="Open"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg text-black/60 transition hover:bg-black/[0.06] hover:text-black",
          !url && "pointer-events-none opacity-40",
        )}
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}

export const Attachment = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      path: { default: "" },
      name: { default: "Attachment" },
      mime: { default: "" },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-attachment]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-attachment": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentView);
  },
});
