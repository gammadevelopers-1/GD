"use client";

import { useEffect, useState } from "react";

/** One entry in the rail. The id is the section it scrolls to. */
export type StorySection = { id: string; label: string };

/** The facts about the engagement, which live in the rail rather than in a
 *  card beside the prose — they are page metadata, and as a card they left a
 *  tall column of nothing under three short rows. */
export type StoryMetaRow = { label: string; value: string };

/** Distance from the top of the viewport at which a section counts as the one
 *  being read. The nav is 72px and the progress bar sits under it, so this
 *  clears both with a little room for the heading itself. */
const DOCKED = 140;

/**
 * The sticky contents rail: where you are in the story, and a way to jump.
 *
 * Scrolling is left to the anchors — `html { scroll-behavior: smooth }` is
 * already set globally and honours prefers-reduced-motion for free — so the
 * only thing this needs JavaScript for is knowing which entry to light up.
 */
export function StoryRail({
  sections,
  meta,
}: {
  sections: readonly StorySection[];
  meta: readonly StoryMetaRow[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  // A string, so the effect does not re-run on every render just because the
  // parent handed it a fresh array with the same contents in it.
  const ids = sections.map((section) => section.id).join(",");

  useEffect(() => {
    const list = ids ? ids.split(",") : [];
    let frame = 0;

    // The last section whose top has passed under the nav is the one being
    // read. An IntersectionObserver answers "is it visible", which on a page
    // mixing tall and short sections leaves several lit at once or none.
    const update = () => {
      frame = 0;
      let current = list[0] ?? "";
      for (const id of list) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= DOCKED) current = id;
      }
      setActive(current);
    };

    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };

    // Through a frame rather than straight away: it lets a #hash landing
    // settle, and keeps the first reading out of the effect body.
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return (
    <aside className="border-line bg-surface sticky top-[104px] hidden max-h-[calc(100dvh-140px)] self-start overflow-y-auto rounded-[16px] border p-5 shadow-[0_18px_44px_-34px_rgba(20,23,26,0.5)] lg:block">
      <nav aria-label="On this page">
        <ol>
          {sections.map((section) => {
            const on = section.id === active;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`group focus-visible:outline-green-ink flex items-center gap-3 rounded-[4px] py-[7px] text-[13.5px] leading-[1.35] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    on
                      ? "text-ink font-semibold"
                      : "text-dim hover:text-ink-soft"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`w-[2px] shrink-0 rounded-full transition-[background-color,height] duration-300 ease-out ${
                      on
                        ? "bg-brand h-[20px]"
                        : "bg-line-strong group-hover:bg-dim h-[12px]"
                    }`}
                  />
                  {section.label}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {meta.length ? (
        <dl className="border-line mt-7 space-y-4 border-t pt-6">
          {meta.map((row) => (
            <div key={row.label}>
              <dt className="t-eyebrow text-dim">{row.label}</dt>
              <dd className="text-ink mt-1.5 text-[13.5px] leading-[1.4] font-medium">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </aside>
  );
}
