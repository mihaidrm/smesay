// Writes the filled emails to docs/design-notes/prototype-01/email-[name].html (stories/E12-3,
// acceptance 3), so they open in a browser without sending. With --send ADDRESS it also sends
// each one through MAIL_SMTP_URL (Mailpit locally), from where Mihai releases them to his own
// inbox to check Gmail, Outlook web and Apple Mail. The files are always rendered on
// http://localhost:3000, so they match what the unit test checks; --origin changes only what is
// sent (a mail client shows the mark only once that address is public).
//   npm run email:samples
//   npm run email:samples -- --send you@example.com --origin https://smesay.app
import { writeFileSync } from "node:fs";
import { sendMail } from "../src/lib/mail";
import { SAMPLE_NAMES, SAMPLE_ORIGIN, sampleEmails } from "../src/lib/mail/templates/samples";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} needs a value.`);
  return value;
}

async function main() {
  const to = arg("--send");
  const origin = arg("--origin") ?? SAMPLE_ORIGIN;
  const files = sampleEmails(SAMPLE_ORIGIN);
  const sent = sampleEmails(origin);
  for (const name of SAMPLE_NAMES) {
    const path = `docs/design-notes/prototype-01/email-${name}.html`;
    writeFileSync(path, files[name].html + "\n");
    console.log(`${path} written`);
    if (to) { await sendMail({ to, ...sent[name] }); console.log(`${name} sent to the address given`); }
  }
}

main().then(() => process.exit(0), (error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
