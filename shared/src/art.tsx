// Original illustrations for the Basma system. Flat geometry, brand colours, no external assets.

export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="15" fill="#58CC02" />
      <path d="M24 37V22" stroke="#183A00" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M24 24c-1-6.5-6.4-9.6-12-8.7.6 6.2 5.8 9.6 12 8.7Z" fill="#DBF6C4" />
      <path d="M24 21c1.2-7.4 7.2-11 13.4-9.9-.7 7-6.6 10.9-13.4 9.9Z" fill="#fff" />
      <circle cx="31" cy="15.8" r="1.4" fill="#183A00" />
    </svg>
  )
}

/** The sprout: a friendly seedling that greets people across the platform. */
export function Sprout({ className, mood = "happy" }: { className?: string; mood?: "happy" | "wave" | "think" }) {
  return (
    <svg className={className} viewBox="0 0 220 200" aria-hidden="true">
      <ellipse cx="110" cy="184" rx="62" ry="10" fill="#202B3C" opacity="0.12" />
      <path d="M62 128h96l-10 50a8 8 0 0 1-8 6H80a8 8 0 0 1-8-6l-10-50Z" fill="#FF6B81" />
      <path d="M56 118h108a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H56a6 6 0 0 1-6-6v-6a6 6 0 0 1 6-6Z" fill="#F04D66" />
      <path d="M110 120V84" stroke="#3D9100" strokeWidth="8" strokeLinecap="round" />
      <path d="M108 92C100 62 72 50 46 58c6 28 34 42 62 34Z" fill="#58CC02" />
      <path d="M112 84c8-34 40-48 70-38-6 32-38 48-70 38Z" fill="#7BDB33" />
      <circle cx="94" cy="152" r="5" fill="#202B3C" />
      <circle cx="126" cy="152" r="5" fill="#202B3C" />
      <circle cx="96" cy="150" r="1.6" fill="#fff" />
      <circle cx="128" cy="150" r="1.6" fill="#fff" />
      {mood === "think"
        ? <path d="M102 168h16" stroke="#202B3C" strokeWidth="4" strokeLinecap="round" />
        : <path d="M100 164c6 7 14 7 20 0" stroke="#202B3C" strokeWidth="4" strokeLinecap="round" fill="none" />}
      <circle cx="84" cy="162" r="5" fill="#FFB3C0" />
      <circle cx="136" cy="162" r="5" fill="#FFB3C0" />
      {mood === "wave" ? <path d="M172 112c8-6 14-16 12-26" stroke="#F04D66" strokeWidth="8" strokeLinecap="round" fill="none" /> : null}
      <path d="M186 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#FFC800" />
      <path d="M36 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#1CB0F6" />
    </svg>
  )
}

type Scene = "inbox" | "books" | "people" | "calendar" | "search" | "error" | "live" | "chart" | "ticket"

/** Small scenes for empty and error states. */
export function EmptyArt({ scene = "inbox" }: { scene?: Scene }) {
  return (
    <svg className="art" viewBox="0 0 160 120" aria-hidden="true">
      <ellipse cx="80" cy="110" rx="56" ry="7" fill="#202B3C" opacity="0.08" />
      {scene === "books" ? (
        <g>
          <rect x="34" y="34" width="22" height="70" rx="5" fill="#58CC02" />
          <rect x="58" y="24" width="24" height="80" rx="5" fill="#1CB0F6" />
          <rect x="84" y="40" width="20" height="64" rx="5" fill="#FFC800" />
          <rect x="102" y="44" width="20" height="62" rx="5" fill="#A78BFA" transform="rotate(12 112 75)" />
          <path d="M40 50h10M64 40h12M89 56h10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>
      ) : scene === "people" ? (
        <g>
          <circle cx="58" cy="50" r="15" fill="#FFC800" />
          <path d="M30 100c2-20 14-30 28-30s26 10 28 30Z" fill="#1CB0F6" />
          <circle cx="104" cy="56" r="12" fill="#FF6B81" />
          <path d="M82 100c2-16 11-24 22-24s20 8 22 24Z" fill="#58CC02" />
        </g>
      ) : scene === "calendar" ? (
        <g>
          <rect x="36" y="26" width="88" height="78" rx="14" fill="#fff" stroke="#E3E8F1" strokeWidth="3" />
          <path d="M36 40a14 14 0 0 1 14-14h60a14 14 0 0 1 14 14v8H36Z" fill="#FF6B81" />
          <path d="M58 18v16M102 18v16" stroke="#202B3C" strokeWidth="5" strokeLinecap="round" />
          <rect x="52" y="60" width="14" height="12" rx="4" fill="#E3E8F1" /><rect x="74" y="60" width="14" height="12" rx="4" fill="#58CC02" /><rect x="96" y="60" width="14" height="12" rx="4" fill="#E3E8F1" />
          <rect x="52" y="80" width="14" height="12" rx="4" fill="#E3E8F1" /><rect x="74" y="80" width="14" height="12" rx="4" fill="#E3E8F1" />
        </g>
      ) : scene === "search" ? (
        <g>
          <circle cx="72" cy="56" r="28" fill="#E8F7FE" stroke="#1CB0F6" strokeWidth="8" />
          <path d="M92 76l20 20" stroke="#202B3C" strokeWidth="10" strokeLinecap="round" />
          <path d="M62 50c3-6 9-8 15-6" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        </g>
      ) : scene === "error" ? (
        <g>
          <path d="M80 18l52 88H28Z" fill="#FFC800" stroke="#E5B000" strokeWidth="4" strokeLinejoin="round" />
          <path d="M80 50v26" stroke="#202B3C" strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="90" r="5" fill="#202B3C" />
        </g>
      ) : scene === "live" ? (
        <g>
          <rect x="26" y="30" width="80" height="62" rx="14" fill="#2A374C" />
          <path d="M106 52l28-16v50l-28-16Z" fill="#FF6B81" />
          <circle cx="66" cy="56" r="12" fill="#58CC02" />
          <path d="M46 84c4-10 12-14 20-14s16 4 20 14" fill="#58CC02" />
        </g>
      ) : scene === "chart" ? (
        <g>
          <rect x="34" y="62" width="18" height="42" rx="5" fill="#1CB0F6" />
          <rect x="60" y="40" width="18" height="64" rx="5" fill="#58CC02" />
          <rect x="86" y="52" width="18" height="52" rx="5" fill="#FFC800" />
          <rect x="112" y="28" width="18" height="76" rx="5" fill="#A78BFA" />
        </g>
      ) : scene === "ticket" ? (
        <g>
          <path d="M30 40h100v14a10 10 0 0 0 0 20v14H30V74a10 10 0 0 0 0-20Z" fill="#FFC800" />
          <path d="M96 42v44" stroke="#fff" strokeWidth="4" strokeDasharray="6 6" />
          <path d="M44 58h36M44 70h24" stroke="#7A5A00" strokeWidth="5" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M30 60l16-30h68l16 30v38a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8Z" fill="#fff" stroke="#E3E8F1" strokeWidth="3" />
          <path d="M30 60h32l6 12h24l6-12h32" fill="none" stroke="#1CB0F6" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="118" cy="26" r="9" fill="#58CC02" />
          <path d="M114 26l3 3 5-6" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

/** Scene on the sign-in screen. */
export function AuthScene() {
  return (
    <svg className="scene" viewBox="0 0 440 300" aria-hidden="true">
      <circle cx="220" cy="150" r="128" fill="#fff" opacity="0.14" />
      <rect x="84" y="62" width="272" height="176" rx="24" fill="#fff" />
      <rect x="104" y="84" width="112" height="10" rx="5" fill="#E3E8F1" />
      <rect x="104" y="104" width="76" height="10" rx="5" fill="#E3E8F1" />
      <rect x="104" y="136" width="64" height="80" rx="12" fill="#1CB0F6" />
      <rect x="178" y="160" width="64" height="56" rx="12" fill="#FFC800" />
      <rect x="252" y="118" width="84" height="98" rx="12" fill="#58CC02" />
      <path d="M268 170l14 14 26-30" stroke="#183A00" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="350" cy="70" r="26" fill="#FF6B81" />
      <path d="M340 70h20M350 60v20" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path d="M60 230l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="#FFC800" />
      <path d="M388 196l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#fff" />
      <circle cx="70" cy="110" r="10" fill="#A78BFA" />
    </svg>
  )
}

const covers = [
  ["#58CC02", "#DBF6C4", "#3D9100"],
  ["#1CB0F6", "#C9EDFD", "#0B7BB2"],
  ["#FFC800", "#FFF8DB", "#E5B000"],
  ["#FF6B81", "#FFEEF1", "#F04D66"],
  ["#A78BFA", "#F4F0FF", "#8B6CF0"],
]

/** Generated cover for course and exam tiles. Deterministic from the title, so a course keeps its look. */
export function Cover({ seed }: { seed: string }) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const [solid, wash, deep] = covers[hash % covers.length]
  const shape = (hash >> 4) % 3
  const x = 40 + (hash % 120)
  return (
    <svg className="cover" viewBox="0 0 320 132" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="132" fill={wash} />
      <circle cx={x + 160} cy="10" r="70" fill={solid} opacity="0.35" />
      {shape === 0 ? (
        <g>
          <rect x={x} y="34" width="62" height="78" rx="10" fill={solid} />
          <rect x={x + 18} y="46" width="62" height="78" rx="10" fill={deep} />
          <path d={`M${x + 32} 70h34M${x + 32} 84h22`} stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        </g>
      ) : shape === 1 ? (
        <g>
          <circle cx={x + 40} cy="76" r="38" fill={solid} />
          <path d={`M${x + 22} 76l12 12 24-26`} stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          <path d={`M${x} 112l40-72 40 72Z`} fill={solid} />
          <circle cx={x + 96} cy="62" r="22" fill={deep} />
        </g>
      )}
      <path d="M26 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#fff" opacity="0.9" />
    </svg>
  )
}
