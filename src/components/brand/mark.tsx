// Mark B in design v2 (docs/design-system.md, Identity; Brand07): the two speech marks in a
// violet rounded square, radius 9 of 32. Violet on every ground; white with violet marks on a
// violet surface. The wordmark is Plus Jakarta Sans 800, tracking -0.02em, the ME in violet
// text (violet 300 on dark, through the token).
export function Mark({ size = 32, tone = "violet", className }: { size?: number; tone?: "violet" | "white"; className?: string }) {
  const bg = tone === "violet" ? "#6D4CF5" : "#FFFFFF";
  const fg = tone === "violet" ? "#FFFFFF" : "#6D4CF5";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill={bg} />
      <path d="M7 8.5h8v7H10l-3 2.5z" fill={fg} />
      <path d="M17 11.5h8v7h-5l-3 2.5z" fill="none" stroke={fg} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// Wordmark: 800, tracking -0.02em, the ME in violet text. onInk keeps the marketing use on a
// dark ground where the token is not switched: the ME in violet 300.
export function Wordmark({ onInk = false, className }: { onInk?: boolean; className?: string }) {
  return (
    <span className={className} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
      S<span className={onInk ? "text-[#B8A8FF]" : "text-violet-text"}>ME</span>say
    </span>
  );
}

// Horizontal lockup: mark then wordmark, gap 10 at 24 px text, in the ink of the ground.
export function Lockup({ text = 24, onInk = false }: { text?: number; onInk?: boolean }) {
  return (
    <span className={onInk ? "inline-flex items-center text-[#F3F1FA]" : "inline-flex items-center text-ink"} style={{ gap: Math.round(text * 10 / 24), fontSize: text }}>
      <Mark size={Math.round(text * 32 / 24)} />
      <Wordmark onInk={onInk} />
    </span>
  );
}
