"use client";
// The error state of everything under /app, the shell's layout included: an error.tsx wraps the
// segments below it, not its own layout (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/error.md, "does not wrap the layout.js above it in the same segment"), so
// it sits at the /app segment. Copy: the 500 row of docs/copy/errors.md (stories/E11-6).
import { ServerError } from "@/components/app/server-error";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ServerError retry={retry} />;
}
