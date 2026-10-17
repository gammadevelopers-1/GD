/** Design space for the hero AI-OS composition. Scaled to cover the hero. */
export const STAGE = { w: 1320, h: 780 };
export const CORE = { x: 880, y: 380, size: 150 };

export type PanelKind =
  | "search"
  | "lines"
  | "player"
  | "grid"
  | "chat"
  | "wave"
  | "avatars"
  | "chart"
  | "toggle"
  | "doc";

export type PanelIcon =
  | "search"
  | "calendar"
  | "play"
  | "grid"
  | "chat"
  | "voice"
  | "users"
  | "chart"
  | "doc"
  | "power";

export type Panel = {
  id: string;
  kind: PanelKind;
  /** Names the operation, so the panel is not just a skeleton. */
  label: string;
  icon: PanelIcon;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Layer depth: 0 sits behind the core, 1 in front. */
  front?: boolean;
  /** Dropped below 1280px — the composition thins rather than shrinks. */
  wide?: boolean;
  /** Idle float period. */
  beat: number;
};

/** Panels overlap deliberately, like stacked glass over the scene. */
export const PANELS: Panel[] = [
  {
    id: "search",
    kind: "search",
    label: "New enquiries",
    icon: "search",
    x: 706,
    y: 150,
    w: 300,
    h: 82,
    beat: 6.2,
  },
  {
    id: "chat",
    kind: "chat",
    label: "Chat replies",
    icon: "chat",
    x: 1060,
    y: 232,
    w: 214,
    h: 96,
    front: true,
    beat: 7.1,
  },
  {
    id: "wave",
    kind: "wave",
    label: "Voice agent",
    icon: "voice",
    x: 1046,
    y: 108,
    w: 196,
    h: 86,
    wide: true,
    beat: 5.8,
  },
  {
    id: "avatars",
    kind: "avatars",
    label: "Old contacts",
    icon: "users",
    x: 1074,
    y: 384,
    w: 208,
    h: 100,
    beat: 6.6,
  },
  {
    id: "chart",
    kind: "chart",
    label: "Reporting",
    icon: "chart",
    x: 984,
    y: 522,
    w: 186,
    h: 104,
    front: true,
    beat: 7.4,
  },
  {
    id: "grid",
    kind: "grid",
    label: "Content",
    icon: "grid",
    x: 508,
    y: 470,
    w: 208,
    h: 116,
    wide: true,
    beat: 6.9,
  },
  {
    id: "doc",
    kind: "doc",
    label: "Invoices",
    icon: "doc",
    x: 736,
    y: 512,
    w: 178,
    h: 118,
    beat: 5.6,
  },
  {
    id: "player",
    kind: "player",
    label: "Follow-ups",
    icon: "play",
    x: 546,
    y: 246,
    w: 214,
    h: 104,
    front: true,
    beat: 6.4,
  },
  {
    id: "lines",
    kind: "lines",
    label: "Bookings",
    icon: "calendar",
    x: 512,
    y: 106,
    w: 170,
    h: 90,
    wide: true,
    beat: 7.8,
  },
  {
    id: "toggle",
    kind: "toggle",
    label: "Always on",
    icon: "power",
    x: 828,
    y: 636,
    w: 196,
    h: 78,
    wide: true,
    beat: 6.1,
  },
];

/** Core edge → panel edge. Kept short; the panels do the talking. */
export function branch(p: Panel) {
  const px = p.x + p.w / 2;
  const py = p.y + p.h / 2;
  const a = Math.atan2(py - CORE.y, px - CORE.x);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const r = CORE.size / 2 + 4;
  const fx = r2(CORE.x + r * Math.cos(a));
  const fy = r2(CORE.y + r * Math.sin(a));
  const cx = r2((fx + px) / 2 - Math.sin(a) * 26);
  const cy = r2((fy + py) / 2 + Math.cos(a) * 26);
  return `M ${fx} ${fy} Q ${cx} ${cy}, ${r2(px)} ${r2(py)}`;
}
