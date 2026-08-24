"use client";

import { useState } from "react";
import CodeBlock from "@tiptap/extension-code-block";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

function CodeBlockView({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <NodeViewWrapper className="group/code relative">
      <Button
        variant="bare"
        size="none"
        type="button"
        onClick={copy}
        contentEditable={false}
        aria-label={copied ? "Copied" : "Copy code"}
        title={copied ? "Copied" : "Copy code"}
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70 opacity-0 transition group-hover/code:opacity-100 hover:bg-white/20 hover:text-white focus-visible:opacity-100"
      >
        {copied ? (
          <Check className="text-gd-mint-bright size-3" />
        ) : (
          <Copy className="size-3" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

export const CodeBlockWithCopy = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
