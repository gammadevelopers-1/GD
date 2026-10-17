export const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.7 1.7h6.6a5 5 0 0 1 5 5v6.6a5 5 0 0 1-5 5H6.7a5 5 0 0 1-5-5V6.7a5 5 0 0 1 5-5Zm0 1.7a3.3 3.3 0 0 0-3.3 3.3v6.6a3.3 3.3 0 0 0 3.3 3.3h6.6a3.3 3.3 0 0 0 3.3-3.3V6.7a3.3 3.3 0 0 0-3.3-3.3H6.7Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 5.9a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2Zm0 1.7a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z"
      />
      <circle cx="14.4" cy="5.6" r="1.1" />
    </>
  ),
  Facebook: (
    // Authored on a 24 grid, scaled rather than hand-converted, so the curves
    // stay exact against the other glyphs' 20 viewBox.
    <g transform="scale(0.8333)">
      <path d="M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.86v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.02 24 18.06 24 12.07Z" />
    </g>
  ),
  LinkedIn: (
    <path d="M4.98 3.5A1.75 1.75 0 1 1 1.5 3.5a1.75 1.75 0 0 1 3.48 0ZM1.75 7h3.5v10.5h-3.5V7ZM8 7h3.35v1.44h.05c.47-.84 1.6-1.72 3.3-1.72 3.53 0 4.18 2.2 4.18 5.06v5.72h-3.5v-5.07c0-1.21-.02-2.76-1.68-2.76-1.68 0-1.94 1.31-1.94 2.67v5.16H8V7Z" />
  ),
  Calendly: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.6 1a.9.9 0 0 1 .9.9v1.2h7V1.9a.9.9 0 1 1 1.8 0v1.2h.7a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H4a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 4 3.1h.7V1.9A.9.9 0 0 1 5.6 1Zm11.1 7.2H3.3v7.4c0 .4.3.7.7.7h12c.4 0 .7-.3.7-.7V8.2Z"
    />
  ),
};
