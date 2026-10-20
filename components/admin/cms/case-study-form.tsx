"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";

import { saveCaseStudy } from "@/app/(admin)/cms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CaseStudy } from "@/lib/content/cases";
import { IDLE_FORM } from "@/lib/projects/form-state";

/** "Label :: sentence" on each line. One textarea instead of a repeater
 *  widget: the content arrives written, and pasting it in beats clicking
 *  "add row" eleven times. */
function pairText(rows: readonly { a: string; b: string }[]) {
  return rows.map((row) => `${row.a} :: ${row.b}`).join("\n");
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] text-black/55">{label}</span>
      {hint ? (
        <span className="block text-[11px] text-black/40">{hint}</span>
      ) : null}
      {children}
    </label>
  );
}

function Group({
  step,
  title,
  note,
  children,
}: {
  step: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-black/[0.07] bg-white/60 p-5">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-[10px] text-black/35">{step}</span>
        <div>
          <h2 className="text-[13px] font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-black/45">{note}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function CaseStudyForm({
  id,
  study,
}: {
  id?: string;
  study?: CaseStudy;
}) {
  const [state, action, pending] = useActionState(saveCaseStudy, IDLE_FORM);

  return (
    <form action={action} className="space-y-5">
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/cms"
          className="inline-flex items-center gap-2 text-[12px] text-black/50 transition-colors hover:text-black"
        >
          <ArrowLeft className="size-3.5" />
          All case studies
        </Link>

        <div className="flex items-center gap-3">
          {state.status === "error" ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-red-600">
              <AlertCircle className="size-3.5" />
              {state.message}
            </span>
          ) : null}
          {state.status === "success" ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-green-700">
              <Check className="size-3.5" />
              {state.message}
            </span>
          ) : null}
          <Button
            variant="admin-cta"
            size="none"
            type="submit"
            disabled={pending}
            className="h-10 px-5"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            <span>{id ? "Save" : "Create draft"}</span>
          </Button>
        </div>
      </div>

      <Group
        step="01"
        title="The basics"
        note="How it is listed, and where it lives."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline" hint="The problem turning into an outcome.">
            <Input
              variant="admin"
              name="title"
              required
              maxLength={200}
              defaultValue={study?.title}
              placeholder="They stopped retyping client IDs"
              className="h-10"
            />
          </Field>
          <Field label="Web address" hint="gammadevelopers.com/work/…">
            <Input
              variant="admin"
              name="slug"
              required
              maxLength={120}
              defaultValue={study?.slug}
              placeholder="wills-firm-document-ai"
              className="h-10"
            />
          </Field>
        </div>

        <Field label="Card summary" hint="One sentence, shown on /work.">
          <Textarea
            name="body"
            rows={2}
            maxLength={600}
            defaultValue={study?.body}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Client" hint="Anonymous unless they agreed.">
            <Input
              variant="admin"
              name="client"
              defaultValue={study?.client}
              placeholder="A UAE wills firm"
              className="h-10"
            />
          </Field>
          <Field label="Industry">
            <Input
              variant="admin"
              name="sector"
              defaultValue={study?.sector}
              placeholder="Legal services"
              className="h-10"
            />
          </Field>
          <Field label="Location">
            <Input
              variant="admin"
              name="region"
              defaultValue={study?.region}
              placeholder="United Arab Emirates"
              className="h-10"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Footer label" hint='Shown as "AI for …".'>
            <Input
              variant="admin"
              name="vertical"
              defaultValue={study?.vertical}
              placeholder="Legal"
              className="h-10"
            />
          </Field>
          <Field label="Order" hint="Lower comes first.">
            <Input
              variant="admin"
              name="order"
              type="number"
              min={1}
              defaultValue={study?.order ?? 99}
              className="h-10"
            />
          </Field>
          <label className="flex items-center gap-2.5 pt-7">
            <input
              type="checkbox"
              name="named"
              defaultChecked={study?.named}
              className="size-4 accent-black"
            />
            <span className="text-[12px] text-black/55">
              Client agreed to be named
            </span>
          </label>
        </div>

        <Field label="Category line" hint="Shown above the headline.">
          <Input
            variant="admin"
            name="category"
            defaultValue={study?.category}
            placeholder="Legal services · Document AI · Multi-department platform"
            className="h-10"
          />
        </Field>
      </Group>

      <Group
        step="02"
        title="Pictures"
        note="Card artwork, the mockup beside the headline, and the gallery."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Card image" hint="Path under /public.">
            <Input
              variant="admin"
              name="image"
              defaultValue={study?.image}
              placeholder="/case-study.jpg"
              className="h-10"
            />
          </Field>
          <Field label="Hero mockup" hint="Optional. Sits beside the headline.">
            <Input
              variant="admin"
              name="heroImage"
              defaultValue={study?.heroImage}
              placeholder="/work/wills-hero.png"
              className="h-10"
            />
          </Field>
        </div>

        <Field
          label="Gallery"
          hint="One per line: /path/to/image.png :: what it shows"
        >
          <Textarea
            name="gallery"
            rows={3}
            defaultValue={pairText(
              (study?.gallery ?? []).map((shot) => ({
                a: shot.src,
                b: shot.caption,
              })),
            )}
            placeholder="/work/wills-builder.png :: The guided will builder"
          />
        </Field>
      </Group>

      <Group
        step="03"
        title="The hero"
        note="Three figures under the headline."
      >
        <Field
          label="Stats"
          hint="One per line: figure :: what it means. Three works best."
        >
          <Textarea
            name="stats"
            rows={3}
            defaultValue={pairText(
              (study?.stats ?? []).map((stat) => ({
                a: stat.value,
                b: stat.label,
              })),
            )}
            placeholder="Seconds :: to pull ID details into a will"
          />
        </Field>

        <Field
          label="About"
          hint="Who they are and what we did, in one go. Wrap a phrase in **stars** to pick it out in green."
        >
          <Textarea name="about" rows={4} defaultValue={study?.about} />
        </Field>
      </Group>

      <Group
        step="04"
        title="The leak"
        note="What was going wrong before you arrived."
      >
        <Field label="Heading">
          <Input
            variant="admin"
            name="leakHeading"
            defaultValue={study?.leak?.heading}
            className="h-10"
          />
        </Field>
        <Field label="Paragraphs" hint="One paragraph per line.">
          <Textarea
            name="leakBody"
            rows={6}
            defaultValue={(study?.leak?.body ?? []).join("\n")}
          />
        </Field>
        <Field label="Banner" hint="Optional. A wide image under the heading.">
          <Input
            variant="admin"
            name="leakImage"
            defaultValue={study?.leak?.image}
            placeholder="/casestudy-images/…"
            className="h-10"
          />
        </Field>
      </Group>

      <Group step="05" title="What we built" note="The work itself.">
        <Field label="Heading">
          <Input
            variant="admin"
            name="builtHeading"
            defaultValue={study?.built?.heading}
            className="h-10"
          />
        </Field>
        <Field
          label="Items"
          hint="One per line: name :: what it does."
        >
          <Textarea
            name="builtItems"
            rows={8}
            defaultValue={pairText(
              (study?.built?.items ?? []).map((item) => ({
                a: item.label,
                b: item.body,
              })),
            )}
            placeholder="AI reads the ID :: Clients upload an Emirates ID and the details land in the will."
          />
        </Field>
        <Field label="Banner" hint="Optional. A wide image under the heading.">
          <Input
            variant="admin"
            name="builtImage"
            defaultValue={study?.built?.image}
            placeholder="/casestudy-images/…"
            className="h-10"
          />
        </Field>
      </Group>

      <Group
        step="06"
        title="The AI layer"
        note="Only where there is enough of one to be worth its own section."
      >
        <Field label="Heading">
          <Input
            variant="admin"
            name="aiHeading"
            defaultValue={study?.ai?.heading}
            className="h-10"
          />
        </Field>
        <Field label="Opening paragraph" hint="Wrap a phrase in **stars** to pick it out in green.">
          <Textarea name="aiLead" rows={2} defaultValue={study?.ai?.lead} />
        </Field>
        <Field label="Items" hint="One per line: name :: what it does.">
          <Textarea
            name="aiItems"
            rows={6}
            defaultValue={pairText(
              (study?.ai?.items ?? []).map((item) => ({
                a: item.label,
                b: item.body,
              })),
            )}
          />
        </Field>
      </Group>

      <Group step="07" title="Results" note="What changed, with the figures.">
        <Field label="Heading">
          <Input
            variant="admin"
            name="resultsHeading"
            defaultValue={study?.results?.heading}
            className="h-10"
          />
        </Field>
        <Field label="Opening paragraph" hint="Wrap a phrase in **stars** to pick it out in green.">
          <Textarea
            name="resultsLead"
            rows={3}
            defaultValue={study?.results?.lead}
          />
        </Field>
        <Field
          label="Points"
          hint="One per line: figure :: what it means. Leave off the figure and the :: for a plain statement."
        >
          <Textarea
            name="resultPoints"
            rows={6}
            defaultValue={(study?.results?.points ?? [])
              .map((point) =>
                point.value ? `${point.value} :: ${point.text}` : point.text,
              )
              .join("\n")}
          />
        </Field>
      </Group>

      <Group
        step="08"
        title="The close"
        note="What people still do, the lesson, and the ask."
      >
        <Field label="What's still human" hint="Wrap a phrase in **stars** to pick it out in green.">
          <Textarea name="human" rows={3} defaultValue={study?.human} />
        </Field>
        <Field label="Picture" hint="Optional. Sits beside the copy.">
          <Input
            variant="admin"
            name="humanImage"
            defaultValue={study?.humanImage}
            placeholder="/casestudy-images/…"
            className="h-10"
          />
        </Field>
        <Field label="Takeaway" hint="The one line worth remembering.">
          <Input
            variant="admin"
            name="takeawayLine"
            defaultValue={study?.takeaway?.line}
            className="h-10"
          />
        </Field>
        <Field label="Takeaway, explained" hint="Wrap a phrase in **stars** to pick it out in green.">
          <Textarea
            name="takeawayBody"
            rows={3}
            defaultValue={study?.takeaway?.body}
          />
        </Field>
        <Field label="Closing call to action">
          <Input
            variant="admin"
            name="cta"
            defaultValue={study?.cta}
            placeholder="Still retyping documents into your system? Let's find where it's leaking."
            className="h-10"
          />
        </Field>
        <Field
          label="Background"
          hint="Optional. Needs a quiet left half — the copy sits there."
        >
          <Input
            variant="admin"
            name="ctaImage"
            defaultValue={study?.ctaImage}
            placeholder="/casestudy-images/…"
            className="h-10"
          />
        </Field>
        <Field label="Tags" hint="One per line.">
          <Textarea
            name="tags"
            rows={3}
            defaultValue={(study?.tags ?? []).join("\n")}
          />
        </Field>
      </Group>
    </form>
  );
}
