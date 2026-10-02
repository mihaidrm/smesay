// The one mail transport (stories/E2-1). SMTP through nodemailer, configured by MAIL_SMTP_URL:
// smtp://localhost:1025 is the compose Mailpit (decision 0006); at the launch gate it becomes
// Resend's SMTP endpoint, smtps://resend:API_KEY@smtp.resend.com:465 (resend.com/docs/send-with-
// smtp: host smtp.resend.com, username resend, password the API key, port 465 implicit TLS).
// createTransport(url) and sendMail: node_modules/nodemailer/dist/esm/nodemailer.d.ts;
// connection urls: dist/esm/shared/url.js. "memory:" keeps every message in memoryOutbox
// instead of sending, for the unit tests. A missing variable is named and nothing is sent.
import { createTransport, type Transporter } from "nodemailer";

export type Mail = { to: string; subject: string; text: string; html: string };
export const memoryOutbox: Mail[] = [];

let transporter: Transporter | null = null;

function env(name: "MAIL_SMTP_URL" | "EMAIL_FROM"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in (docs/setup.md).`);
  return value;
}

export async function sendMail(mail: Mail): Promise<void> {
  const url = env("MAIL_SMTP_URL");
  const from = env("EMAIL_FROM");
  if (url === "memory:") { memoryOutbox.push(mail); return; }
  transporter ??= createTransport(url);
  await transporter.sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
}
