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

export function TeamAvatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white/90 ${paletteFor(name)}`}
      style={{ width: size, height: size }}
    >
      {initialsFor(name)}
    </div>
  );
}
