"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  Pencil,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { ProjectMember } from "@/data/project-detail";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { ConfirmAction } from "@/components/admin/projects/modal";
import { FormSelect } from "@/components/common/form-select";
import { useCloseOnSuccess } from "@/components/admin/projects/use-close-on-success";
import { initials } from "@/lib/projects/format";
import { ICON_BUTTON_DANGER, INPUT, PANEL } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Person = { id: string; name: string };
type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;
type PlainAction = (formData: FormData) => Promise<void>;

export function TeamPanel({
  projectId,
  members,
  people,
  isOwner,
  addMember,
  updateResponsibility,
  removeMember,
}: {
  projectId: string;
  members: ProjectMember[];
  people: Person[];
  isOwner: boolean;
  addMember: FormAction;
  updateResponsibility: FormAction;
  removeMember: PlainAction;
}) {
  const assigned = new Set(members.map((member) => member.id));
  const addable = people.filter((person) => !assigned.has(person.id));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className={cn(PANEL, "p-5")}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
              <UserRound className="size-4 text-black/60" />
            </span>
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              On this project
            </h2>
          </div>
        </div>

        {members.length ? (
          <ul className="space-y-2.5">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                projectId={projectId}
                member={member}
                isOwner={isOwner}
                updateResponsibility={updateResponsibility}
                removeMember={removeMember}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-black/55">
            Nobody is assigned yet. Assigning someone is what gives them access
            to this project.
          </p>
        )}
      </section>

      {isOwner ? (
        <AddMemberPanel
          projectId={projectId}
          addable={addable}
          addMember={addMember}
        />
      ) : (
        <section className={cn(PANEL, "p-5")}>
          <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
            Who can see this project
          </h2>
          <p className="mt-2.5 text-sm leading-6 text-black/60">
            Only the people listed here, plus the owners. An owner adds and
            removes people — ask one if somebody is missing.
          </p>
        </section>
      )}
    </div>
  );
}

function MemberRow({
  projectId,
  member,
  isOwner,
  updateResponsibility,
  removeMember,
}: {
  projectId: string;
  member: ProjectMember;
  isOwner: boolean;
  updateResponsibility: FormAction;
  removeMember: PlainAction;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, startRemoving] = useTransition();
  const [state, formAction, pending] = useActionState(
    updateResponsibility,
    IDLE_FORM,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  useCloseOnSuccess(state, () => setEditing(false));

  // Clearing is the same save with an empty field: the action already maps an
  // empty string to null, so there is no separate delete path to keep in step.
  function deleteMember() {
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("profileId", member.id);
    startRemoving(() => removeMember(data));
  }

  function clearResponsibility() {
    if (fieldRef.current) fieldRef.current.value = "";
    formRef.current?.requestSubmit();
  }

  return (
    <li
      className={cn(
        "group/member rounded-2xl border border-black/[0.065] bg-white/50 p-3.5 transition duration-200",
        "hover:border-black/[0.14] hover:bg-white hover:shadow-[0_10px_26px_rgba(20,23,26,0.05)]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl text-[10px] font-semibold transition duration-200",
            member.isLead
              ? "bg-[#15181b] text-[#2fe85c] ring-2 ring-[#2fe85c]/25"
              : "bg-[#15181b] text-[#2fe85c]",
          )}
        >
          {initials(member.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
            {member.name}
            {member.isLead ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#2fe85c]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#08743d]">
                <Crown className="size-2.5" /> Lead
              </span>
            ) : null}
          </p>

          {editing ? (
            <form
              ref={formRef}
              action={formAction}
              className="mt-2 flex flex-wrap gap-2"
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="profileId" value={member.id} />
              <Input
                variant="admin-sm"
                ref={fieldRef}
                name="responsibility"
                defaultValue={member.responsibility ?? ""}
                maxLength={120}
                autoFocus
                placeholder="Frontend, QA, client contact…"
                aria-label={`What ${member.name} does on this project`}
                className={cn("h-9 min-w-0 flex-1")}
              />
              <Button
                variant="admin-primary"
                size="none"
                type="submit"
                disabled={pending}
                className="h-9 px-3 text-xs"
              >
                {pending ? <Loader2 className="size-3 animate-spin" /> : null}
                Save
              </Button>
              {member.responsibility ? (
                <Button
                  variant="admin-ghost"
                  size="none"
                  type="button"
                  onClick={clearResponsibility}
                  disabled={pending}
                  className="h-9 hover:bg-red-50 hover:text-red-700"
                >
                  Clear
                </Button>
              ) : null}
              <Button
                variant="admin-ghost"
                size="none"
                type="button"
                onClick={() => setEditing(false)}
                className="h-9"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <div className="mt-1 flex items-center gap-1">
                <p
                  className={cn(
                    "truncate text-[11px]",
                    member.responsibility ? "text-black/60" : "text-black/55",
                  )}
                >
                  {member.responsibility ?? "No role set"}
                </p>
              </div>
            </>
          )}

          {state.status !== "idle" && state.message ? (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1.5 text-[11px]",
                state.status === "success" ? "text-[#08743d]" : "text-red-700",
              )}
            >
              {state.status === "success" ? null : (
                <AlertCircle className="size-3" />
              )}
              {state.message}
            </p>
          ) : null}
        </div>

        {isOwner && !editing ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="admin-icon"
              size="none"
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit what ${member.name} does on this project`}
              title="Edit what they do"
            >
              <Pencil className="size-3.5" />
            </Button>
            <ConfirmAction
              label={<Trash2 className="size-3.5" />}
              confirmLabel="Delete"
              question={
                member.isLead
                  ? `Delete ${member.name} from this project? They are the lead, so the project is left without one. This cannot be undone.`
                  : `Delete ${member.name} from this project? They lose access immediately and this cannot be undone.`
              }
              pending={removing}
              className={ICON_BUTTON_DANGER}
              onConfirm={deleteMember}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

function AddMemberPanel({
  projectId,
  addable,
  addMember,
}: {
  projectId: string;
  addable: Person[];
  addMember: FormAction;
}) {
  const [state, formAction, pending] = useActionState(addMember, IDLE_FORM);
  const [chosen, setChosen] = useState("");

  // The person just added drops out of `addable`, so a stale selection would
  // leave the button live with nothing valid behind it.
  useCloseOnSuccess(state, () => setChosen(""));

  return (
    <section className={cn(PANEL, "h-fit p-5")}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
          <UserPlus className="size-4 text-black/60" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
          Add someone
        </h2>
      </div>

      {addable.length ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-black/55">Person</span>
            <FormSelect
              name="profileId"
              required
              value={chosen}
              onValueChange={setChosen}
              triggerClassName={cn(INPUT, "h-10 cursor-pointer")}
              options={[
                { value: "", label: "Choose a team member" },
                ...addable.map((person) => ({
                  value: person.id,
                  label: person.name,
                })),
              ]}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-black/55">
              What are they doing on it?{" "}
              <span className="font-normal text-black/55">(optional)</span>
            </span>
            <Input
              variant="admin"
              name="responsibility"
              maxLength={120}
              placeholder="Frontend, QA, client contact…"
              className={cn("h-10")}
            />
          </label>
          <Button
            variant="admin-primary"
            size="none"
            type="submit"
            disabled={pending || !chosen}
            className="h-10 w-full"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Add to project
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/55">
          Everyone active is already on this project.
        </p>
      )}

      {state.status !== "idle" && state.message ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-[11px]",
            state.status === "success" ? "text-[#08743d]" : "text-red-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
