import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getApiKey(key: string): Promise<string | undefined> {
  // Check process.env first
  if (process.env[key]) return process.env[key];

  // Then check database
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    if (row?.value) {
      process.env[key] = row.value;
      return row.value;
    }
  } catch {
    // table might not exist yet
  }
  return undefined;
}
