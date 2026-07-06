import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, chapters, citations, chapterVersions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractKeywords, generateChapter } from "@/lib/ai-generate";
import { searchAllSources } from "@/lib/citation-search";
import { CHAPTER_TITLES } from "@/lib/types";

export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { id, chapterId } = await params;

  // Load project and chapter
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.projectId, id)));
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Update status to generating
  await db
    .update(chapters)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(chapters.id, chapterId));

  try {
    // Step 1: Extract keywords
    const keywords = await extractKeywords(project.title, project.department);

    // Step 2: Search academic sources
    const sources = await searchAllSources(keywords, 5);

    if (sources.length === 0) {
      await db
        .update(chapters)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(chapters.id, chapterId));
      return NextResponse.json(
        { error: "Tidak ditemukan sumber akademik. Coba judul yang lebih spesifik." },
        { status: 422 }
      );
    }

    // Step 3: Generate chapter with Claude
    const content = await generateChapter({
      chapterNumber: chapter.chapterNumber,
      chapterTitle: CHAPTER_TITLES[chapter.chapterNumber],
      thesisTitle: project.title,
      department: project.department,
      method: project.method,
      citationStyle: project.citationStyle,
      sources,
    });

    // Step 4: Save chapter content
    await db
      .update(chapters)
      .set({ content, status: "done", updatedAt: new Date() })
      .where(eq(chapters.id, chapterId));

    // Step 5: Save version
    const existingVersions = await db
      .select()
      .from(chapterVersions)
      .where(eq(chapterVersions.chapterId, chapterId));
    await db.insert(chapterVersions).values({
      chapterId,
      content,
      versionNumber: existingVersions.length + 1,
    });

    // Step 6: Save citations
    // Delete old citations for this chapter
    await db.delete(citations).where(eq(citations.chapterId, chapterId));

    for (const src of sources) {
      await db.insert(citations).values({
        chapterId,
        projectId: id,
        source: src.source,
        title: src.title,
        authors: src.authors,
        year: src.year || null,
        doi: src.doi || null,
        url: src.url || null,
        publisher: src.publisher || null,
        verified: true,
        rawData: src,
      });
    }

    // Reload
    const [updatedChapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId));
    const updatedCitations = await db
      .select()
      .from(citations)
      .where(eq(citations.chapterId, chapterId));

    return NextResponse.json({
      chapter: updatedChapter,
      citations: updatedCitations,
      keywords,
      sourcesFound: sources.length,
    });
  } catch (err) {
    console.error("Generate error:", err);
    await db
      .update(chapters)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(chapters.id, chapterId));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal generate bab" },
      { status: 500 }
    );
  }
}
