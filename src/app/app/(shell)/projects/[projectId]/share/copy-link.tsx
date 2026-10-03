"use client";
// The link with its Copy button (stories/E6-1, acceptance 1): the clipboard API
// (developer.mozilla.org/docs/Web/API/Clipboard/writeText), "Copied." for two seconds; the
// link is also a plain read-only field, so it can be selected where the clipboard is denied.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SHARE_COPY } from "@/lib/sharing-copy";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={url} aria-label={SHARE_COPY.linkLabel} onFocus={(e) => e.currentTarget.select()} className="h-9 min-w-0 grow rounded-lg border border-hairline-strong bg-ground px-3 font-mono text-[13px] text-ink" data-testid="share-link" />
      <Button type="button" variant="secondary" size="small" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the field stays selectable */ } }}>
        {copied ? SHARE_COPY.copied : SHARE_COPY.copy}
      </Button>
    </div>
  );
}
