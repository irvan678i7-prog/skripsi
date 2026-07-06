import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapterVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { chapterId } = await params;

  const versions = await db
    .select()
    .from(chapterVersions)
    .where(eq(chapterVersions.chapterId, chapterId))
    .orderBy(desc(chapterVersions.versionNumber));

  return NextResponse.json(versions);
}
