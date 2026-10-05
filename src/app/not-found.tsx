// 404 (stories/E11-6, acceptance 1; stories/E11-7; docs/copy/errors.md): shown by notFound()
// anywhere outside a respondent link, including the switch action's refusal of a workspace id
// that is not one of the person's memberships (stories/E2-3, acceptance 4), the admin area for
// anyone who is not an admin (E14-1: the same page, nothing that says admin), and for an
// unknown address. Convention: node_modules/next/dist/docs/01-app/03-api-reference/03-file-
// conventions/not-found.md. The page is the landing hero's night (navy, the aurora, the dot
// grid, the cursor light of src/app/landing-page/cursor-light.tsx) whatever the app's mode,
// with the lights-off scene of src/components/not-found/
// lost-page.tsx; the title, the line and "Go to your projects" are E11-6's words.
import Link from "next/link";
import { Lockup } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { LostPage } from "@/components/not-found/lost-page";
import { CursorLight } from "@/app/landing-page/cursor-light";
import { BackButton } from "@/components/not-found/back-button";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";

const NAVY = "#16152A";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden text-[#F3F1FA]" style={{ background: NAVY }}>
      <div aria-hidden="true" className="pointer-events-none absolute -top-[260px] -left-[200px] size-[900px] rounded-full bg-[radial-gradient(circle,rgba(109,76,245,0.40),rgba(109,76,245,0)_62%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-[160px] -bottom-[200px] size-[760px] rounded-full bg-[radial-gradient(circle,rgba(255,107,87,0.26),rgba(255,107,87,0)_60%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <CursorLight restX={360} restY={360} />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-8 px-5 py-8 md:px-8 lg:py-10">
        <Lockup text={18} onInk />
        <div className="flex flex-1 flex-col justify-center">
          <LostPage>
            <h1 className="text-[32px] leading-9 font-extrabold tracking-[-0.035em] md:text-[44px] md:leading-[48px]">{ERROR_PAGE_COPY.notFoundTitle}</h1>
            <p className="text-[17px] leading-[26px] text-[#C9C4E0]">{ERROR_PAGE_COPY.notFoundLine}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/app" className={buttonVariants({ variant: "primary", className: "h-[50px] px-[26px] text-[16px] focus-visible:ring-offset-[#16152A]!" })}>{ERROR_PAGE_COPY.goToProjects}</Link>
              <BackButton />
            </div>
          </LostPage>
        </div>
      </div>
    </main>
  );
}
