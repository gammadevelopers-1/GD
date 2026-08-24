"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { bookAudit } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const FACT_ICONS = [Clock, CalendarDays, MapPin];

const FIELD =
  "h-11 w-full rounded-xl border border-black/[0.12] bg-[#fbfbf8] px-3.25 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-gd-green focus:shadow-[0_0_0_3px_rgba(22,163,74,0.16)]";
const FIELD_LABEL = "mb-1.5 block text-xs text-[#6d736a]";

function isSameDay(a: Date, b: Date) {
  return a.getTime() === b.getTime();
}

const keepStill = () => () => {};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function useToday() {
  const key = useSyncExternalStore(keepStill, todayKey, () => null);

  return useMemo(() => {
    if (!key) return null;
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month, day);
  }, [key]);
}

export function BookAuditSection() {
  const today = useToday();
  const [offset, setOffset] = useState(0);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [stage, setStage] = useState<"picker" | "form" | "done">("picker");

  const shown = useMemo(
    () =>
      today
        ? new Date(today.getFullYear(), today.getMonth() + offset, 1)
        : null,
    [today, offset],
  );

  function pickTime(slot: string) {
    setTime(slot);
    setStage("form");
  }

  function reset() {
    setDate(null);
    setTime(null);
    setStage("picker");
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStage("done");
  }

  const when = date
    ? `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()} · ${time} PKT`
    : "—";

  const slotLabel = date
    ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]}, ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`
    : bookAudit.picker.prompt;

  return (
    <section
      id="book-audit"
      className="relative scroll-mt-[90px] overflow-hidden border-t border-black/[0.06] py-26 [background:radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(47,232,92,0.07),transparent_62%),linear-gradient(180deg,#f4f4ee,#eef1ea)]"
    >
      <div className="mx-auto max-w-[1120px] px-5 md:px-6.5">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[600px]">
            <span className="shimmer-label mb-4.5 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] uppercase">
              <span className="bg-brand size-1.5 rounded-full shadow-[0_0_9px_rgba(47,232,92,0.6)]" />
              {bookAudit.eyebrow}
            </span>
            <h2 className="font-display text-[clamp(30px,4.2vw,52px)] leading-none font-semibold tracking-[-0.04em] whitespace-pre-line">
              {bookAudit.title}
            </h2>
            <p className="mt-4 text-[16.5px] leading-[1.6] text-[#4b5148]">
              {bookAudit.body}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="grid overflow-hidden rounded-[24px] border border-black/[0.08] bg-white shadow-[0_40px_90px_-46px_rgba(16,24,40,0.34)] lg:grid-cols-[0.82fr_1.18fr]">
            <Brief />

            <div className="p-7.5 sm:px-8">
              {stage === "picker" ? (
                <div>
                  <div className="mb-4.5 flex items-center justify-between">
                    <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">
                      {bookAudit.picker.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <MonthStep
                        label="Previous month"
                        disabled={offset === 0}
                        onClick={() => setOffset(offset - 1)}
                      />
                      <span className="min-w-[118px] text-center text-[13.5px] font-semibold tabular-nums">
                        {shown
                          ? `${MONTHS[shown.getMonth()]} ${shown.getFullYear()}`
                          : "—"}
                      </span>
                      <MonthStep
                        label="Next month"
                        forward
                        onClick={() => setOffset(offset + 1)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5.5 sm:grid-cols-[1.15fr_1fr]">
                    <div>
                      <div className="mb-1.5 grid grid-cols-7 gap-0.75">
                        {WEEKDAYS.map((day, index) => (
                          <span
                            key={`${day}-${index}`}
                            className="text-center font-mono text-[10px] text-[#9aa096]"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-0.75">
                        {today && shown
                          ? buildMonth(
                              shown.getFullYear(),
                              shown.getMonth(),
                            ).map((cell, index) =>
                              cell ? (
                                <DayCell
                                  key={cell.getTime()}
                                  day={cell}
                                  today={today}
                                  selected={
                                    date !== null && isSameDay(date, cell)
                                  }
                                  onPick={() => {
                                    setDate(cell);
                                    setTime(null);
                                  }}
                                />
                              ) : (
                                <span key={`pad-${index}`} />
                              ),
                            )
                          : null}
                      </div>
                    </div>

                    <div className="flex min-h-[230px] flex-col sm:border-l sm:border-black/[0.07] sm:pl-5">
                      <p className="mb-3 text-xs text-[#6d736a]">{slotLabel}</p>
                      <div className="flex max-h-[230px] flex-col gap-2 overflow-auto">
                        {date
                          ? bookAudit.picker.slots.map((slot) => (
                              <Button
                                variant="bare"
                                size="none"
                                key={slot}
                                type="button"
                                onClick={() => pickTime(slot)}
                                className="hover:border-brand focus-visible:ring-gd-green/40 h-10 cursor-pointer rounded-[11px] border border-black/[0.12] bg-white text-[13.5px] font-semibold transition-all duration-150 hover:text-[#0a7a45] focus-visible:ring-2 focus-visible:outline-none"
                              >
                                {slot}
                              </Button>
                            ))
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {stage === "form" ? (
                <form onSubmit={confirm} className="flex flex-col gap-3.5">
                  <Button
                    variant="bare"
                    size="none"
                    type="button"
                    onClick={() => setStage("picker")}
                    className="hover:text-gd-green-ink focus-visible:ring-gd-green/40 inline-flex cursor-pointer items-center gap-1.5 self-start rounded-md text-[12.5px] font-semibold text-[#0a7a45] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <ArrowLeft className="size-3.5" />
                    {bookAudit.form.back}
                  </Button>

                  <div className="flex items-center gap-2.5 rounded-[13px] border border-[rgba(47,232,92,0.28)] bg-[#f2f6f0] px-3.75 py-3.25">
                    <span className="text-brand grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[#0f1512]">
                      <CalendarDays className="size-4.25" strokeWidth={1.5} />
                    </span>
                    <div className="leading-[1.35]">
                      <p className="text-sm font-semibold">{when}</p>
                      <p className="text-xs text-[#6d736a]">
                        {bookAudit.form.summary}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={FIELD_LABEL}>
                        {bookAudit.form.name.label}
                      </span>
                      <Input
                        variant="bare"
                        required
                        name="name"
                        placeholder={bookAudit.form.name.placeholder}
                        className={FIELD}
                      />
                    </label>
                    <label className="block">
                      <span className={FIELD_LABEL}>
                        {bookAudit.form.email.label}
                      </span>
                      <Input
                        variant="bare"
                        required
                        type="email"
                        name="email"
                        placeholder={bookAudit.form.email.placeholder}
                        className={FIELD}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className={FIELD_LABEL}>
                      {bookAudit.form.note.label}{" "}
                      <span className="text-[#9aa096]">
                        {bookAudit.form.note.hint}
                      </span>
                    </span>
                    <Textarea
                      rows={2}
                      name="note"
                      placeholder={bookAudit.form.note.placeholder}
                      variant="bare"
                      className={cn(FIELD, "h-auto resize-y py-2.75")}
                    />
                  </label>

                  <Button
                    variant="marketing"
                    size="marketing"
                    type="submit"
                    data-button-fill
                    className="w-full cursor-pointer"
                  >
                    <span className="button-fill-fx__label">
                      {bookAudit.form.cta}
                    </span>
                  </Button>
                </form>
              ) : null}

              {stage === "done" ? (
                <div className="flex flex-col items-center px-5 py-9.5 text-center">
                  <span className="mb-4.5 grid size-15.5 place-items-center rounded-full bg-[#eef6f0] text-[#0a7a45]">
                    <Check className="size-7.5" strokeWidth={1.8} />
                  </span>
                  <h3 className="font-display mb-2 text-[22px] font-semibold tracking-[-0.02em]">
                    {bookAudit.done.title}
                  </h3>
                  <p className="mb-5 max-w-[38ch] text-sm leading-[1.6] text-[#4b5148]">
                    Your {bookAudit.brief.kind} is set for {when}. A calendar
                    invite and Google Meet link are on their way to your inbox.
                  </p>
                  <Button
                    variant="bare"
                    size="none"
                    type="button"
                    onClick={reset}
                    className="hover:border-brand focus-visible:ring-gd-green/40 h-10.5 cursor-pointer rounded-[11px] border border-black/[0.12] bg-white px-5 text-[13px] font-semibold transition-all duration-150 hover:text-[#0a7a45] focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {bookAudit.done.cta}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();

  return [
    ...Array.from({ length: pad }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ];
}

function DayCell({
  day,
  today,
  selected,
  onPick,
}: {
  day: Date;
  today: Date;
  selected: boolean;
  onPick: () => void;
}) {
  const open = day >= today && day.getDay() !== 0;

  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      disabled={!open}
      onClick={onPick}
      className={cn(
        "focus-visible:ring-gd-green/40 grid aspect-square place-items-center rounded-[10px] border text-[13px] font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none",
        selected
          ? "border-brand bg-brand text-[#0f1512]"
          : open
            ? "cursor-pointer border-transparent bg-[#f2f6f0] hover:border-[rgba(47,232,92,0.5)] hover:bg-[#e2f4e6]"
            : "border-transparent bg-transparent text-black/[0.28]",
      )}
    >
      {day.getDate()}
    </Button>
  );
}

function MonthStep({
  label,
  forward = false,
  disabled = false,
  onClick,
}: {
  label: string;
  forward?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="bare"
      size="none"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="hover:border-brand focus-visible:ring-gd-green/40 grid size-7.5 cursor-pointer place-items-center rounded-[9px] border border-black/[0.1] bg-white text-[#4b5148] transition-all duration-150 hover:text-[#0a7a45] focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-35 disabled:hover:border-black/[0.1] disabled:hover:text-[#4b5148]"
    >
      <ArrowLeft className={cn("size-3.75", forward && "rotate-180")} />
    </Button>
  );
}

function Brief() {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#0f1512,#0a1f14)] p-8 text-[#eceae2]">
      <span
        aria-hidden
        className="absolute -top-[30%] -right-[25%] h-[70%] w-[80%] rounded-full bg-[rgba(47,232,92,0.2)] blur-[70px]"
      />

      <div className="relative">
        <div className="flex items-center gap-2.75">
          <span className="bg-gd-panel-dark text-brand grid size-11 place-items-center rounded-[13px] border border-[rgba(47,232,92,0.3)] font-mono text-sm font-semibold">
            GD
          </span>
          <div className="leading-[1.3]">
            <p className="text-[13px] text-[#9aa096]">{bookAudit.brief.org}</p>
            <p className="text-[15px] font-semibold">{bookAudit.brief.kind}</p>
          </div>
        </div>

        <h3 className="font-display mt-6 mb-1.5 text-2xl font-semibold tracking-[-0.03em]">
          {bookAudit.brief.title}
        </h3>

        <div className="mb-6 flex flex-wrap gap-2">
          {bookAudit.brief.facts.map((fact, index) => {
            const Icon = FACT_ICONS[index] ?? Clock;
            return (
              <span
                key={fact}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.75 py-1.25 text-xs text-[#c8ccc2]"
              >
                <Icon className="size-3.25" strokeWidth={1.5} />
                {fact}
              </span>
            );
          })}
        </div>

        <ul className="flex flex-col gap-3.25">
          {bookAudit.brief.promises.map((promise) => (
            <li key={promise} className="flex items-start gap-2.75">
              <span className="text-brand mt-px grid size-5.5 shrink-0 place-items-center rounded-md bg-[rgba(47,232,92,0.14)]">
                <Check className="size-2.75" strokeWidth={2.4} />
              </span>
              <span className="text-[13.5px] leading-[1.5] text-[#c8ccc2]">
                {promise}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6.5 flex items-center gap-2.75 border-t border-white/[0.09] pt-5">
          <span className="bg-brand grid size-10 place-items-center rounded-full font-mono text-[13px] font-semibold text-[#0f1512]">
            {bookAudit.brief.host.initials}
          </span>
          <div className="leading-[1.35]">
            <p className="text-[13.5px] font-semibold">
              {bookAudit.brief.host.name}
            </p>
            <p className="text-xs text-[#9aa096]">
              {bookAudit.brief.host.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
