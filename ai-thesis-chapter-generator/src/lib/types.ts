export interface ProjectInput {
  title: string;
  department: string;
  method: "kualitatif" | "kuantitatif" | "campuran";
  citationStyle: "APA7" | "Vancouver" | "Chicago" | "IEEE";
}

export interface Project {
  id: string;
  title: string;
  department: string;
  method: string;
  citationStyle: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  chapterNumber: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  id: string;
  chapterId: string;
  projectId: string;
  source: string;
  title: string;
  authors: string;
  year: string | null;
  doi: string | null;
  url: string | null;
  publisher: string | null;
  verified: boolean;
  rawData: unknown;
  createdAt: string;
}

export interface ChapterVersion {
  id: number;
  chapterId: string;
  content: string;
  versionNumber: number;
  createdAt: string;
}

export const CHAPTER_TITLES: Record<number, string> = {
  1: "Pendahuluan",
  2: "Tinjauan Pustaka",
  3: "Metodologi Penelitian",
  4: "Hasil dan Pembahasan",
  5: "Penutup",
};

export interface AcademicSource {
  title: string;
  authors: string;
  year: string;
  doi?: string;
  url?: string;
  publisher?: string;
  source: "crossref" | "semantic_scholar" | "google_books";
  abstract?: string;
}
