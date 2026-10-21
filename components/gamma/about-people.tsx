import Image from "next/image";

import { SectionHead } from "@/components/gamma/section-head";
import { about, type TeamMember } from "@/lib/content/about";

const { people } = about;
// `as const` narrows photo to the literal paths, which erases the
// initials fallback the moment every listed person has a headshot.
const members: readonly TeamMember[] = people.members;

/**
 * The founders. Two of them, so this is a pair of portraits rather than the
 * carousel it used to be: arrows and a drag rail for two cards that already
 * fit on the screen is furniture with nothing to do, and it kept the whole
 * section on the client for no reason.
 */
export function AboutPeople() {
  return (
    <section className="bg-dark py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          tone="dark"
          eyebrow={people.eyebrow}
          one={people.heading.one}
          two={people.heading.two}
          lead={people.lead}
        />

        {/* Small and centred. Across the full row these are 760px tall
            apiece, which is a poster; left-aligned at this size they look
            like a placeholder with the rest of the row missing. */}
        <ul className="mx-auto mt-[clamp(36px,3.8vw,56px)] grid max-w-[560px] gap-[clamp(18px,2.2vw,32px)] sm:grid-cols-2">
          {members.map((person) => (
            <li key={person.name} className="group">
              {/* No glow over the photograph. Behind the card it smudged the
                  section; inside the frame it sat on the subject as a green
                  blob. The brand colour stays on the frame's own edge. */}
              <div className="border-dark-line relative aspect-[4/5] overflow-hidden rounded-[18px] border transition-[border-color,box-shadow] duration-500 ease-out group-hover:border-brand/40 group-hover:shadow-[0_20px_52px_-26px_rgba(47,232,92,0.4)]">
                {person.photo ? (
                  <Image
                    src={person.photo}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 264px, 92vw"
                    className="object-cover object-top grayscale transition-[filter,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03] group-hover:grayscale-0"
                  />
                ) : (
                  <div className="bg-dark-row absolute inset-0 grid place-items-center">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(236,236,228,0.035)_0_1px,transparent_1px_9px)]"
                    />
                    <span className="text-brand/35 font-display relative text-[34px] leading-none font-bold tracking-[-0.04em]">
                      {person.initials}
                    </span>
                  </div>
                )}

                <span
                  aria-hidden
                  className="group-hover:ring-brand/25 pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-white/[0.06] ring-inset transition-[--tw-ring-color] duration-500 ease-out"
                />
              </div>

              {/* Under the picture rather than on a scrim over it. At this
                  size the name has room to be read rather than survived. */}
              <div className="mt-4">
                <p className="font-display text-dark-head text-[clamp(16px,1.5vw,19px)] leading-[1.15] font-bold tracking-[-0.03em] uppercase">
                  {person.name}
                </p>
                {/* Top-aligned: a two-line role left the rule hanging
                    against the middle of the block. */}
                <p className="t-eyebrow text-brand mt-2.5 flex items-start gap-3 leading-[1.5]">
                  <span
                    aria-hidden
                    className="bg-brand/45 mt-[7px] h-px w-6 shrink-0"
                  />
                  {person.role}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
