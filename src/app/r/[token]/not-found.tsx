// The 404 of a respondent link (stories/E11-6, acceptance 2): in the respondent frame, with no
// PM navigation and no link to projects. Shown for any address below a link that is not one of
// its routes ([...rest]/page.tsx calls notFound()); the link's own page shows its state pages
// instead (unknown, closed, revoked). Convention: node_modules/next/
// dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md. A centered card from
// 576 px, as every respondent page (decision 0052).
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { FRAME_CARD, FRAME_HEADER, FRAME_OUTER } from "@/components/respondent/frame";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

export default function LinkNotFound() {
  return (
    <div className={cn(FRAME_OUTER, "mx-auto w-full max-w-[752px]")} data-testid="link-not-found">
      <div className={FRAME_CARD}>
      <header className={cn("flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3", FRAME_HEADER)}>
        <span className="inline-flex items-center gap-2 text-[15px] font-bold"><Mark size={22} /> SMEsay</span>
      </header>
      <main className="flex w-full grow flex-col gap-4 px-5 pt-6 pb-8 @xl:px-8">
        <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{ERROR_PAGE_COPY.respondentNotFoundTitle}</h1>
        <p className="text-[17px] leading-[26px] text-ink-muted">{ERROR_PAGE_COPY.respondentNotFoundLine}</p>
      </main>
      </div>
    </div>
  );
}
