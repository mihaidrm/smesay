"use client";
// The sidebar's Feedback item (stories/E17-1, acceptance 1): a NavLink that carries the page
// it was pressed on (?from=), so the report says which page it is about. On the feedback page
// itself the link is plain, so NavLink marks it current.
import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/app/nav-link";
import { FEEDBACK_COPY } from "@/lib/feedback-copy";

export function FeedbackLink() {
  const path = usePathname();
  const href = path.startsWith("/app/feedback") ? "/app/feedback" : `/app/feedback?from=${encodeURIComponent(path)}`;
  return <NavLink href={href} icon={<MessageSquare aria-hidden="true" />}>{FEEDBACK_COPY.nav}</NavLink>;
}
