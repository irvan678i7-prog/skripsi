"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconLogo, IconRocket, IconFolder, IconBolt, IconCheck,
  IconBook, IconDownload, IconHistory, IconSearch,
  IconKey, IconWarning, IconSpinner, IconCog, IconShield, IconChevronRight, IconPencil,
} from "./Icons";

interface ProjectSummary {
  id: string;
  title: string;
  department: string;
  method: string;
  citationStyle: string;
  createdAt: string;
  updatedAt: string;
}

export default function HomeClient({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [method, setMethod] = useState<"kualitatif" | "kuantitatif" | "campuran">("kuantitatif");
  const [citationStyle, setCitationStyle] = useState("APA7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !department.trim()) {
      setError("Judul dan jurusan wajib diisi!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, department, method, citationStyle }),
      });
      if (!res.ok) throw new Error("Gagal membuat project");
      const project = await res.json();
      router.push(`/project/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen stripe-bg">
      {/* HEADER */}
      <header className="bg-white border-b-4 border-brutal-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconLogo className="w-11 h-11 text-brutal-border brutal-shadow" />
            <div>
              <h1 className="font-bold text-xl md:text-2xl tracking-tight text-brutal-border">
                Skripsi Generator
              </h1>
              <p className="text-xs text-brutal-border/50 font-medium tracking-wide flex items-center gap-1">
                <IconBolt className="w-3 h-3 text-neon-yellow" />
                AI-Powered Draft Machine — 100% Gratis
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="bg-brutal-border text-white font-bold text-xs px-4 py-2.5 border-2 border-brutal-border brutal-shadow brutal-btn flex items-center gap-2 uppercase tracking-wide"
          >
            <IconKey className="w-4 h-4" />
            Pengaturan API
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* DISCLAIMER */}
        <div className="mb-8 bg-neon-yellow/20 border-3 border-brutal-border brutal-shadow p-4">
          <div className="flex gap-3 items-start">
            <IconWarning className="w-5 h-5 text-neon-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-brutal-border font-bold text-sm">Disclaimer Penting</p>
              <p className="text-brutal-border/70 text-xs leading-relaxed mt-1">
                Aplikasi ini adalah <span className="bg-brutal-border text-white px-1 py-0.5 font-bold text-[10px]">ALAT BANTU DRAF AWAL</span>.
                Pengguna WAJIB memverifikasi ulang seluruh isi dan sitasi sebelum submit ke kampus.
                Patuhi aturan integritas akademik institusi masing-masing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* FORM */}
          <div className="lg:col-span-3">
            <div className="bg-white border-3 border-brutal-border brutal-shadow-lg p-6">
              <h2 className="font-bold text-lg uppercase tracking-wide mb-6 flex items-center gap-2 text-brutal-border">
                <span className="bg-neon-lime text-brutal-border px-2 py-1 text-xs font-bold border-2 border-brutal-border brutal-shadow-sm inline-block rotate-[-1deg]">NEW</span>
                Buat Project Skripsi
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-brutal-border">
                    Judul Skripsi <span className="text-neon-pink">*</span>
                  </label>
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='Contoh: "Pengaruh Media Sosial terhadap Minat Baca Mahasiswa di Era Digital"'
                    className="w-full bg-brutal-bg border-3 border-brutal-border text-brutal-border px-4 py-3 text-sm placeholder-brutal-border/30 focus:outline-none focus:ring-0 focus:border-neon-pink focus:bg-neon-pink/5 transition-colors font-medium"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-brutal-border">
                    Jurusan / Bidang Studi <span className="text-neon-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Ilmu Komunikasi, Teknik Informatika, Manajemen"
                    className="w-full bg-brutal-bg border-3 border-brutal-border text-brutal-border px-4 py-3 text-sm placeholder-brutal-border/30 focus:outline-none focus:ring-0 focus:border-neon-pink focus:bg-neon-pink/5 transition-colors font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-brutal-border/70">
                      Metode Penelitian
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as "kualitatif" | "kuantitatif" | "campuran")}
                      className="w-full bg-brutal-bg border-3 border-brutal-border text-brutal-border px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan transition-colors font-bold cursor-pointer"
                    >
                      <option value="kuantitatif">Kuantitatif</option>
                      <option value="kualitatif">Kualitatif</option>
                      <option value="campuran">Campuran (Mixed Method)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-brutal-border/70">
                      Gaya Sitasi
                    </label>
                    <select
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value)}
                      className="w-full bg-brutal-bg border-3 border-brutal-border text-brutal-border px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan transition-colors font-bold cursor-pointer"
                    >
                      <option value="APA7">APA 7th Edition</option>
                      <option value="Vancouver">Vancouver</option>
                      <option value="Chicago">Chicago</option>
                      <option value="IEEE">IEEE</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-neon-pink/10 border-3 border-neon-pink p-3 flex items-center gap-2">
                    <IconX className="w-4 h-4 text-neon-pink flex-shrink-0" />
                    <p className="text-neon-pink font-bold text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-lime hover:bg-neon-yellow disabled:bg-gray-200 disabled:text-gray-400 text-brutal-border font-bold py-4 px-6 text-base uppercase tracking-wider border-3 border-brutal-border brutal-shadow-lg brutal-btn flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <IconSpinner className="w-5 h-5" /> Membuat Project...
                    </>
                  ) : (
                    <>
                      <IconRocket className="w-5 h-5" /> Buat Project Skripsi
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent */}
            <div className="bg-white border-3 border-brutal-border brutal-shadow p-5">
              <h2 className="font-bold text-base uppercase tracking-wide mb-4 flex items-center gap-2 text-brutal-border">
                <IconFolder className="w-5 h-5 text-neon-pink" />
                Project Terbaru
              </h2>
              {projects.length === 0 ? (
                <div className="border-2 border-dashed border-brutal-border/20 p-6 text-center">
                  <IconFolder className="w-8 h-8 text-brutal-border/20 mx-auto mb-2" />
                  <p className="text-brutal-border/40 text-sm font-bold">Belum ada project.</p>
                  <p className="text-brutal-border/30 text-xs mt-1">Buat project pertamamu!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/project/${p.id}`)}
                      className="w-full text-left bg-brutal-bg border-2 border-brutal-border hover:border-neon-pink p-4 brutal-shadow-sm brutal-btn group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="bg-brutal-border text-white font-bold text-xs w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-brutal-border text-sm font-bold group-hover:text-neon-pink transition line-clamp-2">
                            {p.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[10px] text-brutal-border bg-neon-cyan/20 px-2 py-0.5 font-bold border border-neon-cyan/30">
                              {p.department}
                            </span>
                            <span className="text-[10px] text-brutal-border/40 font-mono">
                              {new Date(p.createdAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                        <IconChevronRight className="w-4 h-4 text-brutal-border/30 group-hover:text-neon-pink transition flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-white border-3 border-brutal-border brutal-shadow p-5">
              <h3 className="font-bold uppercase tracking-wide mb-4 text-brutal-border text-sm">Fitur Utama</h3>
              <ul className="space-y-3">
                {[
                  { icon: <IconBolt className="w-4 h-4" />, text: "Generate draf Bab 1–5 dengan AI Groq (GRATIS)", color: "text-neon-lime bg-neon-lime/10 border-neon-lime/30" },
                  { icon: <IconBook className="w-4 h-4" />, text: "Sitasi dari Crossref, Semantic Scholar, Google Books", color: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30" },
                  { icon: <IconShield className="w-4 h-4" />, text: "Verifikasi sitasi otomatis via DOI", color: "text-neon-green bg-neon-green/10 border-neon-green/30" },
                  { icon: <IconPencil className="w-4 h-4" />, text: "Editor teks dengan autosave ke database", color: "text-neon-yellow bg-neon-yellow/10 border-neon-yellow/30" },
                  { icon: <IconDownload className="w-4 h-4" />, text: "Export ke .docx format skripsi standar", color: "text-neon-orange bg-neon-orange/10 border-neon-orange/30" },
                  { icon: <IconHistory className="w-4 h-4" />, text: "Riwayat versi tiap bab (undo/redo)", color: "text-neon-purple bg-neon-purple/10 border-neon-purple/30" },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center border ${f.color} flex-shrink-0`}>{f.icon}</span>
                    <span className="text-sm font-medium text-brutal-border">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* API SETUP */}
        <div className="mt-10 bg-white border-3 border-brutal-border brutal-shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base uppercase tracking-wide flex items-center gap-2 text-brutal-border">
              <IconKey className="w-5 h-5 text-neon-purple" />
              Setup API Keys — Semuanya GRATIS
            </h3>
            <button
              onClick={() => router.push("/settings")}
              className="bg-neon-purple text-white font-bold text-xs px-4 py-2 border-2 border-brutal-border brutal-shadow-sm brutal-btn uppercase flex items-center gap-1"
            >
              <IconCog className="w-3.5 h-3.5" />
              Buka Pengaturan
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Groq AI",
                desc: "Daftar gratis di console.groq.com — tanpa kartu kredit",
                env: "GROQ_API_KEY",
                borderColor: "border-neon-lime",
                badge: "WAJIB",
                badgeColor: "bg-neon-lime text-brutal-border",
                steps: ["1. Buka console.groq.com", "2. Daftar dengan email", "3. Buat API Key", "4. Paste di Pengaturan"],
              },
              {
                name: "Crossref",
                desc: "Gratis tanpa API key. Otomatis aktif untuk jurnal internasional.",
                env: null,
                borderColor: "border-neon-cyan",
                badge: "OTOMATIS",
                badgeColor: "bg-neon-cyan text-brutal-border",
                steps: null,
              },
              {
                name: "Semantic Scholar",
                desc: "Gratis tanpa API key. Otomatis aktif untuk paper akademik.",
                env: null,
                borderColor: "border-neon-yellow",
                badge: "OTOMATIS",
                badgeColor: "bg-neon-yellow text-brutal-border",
                steps: null,
              },
              {
                name: "Google Books",
                desc: "Bisa tanpa key. Untuk rate limit lebih tinggi, buat key di Google Cloud Console.",
                env: "GOOGLE_BOOKS_API_KEY",
                borderColor: "border-neon-orange",
                badge: "OPSIONAL",
                badgeColor: "bg-neon-orange text-white",
                steps: null,
              },
            ].map((api) => (
              <div key={api.name} className={`bg-brutal-bg border-2 ${api.borderColor} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${api.badgeColor} px-2 py-0.5 text-[10px] font-bold border border-brutal-border`}>
                    {api.badge}
                  </span>
                  <span className="font-bold text-sm text-brutal-border">{api.name}</span>
                </div>
                <p className="text-brutal-border/60 text-xs leading-relaxed">{api.desc}</p>
                {api.steps && (
                  <ol className="mt-2 space-y-0.5">
                    {api.steps.map((step, i) => (
                      <li key={i} className="text-[10px] text-brutal-border/50 font-mono">{step}</li>
                    ))}
                  </ol>
                )}
                {api.env && (
                  <code className="block mt-2 text-xs bg-white px-2 py-1 border border-brutal-border/20 font-mono text-brutal-border/60">
                    {api.env}
                  </code>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center pb-8">
          <div className="inline-block bg-white border-2 border-brutal-border/20 px-6 py-3">
            <p className="text-brutal-border/40 text-xs font-mono">
              SKRIPSI GENERATOR v1.0 — Powered by Groq AI + Crossref + Semantic Scholar + Google Books
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
