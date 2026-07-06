export const dynamic = "force-dynamic";

import { db } from "@/db";
import { projects, chapters, citations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProjectClient from "@/components/ProjectClient";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) notFound();

  const chaptersData = await db
    .select()
    .from(chapters)
    .where(eq(chapters.projectId, id))
    .orderBy(asc(chapters.chapterNumber));

  const citationsData = await db
    .select()
    .from(citations)
    .where(eq(citations.projectId, id));

  return (
    <ProjectClient
      project={{
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }}
      chapters={chaptersData.map((c) => ({
        ...c,
        content: c.content ?? "",
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))}
      citations={citationsData.map((c) => ({
        ...c,
        verified: c.verified ?? false,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
