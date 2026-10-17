export const book = {
  eyebrow: "Book a call",
  title: { one: "Thirty minutes.", two: "You keep the findings." },
  lead: "Pick a time below. No prep, no slides, and no pitch — you talk us through how work moves today, and we tell you straight whether there is anything here worth automating.",
  steps: [
    {
      title: "You walk us through the work",
      body: "How a job moves from first contact to done today, tool by tool, including the steps nobody documented.",
    },
    {
      title: "We point at the leaks",
      body: "Where the hours and the leads are going, with the arithmetic attached, so you see the cost before deciding anything.",
    },
    {
      title: "You leave with the picture",
      body: "Whether an audit is worth it and what the first project would be. We say so plainly if there isn’t one.",
    },
  ],
  fallback: "Prefer email? Write to us and we reply within one business day:",
} as const;
