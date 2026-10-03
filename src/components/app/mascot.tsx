// The mascot's placeholder (decision 0041; docs/assets.md, row 1): a violet blob with two eyes
// and a smile, drawn in CSS, in the frame the bought mascot takes over. Not an illustration
// by Claude's hand: a shape in the brand colours that keeps the slot warm. It floats 8 px
// over 6 s on marketing and stands still in the app (design note 33, Motion). Decorative:
// hidden from assistive technology.
import { cn } from "cn";

export function MascotPlaceholder({ size = 88, className }: { size?: number; className?: string }) {
  const s = size / 88;
  return (
    <span
      aria-hidden="true"
      data-testid="mascot-placeholder"
      className={cn("relative block shrink-0 bg-[radial-gradient(circle_at_30%_30%,#B8A8FF,#6D4CF5_55%,#3B2AA6)] shadow-glow", className)}
      style={{ width: size, height: size, borderRadius: "40% 60% 55% 45% / 50% 45% 55% 50%" }}
    >
      <span className="absolute rounded-full bg-white" style={{ left: 27 * s, top: 25 * s, width: 7 * s, height: 7 * s, boxShadow: `${27 * s}px 0 0 #fff` }} />
      <span className="absolute box-border border-white" style={{ left: 25 * s, top: 33 * s, width: 38 * s, height: 19 * s, borderWidth: 4 * s, borderTopWidth: 0, borderRadius: `0 0 ${19 * s}px ${19 * s}px` }} />
    </span>
  );
}
