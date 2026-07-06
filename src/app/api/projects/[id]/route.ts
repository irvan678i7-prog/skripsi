import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, chapters, citations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chaptersData = await db
    .select()
    .from(chapters)
    .where(eq(chapters.projectId, id))
    .orderBy(asc(chapters.chapterNumber));

  const citationsData = await db
    .select()
    .from(citations)
    .where(eq(citations.projectId, id));

  return NextResponse.json({ project, chapters: chaptersData, citations: citationsData });
}
