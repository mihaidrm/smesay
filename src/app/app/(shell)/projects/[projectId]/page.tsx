// A project's address opens its current step: Import until the list is in (stories/E3-1).
import { redirect } from "next/navigation";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/app/projects/${projectId}/import`);
}
