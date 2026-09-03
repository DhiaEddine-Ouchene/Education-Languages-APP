"use client";

import { useId } from "react";
import type { SVGProps } from "react";

/**
 * LingoKit brand mark — the official purple speech-bubble "L" logo.
 *
 * This is the exact artwork shipped in `app/icon.svg` (the favicon), rendered
 * inline so every logo usage across the app stays pixel-identical. Brand colors
 * are fixed (not `currentColor`), so the mark stays on-brand in light and dark
 * mode. Size it with `className` (e.g. `h-6 w-6`) — it stays crisp at any scale.
 *
 * Gradient/filter IDs are namespaced per instance via `useId` so multiple marks
 * on the same page (e.g. Navbar + Footer) never collide on `url(#…)` references.
 */
export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  // useId() emits colons (":r0:") which break inside url(#…) references; strip them.
  const uid = useId().replace(/:/g, "");
  const bubble = `${uid}-bubble`;
  const letter = `${uid}-letter`;
  const shadow = `${uid}-shadow`;

  return (
    <svg
      viewBox="0 0 1024 1024"
      width="24"
      height="24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <radialGradient
          id={bubble}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(720 145) rotate(128) scale(900 860)"
        >
          <stop offset="0" stopColor="#AAA4FF" />
          <stop offset="0.28" stopColor="#7F77DD" />
          <stop offset="0.70" stopColor="#4D42C9" />
          <stop offset="1" stopColor="#3325AA" />
        </radialGradient>

        <linearGradient
          id={letter}
          x1="0"
          y1="220"
          x2="0"
          y2="720"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F4F3FF" />
        </linearGradient>

        <filter id={shadow} x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
          <feOffset dy="8" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main speech bubble */}
      <path
        filter={`url(#${shadow})`}
        fill={`url(#${bubble})`}
        d="M210 72 H782 C879 72 944 137 944 234 V648 C944 745 879 810 782 810 H372 L153 934 C130 947 110 925 121 901 L168 800 C105 770 72 715 72 648 V234 C72 137 113 72 210 72 Z"
      />

      {/* Bold rounded L */}
      <path
        fill={`url(#${letter})`}
        d="M391 248 C391 216 414 193 446 193 C478 193 501 216 501 248 V590 H689 C721 590 744 613 744 645 C744 677 721 700 689 700 H446 C414 700 391 677 391 645 V248 Z"
      />
    </svg>
  );
}
