import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(appSettings);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.key.includes("KEY") ? maskKey(row.value) : row.value;
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };

  if (!key || typeof value !== "string") {
    return NextResponse.json({ error: "Key and value required" }, { status: 400 });
  }

  const allowed = ["GROQ_API_KEY", "GOOGLE_BOOKS_API_KEY"];
  if (!allowed.includes(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, key));

  if (existing) {
    await db
      .update(appSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value });
  }

  // Also set as process env so it's available immediately
  process.env[key] = value;

  return NextResponse.json({ success: true, key, masked: maskKey(value) });
}

function maskKey(v: string): string {
  if (v.length <= 8) return "****";
  return v.slice(0, 4) + "****" + v.slice(-4);
}
