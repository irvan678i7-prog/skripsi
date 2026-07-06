import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCitation } from "@/lib/citation-search";

export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const allCitations = await db
    .select()
    .from(citations)
    .where(eq(citations.projectId, id));

  const results = [];

  for (const cit of allCitations) {
    const result = await verifyCitation({
      doi: cit.doi,
      title: cit.title,
      source: cit.source,
    });

    await db
      .update(citations)
      .set({ verified: result.verified })
      .where(eq(citations.id, cit.id));

    results.push({
      id: cit.id,
      title: cit.title,
      verified: result.verified,
      message: result.message,
    });
  }

  return NextResponse.json({ results });
}
