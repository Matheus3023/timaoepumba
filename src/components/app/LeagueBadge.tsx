"use client";

import { useState } from "react";
import { BallIcon } from "@/components/icons";

/** Competition crest (Flashscore's tournament image_path), falling back to a neutral ball glyph. */
export function LeagueBadge({ name, logoUrl, size = 16 }: { name: string; logoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable Flashscore CDN host
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="shrink-0 rounded-sm object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return <BallIcon width={size} height={size} className="shrink-0 text-faint" strokeWidth={1.6} />;
}
