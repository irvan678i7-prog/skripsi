export const dynamic = "force-dynamic";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  let existingProjects: Array<{
    id: string;
    title: string;
    department: string;
    method: string;
    citationStyle: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    existingProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(20);
  } catch {
    // table might not exist yet
  }

  return <HomeClient projects={existingProjects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))} />;
}
