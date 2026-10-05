// Any address below a respondent link that is not one of its routes shows the link's own 404
// (stories/E11-6, acceptance 2) instead of the PM side's. A catch-all segment matches every
// subsequent segment (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// dynamic-routes.md, "Catch-all Segments"); that the named routes beside it (answers, start,
// state, submit, wrap) keep their requests is not stated there and is unverified in the docs,
// so the respondent e2e specs and e2e/error-pages.spec.ts show it.
import { notFound } from "next/navigation";

export default function Unknown(): never {
  notFound();
}
