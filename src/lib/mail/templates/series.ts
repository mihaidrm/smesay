// Emails 11a to 11d of docs/copy/emails.md (stories/E16-2): the getting-started series, one
// email per step, to a person who signed in and has not published a validation, on the shared
// frame. The step says what the person has not done yet; the button opens the place to do it.
// Links carry from=email-[step] so the sign-in goal can be read per step (E13-3).
import { greeting, renderEmail, type Email } from "./layout";

export const SERIES_STEPS = ["start", "import", "share", "last"] as const;
export type SeriesStep = (typeof SERIES_STEPS)[number];
// Days after sign-up at which each step is due (design note 132).
export const SERIES_DAYS: Record<SeriesStep, number> = { start: 1, import: 3, share: 7, last: 14 };

export type SeriesEmailInput = {
  step: SeriesStep;
  name: string | null;
  // The person's workspace, or null while none is named.
  workspaceName: string | null;
  // The person's newest project with a list, or null.
  project: { id: string; name: string } | null;
  origin: string;
  supportEmail: string;
  stop: { reason: string; url: string };
};

const at = (origin: string, path: string, step: SeriesStep) => {
  const u = new URL(path, origin);
  u.searchParams.set("from", `email-${step}`);
  return u.toString();
};

export function seriesEmail(input: SeriesEmailInput): Email {
  const { step, name, workspaceName, project, origin, stop } = input;
  const hi = greeting(name);
  switch (step) {
    case "start":
      return renderEmail({
        origin,
        subject: "Your first validation in ten minutes",
        preheader: "The sample on your Projects page shows what comes back.",
        before: [
          hi,
          { text: workspaceName ? `You signed in to SMEsay yesterday. Your workspace, ${workspaceName}, is ready for its first list.` : "You signed in to SMEsay yesterday. The first step is to name your workspace; it takes a minute." },
          { text: "The quickest way to see what you get back is the sample: a list of seven expense-tool requirements with answers from seven people, on your Projects page. Open it, look at the Results tab, then import a list of your own." },
        ],
        button: { label: "Open SMEsay", url: at(origin, "/app", step) },
        after: [{ text: "Import takes an xlsx or csv, or rows pasted from a sheet. Shape groups and rewrites the items, Build sets the questions, Share sends the link." }],
        stop,
      });
    case "import":
      return renderEmail({
        origin,
        subject: "Three ways to get your list in",
        preheader: "Upload a file, paste from a sheet, or start from the sample.",
        before: [
          hi,
          { text: "Your list can come into SMEsay three ways: upload an xlsx or csv and pick the header row and the columns on screen; paste rows straight from a sheet; or open the sample's seven items and replace them with yours. Up to 2,000 rows and 5 MB." },
          { text: "Once the list is in, Shape groups it into areas and rewrites each item in plain words, with the original kept beside it." },
        ],
        button: { label: "Import your list", url: at(origin, project ? `/app/projects/${project.id}/import` : "/app/projects/new", step) },
        stop,
      });
    case "share":
      return renderEmail({
        origin,
        subject: project ? `Send ${project.name} to three people` : "Send your list to three people",
        preheader: "One public link, or personal links by email, and a close date.",
        before: [
          hi,
          { text: `${project ? project.name : "Your list"} is in SMEsay and nobody has answered yet. Share sends it out: one public link for anyone, or personal links by email so you see who has submitted. Remind sends a reminder with one button, at most once every three days, and a close date ends it.` },
          { text: "Three people are enough to see where the list is unclear." },
        ],
        button: { label: "Share it", url: at(origin, project ? `/app/projects/${project.id}/share` : "/app", step) },
        stop,
      });
    case "last":
      return renderEmail({
        origin,
        subject: "What got in the way?",
        preheader: "Reply to this email; it reaches the people who build SMEsay.",
        before: [
          hi,
          { text: "Two weeks ago you signed in to SMEsay and no validation went out. If something got in the way, reply to this email and say what; it reaches the people who build SMEsay." },
          { text: "If SMEsay is not for you, ignore this. It is the last email of this kind." },
        ],
        stop,
      });
  }
}
