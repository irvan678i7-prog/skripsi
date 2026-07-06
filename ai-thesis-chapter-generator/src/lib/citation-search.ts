import type { AcademicSource } from "./types";

// ---- Crossref API ----
async function searchCrossref(query: string, rows = 5): Promise<AcademicSource[]> {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${rows}&sort=relevance&order=desc`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SkripsiGenerator/1.0 (mailto:admin@example.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.message?.items ?? [];
    return items.map((item: Record<string, unknown>) => {
      const authorArr = (item.author as Array<{ given?: string; family?: string }>) ?? [];
      const authors = authorArr
        .map((a) => [a.given, a.family].filter(Boolean).join(" "))
        .join(", ");
      const published = item["published-print"] ?? item["published-online"] ?? item.created;
      const dateParts = (published as { "date-parts"?: number[][] })?.["date-parts"]?.[0];
      const year = dateParts?.[0]?.toString() ?? "";
      return {
        title: Array.isArray(item.title) ? (item.title as string[])[0] : String(item.title ?? ""),
        authors: authors || "Unknown",
        year,
        doi: item.DOI ? String(item.DOI) : undefined,
        url: item.DOI ? `https://doi.org/${item.DOI}` : undefined,
        publisher: item.publisher ? String(item.publisher) : undefined,
        source: "crossref" as const,
        abstract: item.abstract ? String(item.abstract).replace(/<[^>]*>/g, "").slice(0, 300) : undefined,
      };
    });
  } catch {
    console.error("Crossref search failed");
    return [];
  }
}

// ---- Semantic Scholar API ----
async function searchSemanticScholar(query: string, limit = 5): Promise<AcademicSource[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,externalIds,url,abstract,venue`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const papers = data?.data ?? [];
    return papers.map((p: Record<string, unknown>) => {
      const authorArr = (p.authors as Array<{ name?: string }>) ?? [];
      const authors = authorArr.map((a) => a.name ?? "").join(", ");
      const externalIds = p.externalIds as Record<string, string> | undefined;
      const doi = externalIds?.DOI ?? undefined;
      return {
        title: String(p.title ?? ""),
        authors: authors || "Unknown",
        year: p.year ? String(p.year) : "",
        doi,
        url: doi ? `https://doi.org/${doi}` : (p.url ? String(p.url) : undefined),
        publisher: p.venue ? String(p.venue) : undefined,
        source: "semantic_scholar" as const,
        abstract: p.abstract ? String(p.abstract).slice(0, 300) : undefined,
      };
    });
  } catch {
    console.error("Semantic Scholar search failed");
    return [];
  }
}

// ---- Google Books API ----
async function searchGoogleBooks(query: string, maxResults = 5): Promise<AcademicSource[]> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books&orderBy=relevance`;
    if (apiKey) url += `&key=${apiKey}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.items ?? [];
    return items.map((item: Record<string, unknown>) => {
      const vol = item.volumeInfo as Record<string, unknown>;
      const authors = Array.isArray(vol.authors)
        ? (vol.authors as string[]).join(", ")
        : "Unknown";
      const industryIds = vol.industryIdentifiers as Array<{ type: string; identifier: string }> | undefined;
      const isbn = industryIds?.find((id) => id.type === "ISBN_13")?.identifier ??
        industryIds?.find((id) => id.type === "ISBN_10")?.identifier;
      return {
        title: String(vol.title ?? ""),
        authors,
        year: vol.publishedDate ? String(vol.publishedDate).slice(0, 4) : "",
        doi: undefined,
        url: vol.infoLink ? String(vol.infoLink) : (isbn ? `https://books.google.com/books?vid=ISBN${isbn}` : undefined),
        publisher: vol.publisher ? String(vol.publisher) : undefined,
        source: "google_books" as const,
        abstract: vol.description ? String(vol.description).slice(0, 300) : undefined,
      };
    });
  } catch {
    console.error("Google Books search failed");
    return [];
  }
}

// ---- Combined search ----
export async function searchAllSources(
  keywords: string[],
  maxPerSource = 4
): Promise<AcademicSource[]> {
  const query = keywords.join(" ");
  const [crossref, semantic, books] = await Promise.all([
    searchCrossref(query, maxPerSource),
    searchSemanticScholar(query, maxPerSource),
    searchGoogleBooks(query, maxPerSource),
  ]);

  // Deduplicate by title similarity
  const all = [...crossref, ...semantic, ...books];
  const unique: AcademicSource[] = [];
  const seen = new Set<string>();

  for (const src of all) {
    const key = src.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!seen.has(key) && src.title.length > 3) {
      seen.add(key);
      unique.push(src);
    }
  }

  return unique;
}

// ---- Verify a single citation ----
export async function verifyCitation(citation: {
  doi?: string | null;
  title: string;
  source: string;
}): Promise<{ verified: boolean; message: string }> {
  // Try DOI verification first
  if (citation.doi) {
    try {
      const url = `https://api.crossref.org/works/${encodeURIComponent(citation.doi)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "SkripsiGenerator/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        return { verified: true, message: "DOI terverifikasi di Crossref" };
      }
    } catch {
      // continue to title search
    }
  }

  // Fallback: search by title
  try {
    const results = await searchCrossref(citation.title, 1);
    if (results.length > 0) {
      const titleMatch = results[0].title.toLowerCase();
      const orig = citation.title.toLowerCase();
      if (titleMatch.includes(orig.slice(0, 30)) || orig.includes(titleMatch.slice(0, 30))) {
        return { verified: true, message: "Judul ditemukan di Crossref" };
      }
    }
    const semResults = await searchSemanticScholar(citation.title, 1);
    if (semResults.length > 0) {
      return { verified: true, message: "Judul ditemukan di Semantic Scholar" };
    }
  } catch {
    // ignore
  }

  return { verified: false, message: "Sitasi tidak dapat diverifikasi dari database akademik" };
}
