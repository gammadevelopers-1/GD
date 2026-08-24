"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/admin/projects/modal";
import { EmptyState } from "@/components/admin/empty-state";
import { PANEL } from "@/lib/admin-ui";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import type { CopyVariable, EnvCopy } from "@/data/env-copies";
import { cn } from "@/lib/utils";

type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

export function EnvMyCopy({
  projectId,
  copies,
  variables,
  createCopy,
  saveVariables,
  removeVariable,
}: {
  projectId: string;
  copies: EnvCopy[];
  variables: Record<string, CopyVariable[]>;
  createCopy: FormAction;
  saveVariables: FormAction;
  removeVariable: (formData: FormData) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/[0.06] px-5 py-4">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.025em]">
          Your copy
        </h2>
        <Button
          variant="admin-cta"
          size="admin-sm"
          type="button"
          data-button-fill
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3.5" />
          <span className="button-fill-fx__label">New copy</span>
        </Button>
      </header>

      {copies.length ? (
        <div className="divide-y divide-black/[0.045]">
          {copies.map((copy) => (
            <CopyBlock
              key={copy.id}
              copy={copy}
              variables={variables[copy.id] ?? []}
              saveVariables={saveVariables}
              removeVariable={removeVariable}
            />
          ))}
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            icon={Plus}
            title="No copy yet"
            description="Keep your own working values here. Only you and an owner can see them."
            action={
              <Button
                variant="admin-cta"
                size="admin-sm"
                type="button"
                data-button-fill
                onClick={() => setAdding(true)}
              >
                <Plus className="size-3.5" />
                <span className="button-fill-fx__label">New copy</span>
              </Button>
            }
          />
        </div>
      )}

      <NewCopyDialog
        projectId={projectId}
        open={adding}
        onClose={() => setAdding(false)}
        createCopy={createCopy}
      />
    </section>
  );
}

function CopyBlock({
  copy,
  variables,
  saveVariables,
  removeVariable,
}: {
  copy: EnvCopy;
  variables: CopyVariable[];
  saveVariables: FormAction;
  removeVariable: (formData: FormData) => Promise<void>;
}) {
  const [state, action, pending] = useActionState(saveVariables, IDLE_FORM);

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-[10.5px] tracking-[0.16em] text-black/45 uppercase">
          {copy.name}
        </h3>
        <span className="font-mono text-[10.5px] text-black/30 tabular-nums">
          {variables.length} {variables.length === 1 ? "key" : "keys"}
        </span>
      </div>

      {variables.length ? (
        <ul className="mt-3 divide-y divide-black/[0.04]">
          {variables.map((variable) => (
            <li
              key={variable.id}
              className="flex items-center gap-3 py-2 transition-colors duration-150 hover:bg-black/[0.012]"
            >
              <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-black">
                {variable.key}
              </code>
              <span aria-hidden className="font-mono text-[11px] text-black/25">
                ••••••••
              </span>
              <form action={removeVariable}>
                <input type="hidden" name="credentialId" value={variable.id} />
                <Button
                  variant="admin-icon-danger"
                  size="none"
                  type="submit"
                  aria-label={`Remove ${variable.key}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <form action={action} className="mt-3 space-y-2">
        <input type="hidden" name="groupId" value={copy.id} />
        <Textarea
          name="blob"
          rows={3}
          spellCheck={false}
          variant="admin-sm"
          placeholder={"DATABASE_URL=postgres://…\nSTRIPE_KEY=sk_live_…"}
          className="resize-y font-mono"
        />
        <div className="flex items-center justify-between gap-3">
          <span
            aria-live="polite"
            className={cn(
              "text-[11px]",
              state.status === "error" ? "text-red-700" : "text-black/45",
            )}
          >
            {state.message}
          </span>
          <Button
            variant="admin-secondary"
            size="admin-sm"
            type="submit"
            disabled={pending}
            className="text-xs"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save to your copy
          </Button>
        </div>
      </form>
    </div>
  );
}

function NewCopyDialog({
  projectId,
  open,
  onClose,
  createCopy,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
  createCopy: FormAction;
}) {
  const [state, action, pending] = useActionState(createCopy, IDLE_FORM);

  return (
    <Modal open={open} onClose={onClose} title="New copy">
      <form action={action} className="space-y-3">
        <input type="hidden" name="projectId" value={projectId} />
        <label className="block space-y-1.5">
          <span className="text-[12px] text-black/55">Name</span>
          <Input
            name="name"
            required
            maxLength={80}
            variant="admin"
            placeholder="Local"
            className="h-9"
          />
        </label>

        {state.status === "error" ? (
          <p className="text-[11.5px] text-red-700">{state.message}</p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="admin-ghost"
            size="admin"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="admin-cta"
            size="admin"
            type="submit"
            data-button-fill
            disabled={pending}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            <span className="button-fill-fx__label">Create copy</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
