import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, chapters } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CHAPTER_TITLES } from "@/lib/types";

export async function GET() {
  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));
  return NextResponse.json(allProjects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, department, method, citationStyle } = body;

  if (!title || !department || !method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [project] = await db
    .insert(projects)
    .values({
      title,
      department,
      method,
      citationStyle: citationStyle || "APA7",
    })
    .returning();

  // Create 5 chapters
  const chapterRows = [];
  for (let i = 1; i <= 5; i++) {
    chapterRows.push({
      projectId: project.id,
      chapterNumber: i,
      title: `Bab ${i}: ${CHAPTER_TITLES[i]}`,
      content: "",
      status: "pending",
    });
  }
  await db.insert(chapters).values(chapterRows);

  return NextResponse.json(project, { status: 201 });
}
