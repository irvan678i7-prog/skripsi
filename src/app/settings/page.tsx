export const dynamic = "force-dynamic";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  let settings: Record<string, string> = {};
  try {
    const rows = await db.select().from(appSettings);
    for (const row of rows) {
      settings[row.key] = row.key.includes("KEY")
        ? (row.value.length > 8 ? row.value.slice(0, 4) + "****" + row.value.slice(-4) : "****")
        : row.value;
    }
  } catch {
    // table might not exist
  }
  return <SettingsClient initialSettings={settings} />;
}
