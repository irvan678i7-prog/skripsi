import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  serial,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  method: text("method").notNull(),
  citationStyle: text("citation_style").notNull().default("APA7"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  content: text("content").default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const citations = pgTable("citations", {
  id: uuid("id").defaultRandom().primaryKey(),
  chapterId: uuid("chapter_id")
    .references(() => chapters.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  year: text("year"),
  doi: text("doi"),
  url: text("url"),
  publisher: text("publisher"),
  verified: boolean("verified").default(false),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chapterVersions = pgTable("chapter_versions", {
  id: serial("id").primaryKey(),
  chapterId: uuid("chapter_id")
    .references(() => chapters.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  versionNumber: integer("version_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
