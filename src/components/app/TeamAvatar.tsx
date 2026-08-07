"use client";

import { useState } from "react";

const PALETTES = [
  "from-emerald-500 to-emerald-700",
  "from-yellow-400 to-amber-600",
  "from-sky-500 to-blue-700",
  "from-rose-500 to-red-700",
  "from-violet-500 to-purple-700",
  "from-orange-400 to-orange-700",
];

function paletteFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/** Renders the real team crest when available (Flashscore's small_image_path), falling back to a colored-initials avatar if there's no logo or it fails to load. */
export function TeamAvatar({ name, logoUrl, size = 28 }: { name: string; logoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable Flashscore CDN host; not worth next/image remote-pattern config for a small badge icon
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-surface object-contain ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white/90 ${paletteFor(name)}`}
      style={{ width: size, height: size }}
    >
      {initialsFor(name)}
    </div>
  );
}
