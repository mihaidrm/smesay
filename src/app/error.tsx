"use client";
// The 500 page of every page outside /app and the respondent links (stories/E11-6, acceptance
// 1): the landing page, the legal pages, sign-in. error.md (node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/error.md).
import { ServerError } from "@/components/app/server-error";

export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ServerError retry={retry} />;
}
