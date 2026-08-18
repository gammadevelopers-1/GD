"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  RotateCcw,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import type { FormerProjectMember, ProjectMember } from "@/data/project-detail";
import { type SimpleFormState, IDLE_FORM } from "@/lib/projects/form-state";
import { formatDate, initials } from "@/lib/projects/format";
import {
  BUTTON_DANGER,
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  FOCUS_RING,
  INPUT,
  INPUT_SMALL,
  PANEL,
  REVEAL_ON_HOVER,
} from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string };
type FormAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;
type PlainAction = (formData: FormData) => Promise<void>;

export function TeamPanel({
  projectId,
  members,
  formerMembers,
  people,
  isOwner,
  addMember,
  updateResponsibility,
  removeMember,
  restoreMember,
  setLead,
}: {
  projectId: string;
  members: ProjectMember[];
  formerMembers: FormerProjectMember[];
  people: Person[];
  isOwner: boolean;
  addMember: FormAction;
  updateResponsibility: FormAction;
  removeMember: PlainAction;
  restoreMember: PlainAction;
  setLead: PlainAction;
}) {
  const assigned = new Set(members.map((member) => member.id));
  const addable = people.filter((person) => !assigned.has(person.id));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className={cn(PANEL, "p-5")}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
              <UserRound className="size-4 text-black/45" />
            </span>
            <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
              On this project
            </h2>
          </div>
          <span className="font-mono text-[10px] text-black/35">
            {members.length} active
          </span>
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
                setLead={setLead}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-black/42">
            Nobody is assigned yet. Assigning someone is what gives them access
            to this project.
          </p>
        )}

        {isOwner && formerMembers.length ? (
          <FormerMembers
            projectId={projectId}
            formerMembers={formerMembers}
            restoreMember={restoreMember}
          />
        ) : null}
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
          <p className="mt-2.5 text-sm leading-6 text-black/45">
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
  setLead,
}: {
  projectId: string;
  member: ProjectMember;
  isOwner: boolean;
  updateResponsibility: FormAction;
  removeMember: PlainAction;
  setLead: PlainAction;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateResponsibility,
    IDLE_FORM,
  );

  return (
    <li
      className={cn(
        "group/member rounded-2xl border bg-white/50 p-3.5 transition duration-200",
        confirming
          ? "border-red-200 bg-red-50/40"
          : "border-black/[0.065] hover:border-black/[0.14] hover:bg-white hover:shadow-[0_10px_26px_rgba(20,23,26,0.05)]",
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
            <form action={formAction} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="profileId" value={member.id} />
              <input
                name="responsibility"
                defaultValue={member.responsibility}
                maxLength={120}
                autoFocus
                aria-label={`Responsibility for ${member.name}`}
                className={cn(INPUT_SMALL, "h-9 min-w-0 flex-1")}
              />
              <button
                type="submit"
                disabled={pending}
                className={cn(BUTTON_PRIMARY, "h-9 px-3 text-xs")}
              >
                {pending ? <Loader2 className="size-3 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className={cn(BUTTON_GHOST, "h-9")}
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <p className="mt-1 truncate text-[11px] text-black/45">
                {member.responsibility}
              </p>
              {isOwner && member.addedBy ? (
                <p className="mt-0.5 truncate text-[10px] text-black/32">
                  Added by {member.addedBy}
                </p>
              ) : null}
            </>
          )}

          {state.status !== "idle" && state.message ? (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1.5 text-[11px]",
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
        </div>

        {isOwner && !editing ? (
          <div
            className={cn(
              "flex shrink-0 flex-wrap items-center justify-end gap-1",
              confirming ? "opacity-100" : REVEAL_ON_HOVER,
            )}
          >
            {confirming ? (
              <>
                <form action={removeMember}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="profileId" value={member.id} />
                  <button type="submit" className={cn(BUTTON_DANGER, "h-8")}>
                    Remove access
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  aria-label="Keep them on the project"
                  className={cn(
                    "grid size-8 place-items-center rounded-lg text-black/40 transition hover:bg-black/[0.05] hover:text-black",
                    FOCUS_RING,
                  )}
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={cn(BUTTON_GHOST, "h-8")}
                >
                  Edit role
                </button>
                {member.isLead ? null : (
                  <form action={setLead}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="profileId" value={member.id} />
                    <button type="submit" className={cn(BUTTON_GHOST, "h-8")}>
                      Make lead
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className={cn(
                    BUTTON_GHOST,
                    "h-8 hover:bg-red-50 hover:text-red-700",
                  )}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {confirming ? (
        <p className="mt-2.5 rounded-lg bg-white/70 px-3 py-2 text-[11px] leading-4 text-black/60">
          {member.isLead
            ? "They are the project lead. Removing them clears the lead as well, so pick a new one afterwards."
            : "They lose access to this project immediately. The assignment is archived, not deleted, so you can restore it."}
        </p>
      ) : null}
    </li>
  );
}

function FormerMembers({
  projectId,
  formerMembers,
  restoreMember,
}: {
  projectId: string;
  formerMembers: FormerProjectMember[];
  restoreMember: PlainAction;
}) {
  return (
    <div className="mt-6 border-t border-black/[0.06] pt-5">
      <h3 className="text-[13px] font-semibold tracking-[-0.02em]">
        Previously on this project
      </h3>
      <p className="mt-1.5 text-[11px] text-black/40">
        Assignments are archived, never deleted. Restoring reuses the original
        record rather than creating a second one.
      </p>
      <ul className="mt-3 space-y-2">
        {formerMembers.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] px-3 py-2 transition duration-150 hover:border-black/[0.14] hover:bg-white"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-black/60">
                {member.name}
              </p>
              <p className="text-[10px] text-black/35">
                Removed {formatDate(member.removedAt.slice(0, 10))}
                {member.removedBy ? ` by ${member.removedBy}` : ""}
              </p>
            </div>
            <form action={restoreMember}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="profileId" value={member.id} />
              <button
                type="submit"
                className={cn(BUTTON_SECONDARY, "h-8 px-2.5 text-[11px]")}
              >
                <RotateCcw className="size-3" />
                Restore
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
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

  return (
    <section className={cn(PANEL, "h-fit p-5")}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-black/[0.045]">
          <UserPlus className="size-4 text-black/45" />
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
          Add someone
        </h2>
      </div>

      <p className="mb-4 text-[13px] leading-5 text-black/45">
        Adding a person here is what gives them access to this project. They
        will see it in their portfolio immediately.
      </p>

      {addable.length ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-black/55">Person</span>
            <select
              name="profileId"
              required
              className={cn(INPUT, "h-10 cursor-pointer")}
            >
              <option value="">Choose a team member</option>
              {addable.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-black/55">
              What are they doing on it?
            </span>
            <input
              name="responsibility"
              maxLength={120}
              placeholder="Frontend, QA, client contact…"
              className={cn(INPUT, "h-10")}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className={cn(BUTTON_PRIMARY, "h-10 w-full")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Add to project
          </button>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/42">
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
