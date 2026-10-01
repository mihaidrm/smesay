// Mark B: two speech marks on a shared baseline in a rounded square (docs/design-system.md,
// Identity). Teal on white and greige; white on ink; all white on teal.
export function Mark({ size = 32, tone = "teal", className }: { size?: number; tone?: "teal" | "white"; className?: string }) {
  const bg = tone === "teal" ? "#0E6B63" : "#FFFFFF";
  const fg = tone === "teal" ? "#FFFFFF" : "#0E6B63";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill={bg} />
      <path d="M7 8.5h8v7H10l-3 2.5z" fill={fg} />
      <path d="M17 11.5h8v7h-5l-3 2.5z" fill="none" stroke={fg} strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 25h18" stroke={fg} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Wordmark D: Geist 600, tracking -0.03em, the ME in teal 700 (teal 300 on ink).
export function Wordmark({ onInk = false, className }: { onInk?: boolean; className?: string }) {
  return (
    <span className={className} style={{ fontWeight: 600, letterSpacing: "-0.03em" }}>
      S<span style={{ color: onInk ? "#7FD1C6" : "#0E6B63" }}>ME</span>say
    </span>
  );
}

// Horizontal lockup: mark then wordmark, gap 10 at 24 px text.
export function Lockup({ text = 24, onInk = false }: { text?: number; onInk?: boolean }) {
  return (
    <span className="inline-flex items-center" style={{ gap: Math.round(text * 10 / 24), fontSize: text, color: onInk ? "#FFFFFF" : "#16181C" }}>
      <Mark size={Math.round(text * 32 / 24)} tone={onInk ? "white" : "teal"} />
      <Wordmark onInk={onInk} />
    </span>
  );
}
