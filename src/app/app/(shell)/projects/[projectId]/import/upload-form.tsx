"use client";
// The upload card (stories/E3-2, acceptance 1 and 4): one file input, xlsx or csv, and the
// Upload button. The size is checked here first (the same limit the server applies, so a 20 MB
// file gets the message without the round trip) and again on the server. The error of the last
// attempt shows inline under the input. useActionState: react.dev/reference/react/useActionState.
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UPLOAD_COPY } from "@/lib/import/copy";
import { SIZE_MAX, formatBytes } from "@/lib/import/limits";
import { uploadAction, type ProjectFormState } from "../../actions";

export function UploadForm({ projectId, hasUpload }: { projectId: string; hasUpload: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(uploadAction, { error: null, saved: false });
  const [clientError, setClientError] = useState<string | null>(null);
  const error = clientError ?? state.error;
  return (
    <form action={action} noValidate className="flex flex-col gap-3" onSubmit={(e) => {
      const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file && file.size > SIZE_MAX) {
        e.preventDefault();
        setClientError(UPLOAD_COPY.tooBig(file.size));
      } else setClientError(null);
    }}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="upload-file" className="text-[13px]">{hasUpload ? "Upload another file" : "Your file"}</Label>
        <p className="text-[13px] text-ink-muted">xlsx or csv, up to {formatBytes(SIZE_MAX)} and 2,000 rows. One item per row; the columns are mapped on the next card.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input id="upload-file" name="file" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="text-sm" aria-describedby={error ? "upload-error" : undefined} />
          <Button type="submit" loading={pending}>Upload</Button>
        </div>
      </div>
      {error && <p id="upload-error" role="alert" className="text-sm text-danger">{error}</p>}
    </form>
  );
}
