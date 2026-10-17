import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The GAMMA wordmark from the supplied logo suite.
 *
 * Both files are cropped to the artwork -- 421x75, no transparent padding --
 * so a caller only ever sets a height and the width follows. The two variants
 * share an identical bounding box, which is what lets the sticky nav cross-fade
 * between them without anything shifting.
 *
 * `tone` names the colour of the letters, not the surface behind them:
 *   light -> cream letters, for dark surfaces
 *   dark  -> near-black letters, for light surfaces
 *
 * The green G is the same in both.
 */
const SOURCES = {
  light: "/gd-logo-light.png",
  dark: "/gd-logo-dark.png",
} as const;

export function BrandLogo({
  tone = "dark",
  className,
  priority,
  alt = "",
}: {
  tone?: keyof typeof SOURCES;
  className?: string;
  priority?: boolean;
  /** Empty by default: these sit inside links that already carry a label. */
  alt?: string;
}) {
  return (
    <Image
      src={SOURCES[tone]}
      alt={alt}
      width={421}
      height={75}
      priority={priority}
      className={cn("h-[22px] w-auto", className)}
    />
  );
}
