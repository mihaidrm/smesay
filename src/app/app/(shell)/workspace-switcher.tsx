"use client";
// The workspace switcher (stories/E2-3, acceptance 3): the design system's Select (shadcn on
// Base UI, src/components/ui/select.tsx) showing the current name with a chevron; picking
// another workspace submits the switch action, which sets the session's workspace and
// returns to the project list, so every list changes on that next request.
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { switchWorkspace } from "../actions";

export function WorkspaceSwitcher({ current, options }: { current: string; options: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select value={current} onValueChange={(value) => {
      if (!value || value === current) return;
      const data = new FormData();
      data.set("workspaceId", String(value));
      startTransition(() => switchWorkspace(data));
    }}>
      <SelectTrigger aria-label="Workspace" disabled={pending} className="h-8 w-full border-0 bg-transparent px-0 font-medium shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
