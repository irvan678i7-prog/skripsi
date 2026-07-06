"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project, Chapter, Citation, ChapterVersion } from "@/lib/types";
import { CHAPTER_TITLES } from "@/lib/types";

interface Props {
  project: Project;
  chapters: Chapter[];
  citations: Citation[];
}

export default function ProjectClient({ project, chapters: initialChapters, citations: initialCitations }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1);
  const [chaptersState, setChapters] = useState<Chapter[]>(initialChapters);
  const [citationsState, setCitations] = useState<Citation[]>(initialCitations);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [verifyResults, setVerifyResults] = useState<Array<{ id: string; title: string; verified: boolean; message: string }>>([]);
  const [showVerifyResults, setShowVerifyResults] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChapter = chaptersState.find((c) => c.chapterNumber === activeTab);
  const chapterCitations = citationsState.filter((c) => activeChapter && c.chapterId === activeChapter.id);

  const autoSave = useCallback(
    async (content: string) => {
      if (!activeChapter) return;
      setSaving(true);
      try {
        await fetch(`/api/projects/${project.id}/chapters/${activeChapter.id}/save`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        setChapters((prev) =>
          prev.map((c) =>
            c.id === activeChapter.id
              ? { ...c, content, status: content ? "done" : "pending", updatedAt: new Date().toISOString() }
              : c
          )
        );
      } catch { /* silent */ } finally { setSaving(false); }
    },
    [activeChapter, project.id]
  );

  const handleContentChange = (v: string) => {
    setEditContent(v);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(v), 2000);
  };

  const handleGenerate = async () => {
    if (!activeChapter) return;
    setGenerating(true); setError(""); setSuccessMsg("");
    try {
      const res = await fetch(`/api/projects/${project.id}/chapters/${activeChapter.id}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate bab");
      setChapters((prev) => prev.map((c) => (c.id === activeChapter.id ? data.chapter : c)));
      setCitations((prev) => [...prev.filter((c) => c.chapterId !== activeChapter.id), ...data.citations]);
      setEditContent(data.chapter.content);
      setIsEditing(false);
      setSuccessMsg(`Bab berhasil di-generate! ${data.sourcesFound} sumber ditemukan.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setGenerating(false); }
  };

  const handleVerify = async () => {
    setVerifying(true); setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}/verify-citations`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal verifikasi");
      setVerifyResults(data.results); setShowVerifyResults(true);
      setCitations((prev) => prev.map((c) => { const r = data.results.find((x: { id: string }) => x.id === c.id); return r ? { ...c, verified: r.verified } : c; }));
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal verifikasi"); }
    finally { setVerifying(false); }
  };

  const loadVersions = async () => {
    if (!activeChapter) return;
    try { const res = await fetch(`/api/projects/${project.id}/chapters/${activeChapter.id}/versions`); setVersions(await res.json()); setShowVersions(true); } catch { /* */ }
  };

  const restoreVersion = (content: string) => { setEditContent(content); setIsEditing(true); setShowVersions(false); autoSave(content); };

  useEffect(() => {
    if (activeChapter) { setEditContent(activeChapter.content); setIsEditing(false); setShowVersions(false); setShowVerifyResults(false); setError(""); setSuccessMsg(""); }
  }, [activeTab, activeChapter]);

  const completedCount = chaptersState.filter((c) => c.status === "done").length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                &larr; Kembali
              </button>
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 text-sm md:text-base truncate">{project.title}</h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{project.department}</span>
                  <span>•</span>
                  <span>{project.method}</span>
                  <span>•</span>
                  <span>{project.citationStyle}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {saving && <span className="text-green-600 text-xs font-medium">Tersimpan...</span>}
              <button onClick={() => window.open(`/api/projects/${project.id}/export`, "_blank")} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-md transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Word
              </button>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Progress:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(completedCount / 5) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-600 font-medium">{completedCount}/5 bab</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((num) => {
            const ch = chaptersState.find((c) => c.chapterNumber === num);
            const isActive = activeTab === num;
            const isDone = ch?.status === "done";
            return (
              <button key={num} onClick={() => setActiveTab(num)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                  isActive ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {isDone && <span className="text-green-500 mr-1">✓</span>}
                BAB {num}: {CHAPTER_TITLES[num]}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeChapter && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Chapter Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">BAB {activeChapter.chapterNumber}: {CHAPTER_TITLES[activeChapter.chapterNumber]}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activeChapter.status === "done" ? "Selesai" : activeChapter.status === "generating" ? "Sedang generate..." : "Belum dibuat"}
                        {" • "}Update: {new Date(activeChapter.updatedAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleGenerate} disabled={generating}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium text-sm px-4 py-2 rounded-md transition">
                        {generating ? "Generating..." : activeChapter.content ? "Re-generate" : "Generate Bab Ini"}
                      </button>
                      {activeChapter.content && (
                        <>
                          <button onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditContent(activeChapter.content); }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-4 py-2 rounded-md transition">
                            {isEditing ? "Preview" : "Edit"}
                          </button>
                          <button onClick={loadVersions}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-4 py-2 rounded-md transition">
                            Riwayat
                          </button>
                        </>
                      )}
                      <button onClick={handleVerify} disabled={verifying || citationsState.length === 0}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium text-sm px-4 py-2 rounded-md transition">
                        {verifying ? "Verifikasi..." : "Cek Sitasi"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {error && <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
                {successMsg && <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">{successMsg}</div>}

                {/* Generating */}
                {generating && (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 font-medium">Sedang menghasilkan BAB {activeChapter.chapterNumber}...</p>
                    <p className="text-gray-400 text-sm mt-1">Mencari sumber akademik dan menyusun draf</p>
                  </div>
                )}

                {/* Versions Modal */}
                {showVersions && (
                  <div className="mx-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Riwayat Versi</h3>
                      <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    {versions.length === 0 ? <p className="text-gray-500 text-sm">Belum ada versi.</p> : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {versions.map((v) => (
                          <div key={v.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">Versi {v.versionNumber} - {new Date(v.createdAt).toLocaleString("id-ID")}</span>
                            <button onClick={() => restoreVersion(v.content)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Restore</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Verify Results */}
                {showVerifyResults && (
                  <div className="mx-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Hasil Verifikasi Sitasi</h3>
                      <button onClick={() => setShowVerifyResults(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {verifyResults.map((r) => (
                        <div key={r.id} className={`p-2 rounded border text-sm ${r.verified ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <span className={r.verified ? "text-green-700" : "text-red-700"}>{r.verified ? "✓" : "✗"} {r.title}</span>
                          <p className="text-gray-500 text-xs mt-0.5">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {activeChapter.content || isEditing ? (
                    isEditing ? (
                      <div>
                        <textarea value={editContent} onChange={(e) => handleContentChange(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm font-mono text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                          rows={30} placeholder="Tulis konten bab..." />
                        <div className="flex justify-end mt-3">
                          <button onClick={() => autoSave(editContent)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-md">
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none" style={{ fontFamily: "'Times New Roman', serif" }}>
                        <WordPreview content={activeChapter.content} />
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 mb-4">Bab ini belum di-generate</p>
                      <button onClick={handleGenerate} disabled={generating}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-md">
                        Generate BAB {activeChapter.chapterNumber}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-28">
              <h3 className="font-semibold text-gray-900 mb-3">Sumber Referensi ({chapterCitations.length})</h3>
              {chapterCitations.length === 0 ? (
                <p className="text-gray-400 text-sm">Generate bab untuk melihat sumber.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {chapterCitations.map((cit) => (
                    <div key={cit.id} className={`p-3 rounded-md border text-sm ${cit.verified ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
                      <p className="font-medium text-gray-800 line-clamp-2">{cit.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{cit.authors} ({cit.year || "n.d."})</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          cit.source === "crossref" ? "bg-blue-100 text-blue-700" : 
                          cit.source === "semantic_scholar" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {cit.source === "crossref" ? "Crossref" : cit.source === "semantic_scholar" ? "Semantic Scholar" : "Google Books"}
                        </span>
                        {(cit.url || cit.doi) && (
                          <a href={cit.url || `https://doi.org/${cit.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">
                            {cit.doi ? "DOI" : "Link"} ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeChapter?.content && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 text-sm mb-2">Statistik</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="font-semibold text-gray-900">{activeChapter.content.split(/\s+/).length}</p>
                      <p className="text-gray-500 text-xs">Kata</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="font-semibold text-gray-900">{chapterCitations.length}</p>
                      <p className="text-gray-500 text-xs">Sitasi</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Word-like Preview Renderer */
function WordPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith("<<<TABLE_START>>>")) {
      i++;
      const tableNameLine = lines[i]?.trim() || "";
      i++;
      
      const tableRows: string[][] = [];
      while (i < lines.length && !lines[i].trim().startsWith("<<<TABLE_END>>>")) {
        const row = lines[i].split("|").map(c => c.trim());
        if (row.length > 1) tableRows.push(row);
        i++;
      }
      i++; // skip TABLE_END
      
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="my-4">
            <p className="text-center font-bold text-sm mb-2">Tabel: {tableNameLine.replace(/_/g, " ")}</p>
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {tableRows[0].map((cell, idx) => (
                    <th key={idx} className="border border-gray-400 px-3 py-2 text-left font-bold">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-gray-400 px-3 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={i} className="h-4" />);
      i++;
      continue;
    }

    // Headings
    if (trimmed.match(/^#{1,3}\s/) || trimmed.match(/^\d+\.\d+(\.\d+)?\s/)) {
      let level = 1;
      let text = trimmed;
      
      if (trimmed.startsWith("### ")) { level = 3; text = trimmed.slice(4); }
      else if (trimmed.startsWith("## ")) { level = 2; text = trimmed.slice(3); }
      else if (trimmed.startsWith("# ")) { level = 1; text = trimmed.slice(2); }
      else if (trimmed.match(/^\d+\.\d+\.\d+\s/)) { level = 3; }
      else if (trimmed.match(/^\d+\.\d+\s/)) { level = 2; }
      
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      const style = level === 1 
        ? "text-lg font-bold mt-6 mb-3 text-center uppercase" 
        : level === 2 
          ? "text-base font-bold mt-5 mb-2" 
          : "text-sm font-bold mt-4 mb-2";
      
      elements.push(<Tag key={i} className={style}>{text}</Tag>);
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\)\s/.test(trimmed) || /^[a-z]\)\s/.test(trimmed)) {
      elements.push(
        <p key={i} className="ml-8 mb-2 text-justify" style={{ textIndent: "-1.5em", paddingLeft: "1.5em" }}>
          {renderInline(trimmed)}
        </p>
      );
      i++;
      continue;
    }

    // Bullet or numbered list
    if (/^[-•]\s/.test(trimmed) || /^\d+\.\s[A-Z]/.test(trimmed)) {
      elements.push(
        <p key={i} className="ml-8 mb-2 text-justify" style={{ textIndent: "-1em", paddingLeft: "1em" }}>
          {renderInline(trimmed)}
        </p>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="mb-3 text-justify leading-relaxed" style={{ textIndent: "2em" }}>
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="text-gray-800" style={{ fontSize: "12pt", lineHeight: "1.5" }}>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;
    
    // Italic
    const italicParts = part.split(/(_[^_]+_)/g);
    return italicParts.map((ip, j) => {
      const italicMatch = ip.match(/^_(.+)_$/);
      if (italicMatch) return <em key={`${i}-${j}`}>{italicMatch[1]}</em>;
      return <span key={`${i}-${j}`}>{ip}</span>;
    });
  });
}
