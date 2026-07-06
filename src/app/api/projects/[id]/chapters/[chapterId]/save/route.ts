import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, chapterVersions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { id, chapterId } = await params;
  const { content } = await req.json();

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.projectId, id)));

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Save version
  const existingVersions = await db
    .select()
    .from(chapterVersions)
    .where(eq(chapterVersions.chapterId, chapterId));

  await db.insert(chapterVersions).values({
    chapterId,
    content,
    versionNumber: existingVersions.length + 1,
  });

  // Update chapter
  await db
    .update(chapters)
    .set({ content, updatedAt: new Date(), status: content ? "done" : "pending" })
    .where(eq(chapters.id, chapterId));

  return NextResponse.json({ success: true });
}
